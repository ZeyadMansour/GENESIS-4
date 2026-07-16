"""
GENESIS-4 Tool Registry
Triple-sandbox execution routing:
- Pyodide (on-device WASM) — instant, no network
- Piston (cloud containers) — full packages, shell
- Web search, calculations, system tools
"""

import os
import json
import httpx
from datetime import datetime

class ToolRegistry:
    def __init__(self):
        self.piston_url = os.getenv("PISTON_API_URL", "https://genesis4-piston.onrender.com")
        self.tools = {
            "web_search": self.web_search,
            "execute_code": self.execute_code,
            "execute_pyodide": self.execute_pyodide,
            "execute_piston": self.execute_piston,
            "read_memory": self.read_memory,
            "write_memory": self.write_memory,
            "create_skill": self.create_skill,
            "spawn_subagent": self.spawn_subagent,
            "get_time": self.get_time,
            "calculate": self.calculate,
            "schedule_task": self.schedule_task,
        }

    async def execute(self, name: str, args: dict) -> dict:
        if name not in self.tools:
            return {"error": f"Unknown tool: {name}", "available": list(self.tools.keys())}
        try:
            return await self.tools[name](**args)
        except Exception as e:
            return {"error": str(e), "tool": name}

    async def web_search(self, query: str) -> dict:
        """Search the web using DuckDuckGo (free, no API key needed)"""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.get(
                    "https://api.duckduckgo.com/",
                    params={"q": query, "format": "json", "no_html": 1}
                )
                data = response.json()
                results = []
                for item in data.get("RelatedTopics", [])[:5]:
                    if "Text" in item:
                        results.append({
                            "title": item.get("FirstURL", ""),
                            "snippet": item["Text"],
                            "url": item.get("FirstURL", ""),
                        })
                return {"query": query, "results": results, "source": "DuckDuckGo"}
        except Exception as e:
            return {"error": str(e), "query": query}

    async def execute_code(self, code: str, language: str = "python") -> dict:
        """Smart router: light code → Pyodide hint, heavy code → Piston"""
        # For pure Python without imports, suggest Pyodide
        if language == "python" and not any(pkg in code for pkg in ["import ", "from "]):
            return {
                "routing": "pyodide_recommended",
                "message": "This code can run instantly on-device via Pyodide (zero latency). Use execute_pyodide for best performance.",
                "code": code,
            }
        # For code with imports or non-Python, route to Piston
        return await self.execute_piston(code, language)

    async def execute_pyodide(self, code: str) -> dict:
        """Python execution via Pyodide (on-device WASM).
        This is a server-side instruction — the actual execution happens
        in the browser via the Pyodide WASM runtime.
        The frontend will intercept this and run it locally."""
        return {
            "sandbox": "pyodide",
            "location": "on-device",
            "code": code,
            "instruction": "EXECUTE_ON_DEVICE",
            "note": "This code will run instantly in your browser via Pyodide (Python compiled to WebAssembly). No network latency."
        }

    async def execute_piston(self, code: str, language: str = "python") -> dict:
        """Execute code in Piston cloud sandbox (full packages, shell, 30+ languages)"""
        piston_lang_map = {
            "python": "python",
            "py": "python",
            "javascript": "javascript",
            "js": "javascript",
            "typescript": "typescript",
            "ts": "typescript",
            "bash": "bash",
            "sh": "bash",
            "shell": "bash",
            "ruby": "ruby",
            "go": "go",
            "rust": "rust",
            "cpp": "cpp",
            "c++": "cpp",
            "java": "java",
            "r": "r",
            "sql": "sqlite3",
        }
        piston_lang = piston_lang_map.get(language.lower(), language.lower())

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{self.piston_url}/api/v2/execute",
                    json={
                        "language": piston_lang,
                        "version": "*",
                        "files": [{"name": "main", "content": code}],
                        "stdin": "",
                        "args": [],
                        "compile_timeout": 10000,
                        "run_timeout": 30000,
                        "compile_memory_limit": -1,
                        "run_memory_limit": -1,
                    }
                )
                data = response.json()
                return {
                    "sandbox": "piston",
                    "location": "cloud",
                    "language": piston_lang,
                    "output": data.get("run", {}).get("stdout", ""),
                    "stderr": data.get("run", {}).get("stderr", ""),
                    "exit_code": data.get("run", {}).get("code", 0),
                }
        except Exception as e:
            return {"sandbox": "piston", "error": str(e)}

    async def read_memory(self, key: str) -> dict:
        """Placeholder — actual memory read happens in agent core"""
        return {"action": "read_memory", "key": key}

    async def write_memory(self, key: str, value: str, category: str = "general") -> dict:
        """Placeholder — actual memory write happens in agent core"""
        return {"action": "write_memory", "key": key, "category": category}

    async def create_skill(self, name: str, description: str, code: str) -> dict:
        """Placeholder — actual skill creation happens in agent core"""
        return {"action": "create_skill", "name": name, "status": "queued"}

    async def spawn_subagent(self, task: str) -> dict:
        """Placeholder — actual subagent spawning happens in agent core"""
        return {"action": "spawn_subagent", "task": task, "status": "queued"}

    async def get_time(self) -> dict:
        now = datetime.now()
        return {
            "datetime": now.isoformat(),
            "date": now.strftime("%Y-%m-%d"),
            "time": now.strftime("%H:%M:%S"),
            "timezone": "UTC",
            "day": now.strftime("%A"),
        }

    async def calculate(self, expression: str) -> dict:
        """Safely evaluate mathematical expressions"""
        import math
        allowed_names = {
            "abs": abs, "round": round, "min": min, "max": max,
            "sum": sum, "pow": pow, "sqrt": math.sqrt,
            "sin": math.sin, "cos": math.cos, "tan": math.tan,
            "log": math.log, "log10": math.log10, "log2": math.log2,
            "exp": math.exp, "floor": math.floor, "ceil": math.ceil,
            "pi": math.pi, "e": math.e, "tau": math.tau,
            "inf": math.inf, "nan": math.nan,
        }
        try:
            result = eval(expression, {"__builtins__": {}}, allowed_names)
            return {"expression": expression, "result": result}
        except Exception as e:
            return {"expression": expression, "error": str(e)}

    async def schedule_task(self, schedule: str, task: str) -> dict:
        """Placeholder — actual scheduling happens in cron module"""
        return {"action": "schedule_task", "schedule": schedule, "task": task, "status": "queued"}

    async def execute_sandboxed(self, code: str, language: str = "python") -> dict:
        """Direct sandboxed execution endpoint (used by /api/execute)"""
        return await self.execute_code(code, language)
