"""
GENESIS-4 Telegram Gateway
Connects the agent to Telegram (free Bot API)
"""

import os

class TelegramGateway:
    def __init__(self, agent):
        self.agent = agent
        self.token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.active = bool(self.token)
        self.bot = None

    def get_status(self) -> dict:
        return {
            "platform": "telegram",
            "active": self.active,
            "configured": bool(self.token),
            "setup_instructions": (
                "1. Message @BotFather on Telegram\n"
                "2. Send /newbot and follow prompts\n"
                "3. Copy the token to TELEGRAM_BOT_TOKEN env var\n"
                "4. Redeploy on Render"
            ) if not self.token else None,
        }
