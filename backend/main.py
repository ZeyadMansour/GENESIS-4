"""
GENESIS-4 Backend — FastAPI Server
Deployed on Render (free tier)
Triple-sandbox architecture: Pyodide (on-device) + Piston (cloud) + Terminal UI
"""

import os
import json
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from agent.core import GenesisAgent
from agent.llm import LLMProvider
from agent.memory import MemoryStore
from agent.tools import ToolRegistry
from agent.skills import SkillManager
from agent.cron import CronScheduler
from agent.subagent import SubagentManager
from gateway.telegram import TelegramGateway

load_dotenv()

# ── Lifespan ────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.memory = MemoryStore("genesis4_memory.db")
    await app.state.memory.initialize()
    app.state.tools = ToolRegistry()
    app.state.skills = SkillManager(app.state.memory)
    app.state.llm = LLMProvider()
    app.state.agent = GenesisAgent(
        llm=app.state.llm,
        memory=app.state.memory,
        tools=app.state.tools,
        skills=app.state.skills,
    )
    app.state.cron = CronScheduler(app.state.agent)
    app.state.subagent = SubagentManager(app.state.agent)
    app.state.telegram = TelegramGateway(app.state.agent)
    app.state.active_connections: dict[str, WebSocket] = {}

    app.state.cron.start()

    yield

    app.state.cron.stop()

app = FastAPI(title="GENESIS-4 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ──────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    model: str | None = None
    reasoning: bool = True

class SkillCreate(BaseModel):
    name: str
    description: str
    code: str

class CronJobCreate(BaseModel):
    schedule: str
    task: str
    platform: str = "app"

class MemoryEntry(BaseModel):
    key: str
    value: str
    category: str = "general"

# ── REST Endpoints ──────────────────────────────────────
@app.get("/")
async def root():
    return {
        "status": "online",
        "agent": "GENESIS-4",
        "version": "1.0.0",
        "architecture": "triple-sandbox",
        "sandboxes": ["pyodide (on-device)", "piston (cloud)", "terminal (ui)"]
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/chat")
async def chat(req: ChatRequest):
    response = await app.state.agent.process(
        message=req.message,
        session_id=req.session_id,
        model=req.model,
        reasoning=req.reasoning,
    )
    return JSONResponse(content=response)

@app.get("/api/memory")
async def get_memories():
    entries = await app.state.memory.get_all()
    return JSONResponse(content={"memories": entries})

@app.post("/api/memory")
async def add_memory(entry: MemoryEntry):
    await app.state.memory.set(entry.key, entry.value, entry.category)
    return JSONResponse(content={"status": "stored"})

@app.delete("/api/memory/{key}")
async def delete_memory(key: str):
    await app.state.memory.delete(key)
    return JSONResponse(content={"status": "deleted"})

@app.get("/api/skills")
async def get_skills():
    skills = await app.state.skills.list_all()
    return JSONResponse(content={"skills": skills})

@app.post("/api/skills")
async def create_skill(skill: SkillCreate):
    result = await app.state.skills.create(skill.name, skill.description, skill.code)
    return JSONResponse(content=result)

@app.delete("/api/skills/{name}")
async def delete_skill(name: str):
    await app.state.skills.delete(name)
    return JSONResponse(content={"status": "deleted"})

@app.get("/api/cron")
async def get_cron_jobs():
    jobs = app.state.cron.list_jobs()
    return JSONResponse(content={"jobs": jobs})

@app.post("/api/cron")
async def create_cron_job(job: CronJobCreate):
    result = app.state.cron.add(job.schedule, job.task, job.platform)
    return JSONResponse(content=result)

@app.delete("/api/cron/{job_id}")
async def delete_cron_job(job_id: str):
    app.state.cron.remove(job_id)
    return JSONResponse(content={"status": "removed"})

@app.get("/api/models")
async def get_models():
    models = app.state.llm.list_models()
    return JSONResponse(content={"models": models})

@app.post("/api/model")
async def set_model(model: str):
    app.state.llm.set_model(model)
    return JSONResponse(content={"status": "switched", "model": model})

@app.get("/api/subagents")
async def get_subagents():
    agents = app.state.subagent.list_all()
    return JSONResponse(content={"subagents": agents})

@app.post("/api/subagent")
async def spawn_subagent(task: str):
    result = await app.state.subagent.spawn(task)
    return JSONResponse(content=result)

@app.post("/api/execute")
async def execute_code(code: str, language: str = "python"):
    result = await app.state.tools.execute_sandboxed(code, language)
    return JSONResponse(content=result)

@app.get("/api/telegram/status")
async def telegram_status():
    status = app.state.telegram.get_status()
    return JSONResponse(content=status)

# ── WebSocket (Streaming Chat) ──────────────────────────
@app.websocket("/ws/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    await websocket.accept()
    app.state.active_connections[session_id] = websocket

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            async for chunk in app.state.agent.stream(
                message=msg.get("message", ""),
                session_id=session_id,
                model=msg.get("model"),
                reasoning=msg.get("reasoning", True),
            ):
                await websocket.send_text(json.dumps(chunk))

    except WebSocketDisconnect:
        app.state.active_connections.pop(session_id, None)
