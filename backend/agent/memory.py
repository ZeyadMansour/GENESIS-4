"""
GENESIS-4 Persistent Memory Store
SQLite + FTS5 full-text search — cross-session recall
Based on Hermes Agent memory architecture
"""

import aiosqlite
import json
from datetime import datetime

class MemoryStore:
    def __init__(self, db_path: str = "genesis4_memory.db"):
        self.db_path = db_path
        self.conn: aiosqlite.Connection | None = None

    async def initialize(self):
        self.conn = await aiosqlite.connect(self.db_path)
        self.conn.row_factory = aiosqlite.Row

        # Main memory table
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                access_count INTEGER DEFAULT 0
            )
        """)

        # FTS5 full-text search table
        await self.conn.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
                key, value, category,
                content='memories',
                content_rowid='id'
            )
        """)

        # Session interactions table
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_message TEXT NOT NULL,
                assistant_response TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # User profile table (Honcho-style dialectic modeling)
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS user_profile (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trait TEXT NOT NULL,
                value TEXT NOT NULL,
                confidence REAL DEFAULT 0.5,
                evidence TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Skills table
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS skills_store (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT NOT NULL,
                code TEXT NOT NULL,
                usage_count INTEGER DEFAULT 0,
                success_rate REAL DEFAULT 1.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Triggers to keep FTS index in sync
        await self.conn.execute("""
            CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
                INSERT INTO memories_fts(rowid, key, value, category)
                VALUES (new.id, new.key, new.value, new.category);
            END;
        """)
        await self.conn.execute("""
            CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
                INSERT INTO memories_fts(memories_fts, rowid, key, value, category)
                VALUES ('delete', old.id, old.key, old.value, old.category);
            END;
        """)
        await self.conn.execute("""
            CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
                INSERT INTO memories_fts(memories_fts, rowid, key, value, category)
                VALUES ('delete', old.id, old.key, old.value, old.category);
                INSERT INTO memories_fts(rowid, key, value, category)
                VALUES (new.id, new.key, new.value, new.category);
            END;
        """)

        await self.conn.commit()

    async def set(self, key: str, value: str, category: str = "general"):
        await self.conn.execute("""
            INSERT INTO memories (key, value, category, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                category = excluded.category,
                updated_at = CURRENT_TIMESTAMP,
                access_count = access_count + 1
        """, (key, value, category))
        await self.conn.commit()

    async def get(self, key: str) -> dict | None:
        cursor = await self.conn.execute("""
            UPDATE memories SET access_count = access_count + 1,
            updated_at = CURRENT_TIMESTAMP
            WHERE key = ?
        """, (key,))
        await self.conn.commit()

        cursor = await self.conn.execute(
            "SELECT * FROM memories WHERE key = ?", (key,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None

    async def delete(self, key: str):
        await self.conn.execute("DELETE FROM memories WHERE key = ?", (key,))
        await self.conn.commit()

    async def search(self, query: str, limit: int = 5) -> list[dict]:
        """FTS5 full-text search across all memories"""
        cursor = await self.conn.execute("""
            SELECT m.* FROM memories m
            INNER JOIN memories_fts fts ON m.id = fts.rowid
            WHERE memories_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        """, (query, limit))
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]

    async def get_all(self, category: str | None = None) -> list[dict]:
        if category:
            cursor = await self.conn.execute(
                "SELECT * FROM memories WHERE category = ? ORDER BY updated_at DESC",
                (category,)
            )
        else:
            cursor = await self.conn.execute(
                "SELECT * FROM memories ORDER BY updated_at DESC"
            )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]

    async def add_interaction(self, session_id: str, user_msg: str, assistant_msg: str):
        await self.conn.execute("""
            INSERT INTO interactions (session_id, user_message, assistant_response)
            VALUES (?, ?, ?)
        """, (session_id, user_msg, assistant_msg))
        await self.conn.commit()

    async def get_session_history(self, session_id: str, limit: int = 20) -> list[dict]:
        cursor = await self.conn.execute("""
            SELECT * FROM interactions
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, (session_id, limit))
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]

    async def update_user_profile(self, trait: str, value: str, confidence: float = 0.5):
        await self.conn.execute("""
            INSERT INTO user_profile (trait, value, confidence, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(trait) DO UPDATE SET
                value = excluded.value,
                confidence = excluded.confidence,
                updated_at = CURRENT_TIMESTAMP
        """, (trait, value, confidence))
        await self.conn.commit()

    async def get_user_profile(self) -> list[dict]:
        cursor = await self.conn.execute(
            "SELECT * FROM user_profile ORDER BY confidence DESC"
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]

    async def store_skill(self, name: str, description: str, code: str):
        await self.conn.execute("""
            INSERT INTO skills_store (name, description, code)
            VALUES (?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
                description = excluded.description,
                code = excluded.code,
                updated_at = CURRENT_TIMESTAMP
        """, (name, description, code))
        await self.conn.commit()

    async def get_skills(self) -> list[dict]:
        cursor = await self.conn.execute(
            "SELECT * FROM skills_store ORDER BY usage_count DESC"
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]

    async def increment_skill_usage(self, name: str, success: bool = True):
        await self.conn.execute("""
            UPDATE skills_store SET
                usage_count = usage_count + 1,
                success_rate = (success_rate * (usage_count - 1) + ?) / usage_count,
                updated_at = CURRENT_TIMESTAMP
            WHERE name = ?
        """, (1.0 if success else 0.0, name))
        await self.conn.commit()
