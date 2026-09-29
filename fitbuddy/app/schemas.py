from typing import Optional
from pydantic import BaseModel, Field

class WorkoutRequest(BaseModel):
    goal: str
    intensity: str

class UserInput(BaseModel):
    username: str
    user_id: int
    age: int
    weight: float
    goal: str
    intensity: str

    @property
    def name(self) -> str:
        return self.username

class FeedbackRequest(BaseModel):
    feedback: str
    original_plan: Optional[str] = None

class UserCreate(BaseModel):
    user_id: int
    name: str
    age: int
    weight: float
    goal: str
    intensity: str

class WorkoutPlanSchema(BaseModel):
    user_id: int
    original_plan: str
    updated_plan: Optional[str] = None
    nutrition_tip: Optional[str] = None
    feedback: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    age: int
    weight: float
    goal: str
    intensity: str
