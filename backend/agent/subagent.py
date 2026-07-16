"""
GENESIS-4 Subagent Manager
Isolated subagents with their own conversations and execution context
"""

import uuid
from datetime import datetime

class SubagentManager:
    def __init__(self, agent):
        self.agent = agent
        self.subagents: dict[str, dict] = {}

    async def spawn(self, task: str) -> dict:
        """Spawn an isolated subagent for a specific task"""
        agent_id = str(uuid.uuid4())[:8]

        self.subagents[agent_id] = {
            "id": agent_id,
            "task": task,
            "status": "running",
            "created": datetime.now().isoformat(),
            "session_id": f"subagent-{agent_id}",
        }

        # Execute task in isolated session
        result = await self.agent.process(
            message=f"[SUBAGENT TASK] {task}\nWork independently on this. Report back when complete.",
            session_id=f"subagent-{agent_id}",
        )

        self.subagents[agent_id]["status"] = "completed"
        self.subagents[agent_id]["result"] = result.get("content", "")[:500]
        self.subagents[agent_id]["completed"] = datetime.now().isoformat()

        return {
            "subagent_id": agent_id,
            "task": task,
            "status": "completed",
            "summary": result.get("content", "")[:300],
        }

    def list_all(self) -> list[dict]:
        return list(self.subagents.values())

    def get(self, agent_id: str) -> dict | None:
        return self.subagents.get(agent_id)
