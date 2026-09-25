from fastapi import FastAPI
import logging
from app.routes import complaints, health, stats

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

from app.routes import complaints, health

app = FastAPI(title="CivicPulse")

app.include_router(complaints.router)
app.include_router(health.router)
app.include_router(stats.router)