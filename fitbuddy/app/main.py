import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

# Support both package and direct execution
try:
    from .routes import router
except ImportError:
    from routes import router

app = FastAPI(
    title="FitBuddy - AI Workout Generator",
    description="Personalized 7-day workout and nutrition plan generator with adaptive feedback",
    version="1.0.0"
)

# Determine static files directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
if not os.path.exists(STATIC_DIR):
    STATIC_DIR = os.path.join(BASE_DIR, "..", "static")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
