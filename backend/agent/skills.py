"""
GENESIS-4 Skill Manager
Autonomous skill creation, self-improvement, and management
Compatible with agentskills.io open standard
"""

import json
import re
from datetime import datetime

class SkillManager:
    def __init__(self, memory):
        self.memory = memory

    async def list_all(self) -> list[dict]:
        return await self.memory.get_skills()

    async def create(self, name: str, description: str, code: str) -> dict:
        await self.memory.store_skill(name, description, code)
        return {
            "name": name,
            "description": description,
            "status": "created",
            "standard": "agentskills.io compatible"
        }

    async def delete(self, name: str):
        # Soft delete via memory
        await self.memory.set(f"skill_deleted:{name}", datetime.now().isoformat(), "system")

    async def auto_generate(self, session: list[dict], response: str):
        """Auto-generate skills from complex successful interactions"""
        # Check if the interaction was complex enough to warrant a skill
        user_messages = [m["content"] for m in session if m["role"] == "user"]
        if len(user_messages) < 3:
            return  # Not complex enough

        # Look for patterns: code blocks, multi-step processes, data analysis
        code_blocks = re.findall(r'```(\w+)?\n(.*?)```', response, re.DOTALL)
        if not code_blocks:
            return

        # Generate a skill from the interaction
        last_user_msg = user_messages[-1]
        skill_name = self._generate_skill_name(last_user_msg)
        skill_desc = f"Auto-generated from: {last_user_msg[:100]}"
        skill_code = code_blocks[0][1] if code_blocks else response

        # Only create if it doesn't exist
        existing = await self.memory.get_skills()
        if not any(s["name"] == skill_name for s in existing):
            await self.memory.store_skill(skill_name, skill_desc, skill_code)

    def _generate_skill_name(self, text: str) -> str:
        """Generate a short skill name from user message"""
        # Simple heuristic: take first 3 meaningful words
        words = text.lower().split()[:5]
        name = "-".join(w for w in words if len(w) > 3)[:3]
        return name or "custom-skill"
