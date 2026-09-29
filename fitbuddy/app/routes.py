import os
from typing import Optional
from fastapi import APIRouter, Request, Form, HTTPException, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from .schemas import WorkoutRequest, UserInput, FeedbackRequest
from .database import (
    save_user,
    save_plan,
    update_plan,
    save_updated_plan,
    get_original_plan,
    get_user,
    get_plan,
    get_all_users,
    SessionLocal
)
from .gemini_generator import generate_workout_gemini
from .gemini_flash_generator import generate_nutrition_tip_with_flash
from .updated_plan import update_workout_plan

router = APIRouter()

# Locate templates directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
if not os.path.exists(TEMPLATE_DIR):
    TEMPLATE_DIR = os.path.join(BASE_DIR, "..", "templates")
templates = Jinja2Templates(directory=TEMPLATE_DIR)


# ==========================================
# Frontend Web Routes (HTML Templates)
# ==========================================

@router.get("/", response_class=HTMLResponse)
async def home_page(request: Request):
    """Renders the homepage form to collect user information and workout preferences."""
    return templates.TemplateResponse("index.html", {"request": request})


@router.post("/generate-workout", response_class=HTMLResponse)
async def generate_workout_form(
    request: Request,
    username: str = Form(...),
    user_id: int = Form(...),
    age: int = Form(...),
    weight: float = Form(...),
    goal: str = Form(...),
    intensity: str = Form(...)
):
    """
    Processes form input from index.html:
    1. Validates and saves user profile to SQLite database.
    2. Calls Gemini Pro to generate a 7-day personalized workout plan.
    3. Calls Gemini Flash to generate a practical nutrition & recovery tip.
    4. Saves the generated plan in the database.
    5. Renders result.html using pre blocks for structured output.
    """
    # 1. Save user details
    save_user(
        user_id=user_id,
        name=username,
        age=age,
        weight=weight,
        goal=goal,
        intensity=intensity
    )

    # 2. Generate workout plan via Gemini 1.5 Pro
    workout_plan = generate_workout_gemini({
        "goal": goal,
        "intensity": intensity
    })

    # 3. Generate nutrition tip via Gemini 1.5 Flash
    nutrition_tip = generate_nutrition_tip_with_flash(goal)

    # 4. Save workout plan
    save_plan(user_id=user_id, plan=workout_plan)

    # 5. Render result.html
    return templates.TemplateResponse("result.html", {
        "request": request,
        "username": username,
        "user_id": user_id,
        "age": age,
        "weight": weight,
        "goal": goal,
        "intensity": intensity,
        "workout_plan": workout_plan,
        "nutrition_tip": nutrition_tip,
        "updated_plan": None,
        "success_message": None
    })


@router.post("/submit-feedback", response_class=HTMLResponse)
async def submit_feedback_form(
    request: Request,
    user_id: int = Form(...),
    feedback: str = Form(...)
):
    """
    Processes user feedback on their existing plan:
    1. Retrieves the original plan for the user ID.
    2. Invokes Gemini 1.5 Pro to adjust the plan based on feedback.
    3. Saves the updated plan in the database as a separate field.
    4. Re-renders result.html showing the updated plan and confirmation message.
    """
    user = get_user(user_id)
    original_plan = get_original_plan(user_id)

    if not original_plan:
        # If no plan found, generate a baseline
        original_plan = generate_workout_gemini({
            "goal": user.goal if user else "general fitness",
            "intensity": user.intensity if user else "Medium"
        })
        save_plan(user_id, original_plan)

    updated_plan = update_workout_plan(original_plan, feedback)
    update_plan(user_id, updated_plan)

    goal = user.goal if user else "general fitness"
    nutrition_tip = generate_nutrition_tip_with_flash(goal)

    return templates.TemplateResponse("result.html", {
        "request": request,
        "username": user.name if user else f"User {user_id}",
        "user_id": user_id,
        "age": user.age if user else 25,
        "weight": user.weight if user else 70.0,
        "goal": user.goal if user else "General Fitness",
        "intensity": user.intensity if user else "Medium",
        "workout_plan": original_plan,
        "nutrition_tip": nutrition_tip,
        "updated_plan": updated_plan,
        "success_message": "Your plan has been updated based on your feedback!"
    })


@router.get("/view-all-users", response_class=HTMLResponse)
@router.get("/users", response_class=HTMLResponse)
def view_all_users(request: Request):
    """
    Admin View: Displays a list of all users and their respective plans
    using Jinja2's {% for user in users %} loop.
    """
    users = get_all_users()
    user_data = []
    for user in users:
        plan_obj = get_plan(user.id)
        original_plan = plan_obj.original_plan if plan_obj and plan_obj.original_plan else "N/A"
        updated_plan = plan_obj.updated_plan if plan_obj and plan_obj.updated_plan else "Not updated"
        user_data.append({
            "id": user.id,
            "name": user.name,
            "age": user.age,
            "weight": user.weight,
            "goal": user.goal,
            "intensity": user.intensity,
            "original_plan": original_plan,
            "updated_plan": updated_plan
        })

    return templates.TemplateResponse("all_users.html", {
        "request": request,
        "users": user_data
    })


# ==========================================
# REST API Endpoints
# ==========================================

@router.post("/generate-workout/gemini")
async def generate_gemini_workout(request: WorkoutRequest):
    """Direct API endpoint to generate workout plan with Gemini Pro."""
    try:
        result = generate_workout_gemini({
            "goal": request.goal,
            "intensity": request.intensity
        })
        return {"model": "gemini-pro", "workout_plan": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nutrition-tip")
def get_flash_tip(goal: str):
    """Direct API endpoint to generate nutrition tip with Gemini Flash."""
    tip = generate_nutrition_tip_with_flash(goal)
    return {"goal": goal, "nutrition_tip": tip}


@router.post("/generate-plan")
def generate_plan(user_data: UserInput):
    """Direct API endpoint to save user and generate plan."""
    try:
        save_user(
            user_id=user_data.user_id,
            name=user_data.username,
            age=user_data.age,
            weight=user_data.weight,
            goal=user_data.goal,
            intensity=user_data.intensity
        )
        plan = generate_workout_gemini({
            "goal": user_data.goal,
            "intensity": user_data.intensity
        })
        save_plan(user_data.user_id, plan)
        nutrition_tip = generate_nutrition_tip_with_flash(user_data.goal)
        return {
            "message": "Workout plan generated and saved successfully!",
            "workout_plan": plan,
            "nutrition_tip": nutrition_tip
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Something went wrong: {str(e)}")


@router.post("/update-plan/{user_id}", response_model=dict)
def update_user_plan(user_id: int, data: FeedbackRequest):
    """Direct API endpoint to update plan via user feedback."""
    original = get_original_plan(user_id)
    if not original:
        return {"error": "Original plan not found for this user."}
    updated = update_workout_plan(original, data.feedback)
    update_plan(user_id, updated)
    return {"updated_plan": updated}
