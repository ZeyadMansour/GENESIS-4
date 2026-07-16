"""
GENESIS-4 Agent Core — Self-improving AI agent loop
Based on NousResearch Hermes Agent architecture
Triple-sandbox execution: Pyodide (on-device) + Piston (cloud) + Terminal UI
"""

import json
import re
from datetime import datetime
from typing import AsyncIterator

SYSTEM_PROMPT = """You are GENESIS-4, a fourth-generation universal AI agent.

You run on a triple-sandbox architecture:
- Pyodide (Python in WebAssembly — runs ON the user's device, zero latency)
- Piston (cloud container sandbox — full pip packages, shell commands, 30+ languages)
- Terminal UI (xterm.js — exact replica of the desktop terminal experience)

You can use ANY language model as your brain — the user selects their provider and model.
You are currently running on the model the user has selected.

You have access to tools via <tool_call>{"name": "...", "arguments": {...}}</tool_call>:

Available tools:
- web_search(query: str) — Search the web via DuckDuckGo
- execute_code(code: str, language: str) — Smart router: light code → Pyodide (on-device), heavy → Piston (cloud)
- execute_pyodide(code: str) — Run Python instantly on-device (WASM, ~70% native speed, zero latency)
- execute_piston(code: str, language: str) — Run in cloud container (full pip packages, shell, 30+ languages)
- read_memory(key: str) — Read from persistent memory (SQLite + FTS5 full-text search)
- write_memory(key: str, value: str, category: str) — Write to persistent memory
- create_skill(name: str, description: str, code: str) — Create a reusable, self-improving skill
- spawn_subagent(task: str) — Delegate to an isolated subagent with its own context
- get_time() — Get current date and time
- calculate(expression: str) — Evaluate mathematical expressions safely
- schedule_task(schedule: str, task: str) — Schedule a cron job in natural language

Use  thinking...  response for reasoning mode. Be concise, helpful, creative, and aligned to the user.

You are GENESIS-4. The fourth generation has arrived."""


class GenesisAgent:
    def __init__(self, llm, memory, tools, skills):
        self.llm = llm
        self.memory = memory
        self.tools = tools
        self.skills = skills
        self.sessions: dict[str, list[dict]] = {}

    def _get_session(self, session_id: str) -> list[dict]:
        if session_id not in self.sessions:
            self.sessions[session_id] = [
                {"role": "system", "content": SYSTEM_PROMPT}
            ]
        return self.sessions[session_id]

    async def process(self, message: str, session_id: str = "default",
                      model: str | None = None, reasoning: bool = True) -> dict:
        if model:
            self.llm.set_model(model)

        session = self._get_session(session_id)

        # Inject relevant memories
        memories = await self.memory.search(message, limit=3)
        if memories:
            memory_text = "Relevant memories:\n" + "\n".join(
                f"- {m['key']}: {m['value']}" for m in memories
            )
            session.insert(1, {"role": "system", "content": memory_text})

        session.append({"role": "user", "content": message})

        response = await self.llm.chat(session, stream=False)
        assistant_text = response["choices"][0]["message"]["content"]

        # Execute tool calls
        assistant_text = await self._execute_tools(assistant_text, session_id)

        session.append({"role": "assistant", "content": assistant_text})

        # Auto-create skills from complex interactions
        await self.skills.auto_generate(session, assistant_text)

        # Store in memory
        await self.memory.add_interaction(session_id, message, assistant_text)

        return {
            "role": "assistant",
            "content": assistant_text,
            "session_id": session_id,
            "model": self.llm.active_model,
            "agent": "GENESIS-4",
        }

    async def stream(self, message: str, session_id: str = "default",
                     model: str | None = None, reasoning: bool = True) -> AsyncIterator[dict]:
        if model:
            self.llm.set_model(model)

        session = self._get_session(session_id)

        memories = await self.memory.search(message, limit=3)
        if memories:
            memory_text = "Relevant memories:\n" + "\n".join(
                f"- {m['key']}: {m['value']}" for m in memories
            )
            session.insert(1, {"role": "system", "content": memory_text})

        session.append({"role": "user", "content": message})

        full_text = ""
        stream = await self.llm.chat(session, stream=True)

        async for chunk_data in stream:
            try:
                chunk = json.loads(chunk_data)
                delta = chunk["choices"][0].get("delta", {})
                content = delta.get("content", "")
                if content:
                    full_text += content
                    yield {"type": "chunk", "content": content}
            except (json.JSONDecodeError, KeyError):
                continue

        tool_results = await self._execute_tools(full_text, session_id)
        if tool_results != full_text:
            yield {"type": "tool_result", "content": tool_results}
            full_text = tool_results

        session.append({"role": "assistant", "content": full_text})
        await self.memory.add_interaction(session_id, message, full_text)
        await self.skills.auto_generate(session, full_text)

        yield {"type": "done", "content": full_text}

    async def _execute_tools(self, text: str, session_id: str) -> str:
        pattern = r'<tool_call>(.*?)</tool_call>'
        matches = re.findall(pattern, text, re.DOTALL)

        for match in matches:
            try:
                tool_data = json.loads(match.strip())
                name = tool_data.get("name", "")
                args = tool_data.get("arguments", {})

                result = await self.tools.execute(name, args)

                replacement = f"\n<tool_response>\n{json.dumps(result, indent=2)}\n</tool_response>\n"
                text = text.replace(f"<tool_call>{match}</tool_call>", replacement, 1)

            except (json.JSONDecodeError, KeyError) as e:
                error_block = f"\n<tool_response>\n{{\"error\": \"{str(e)}\"}}\n</tool_response>\n"
                text = text.replace(f"<tool_call>{match}</tool_call>", error_block, 1)

        return text
