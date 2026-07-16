"""
GENESIS-4 Cron Scheduler
Natural-language scheduling with platform delivery
Uses APScheduler for reliable job execution
"""

import uuid
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

class CronScheduler:
    def __init__(self, agent):
        self.agent = agent
        self.scheduler = AsyncIOScheduler()
        self.jobs: dict[str, dict] = {}

    def start(self):
        self.scheduler.start()

    def stop(self):
        self.scheduler.shutdown()

    def add(self, schedule: str, task: str, platform: str = "app") -> dict:
        """Add a job using natural language schedule"""
        job_id = str(uuid.uuid4())[:8]

        # Parse natural language schedule into cron expression
        cron_expr = self._parse_schedule(schedule)

        self.jobs[job_id] = {
            "id": job_id,
            "schedule": schedule,
            "cron": cron_expr,
            "task": task,
            "platform": platform,
            "created": datetime.now().isoformat(),
            "next_run": None,
        }

        # Schedule the job
        trigger = CronTrigger.from_crontab(cron_expr)
        self.scheduler.add_job(
            self._execute_job,
            trigger=trigger,
            args=[job_id],
            id=job_id,
            name=f"GENESIS-4: {task[:50]}",
        )

        return self.jobs[job_id]

    def remove(self, job_id: str):
        if job_id in self.jobs:
            self.scheduler.remove_job(job_id)
            del self.jobs[job_id]

    def list_jobs(self) -> list[dict]:
        return list(self.jobs.values())

    async def _execute_job(self, job_id: str):
        """Execute a scheduled job"""
        job = self.jobs.get(job_id)
        if not job:
            return

        # Run the task through the agent
        result = await self.agent.process(
            message=f"[CRON JOB] {job['task']}",
            session_id=f"cron-{job_id}",
        )

        # Update last run
        self.jobs[job_id]["last_run"] = datetime.now().isoformat()
        self.jobs[job_id]["last_result"] = result.get("content", "")[:200]

    def _parse_schedule(self, natural: str) -> str:
        """Convert natural language schedule to cron expression"""
        nl = natural.lower()

        # Common patterns
        if "every morning" in nl or "daily" in nl:
            hour = self._extract_time(nl) or "8"
            return f"0 {hour} * * *"
        elif "every evening" in nl or "every night" in nl:
            hour = self._extract_time(nl) or "20"
            return f"0 {hour} * * *"
        elif "every hour" in nl:
            return "0 * * * *"
        elif "every monday" in nl:
            hour = self._extract_time(nl) or "9"
            return f"0 {hour} * * 1"
        elif "every friday" in nl:
            hour = self._extract_time(nl) or "17"
            return f"0 {hour} * * 5"
        elif "every weekend" in nl:
            return "0 9 * * 6,0"
        elif "every weekday" in nl:
            hour = self._extract_time(nl) or "9"
            return f"0 {hour} * * 1-5"
        elif "weekly" in nl:
            return "0 9 * * 0"
        elif "monthly" in nl:
            return "0 9 1 * *"
        else:
            # Default: daily at 9am
            return "0 9 * * *"

    def _extract_time(self, text: str) -> str | None:
        """Extract hour from natural language"""
        import re
        match = re.search(r'(\d{1,2})\s*(am|pm|:\d{2})', text)
        if match:
            hour = int(match.group(1))
            if "pm" in match.group(0) and hour < 12:
                hour += 12
            return str(hour)
        return None
