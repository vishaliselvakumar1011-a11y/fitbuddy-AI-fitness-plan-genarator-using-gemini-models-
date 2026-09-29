import os
import sqlite3
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fitbuddy.db")
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fitbuddy.db")
if not os.path.exists(os.path.dirname(DB_FILE)):
    DB_FILE = "fitbuddy.db"

try:
    from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text
    from sqlalchemy.orm import declarative_base, sessionmaker, relationship

    engine = create_engine("sqlite:///./fitbuddy.db", connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()

    class User(Base):
        __tablename__ = "users"
        id = Column(Integer, primary_key=True, index=True)
        name = Column(String, nullable=False)
        age = Column(Integer, nullable=False)
        weight = Column(Float, nullable=False)
        goal = Column(String, nullable=False)
        intensity = Column(String, nullable=False)
        schedule = Column(Integer, default=7)

    class WorkoutPlan(Base):
        __tablename__ = "workout_plans"
        id = Column(Integer, primary_key=True, index=True, autoincrement=True)
        user_id = Column(Integer, ForeignKey("users.id"))
        original_plan = Column(Text, nullable=False)
        updated_plan = Column(Text, nullable=True)
        nutrition_tip = Column(Text, nullable=True)
        feedback = Column(Text, nullable=True)
        created_at = Column(DateTime, default=datetime.utcnow)

    def init_db():
        Base.metadata.create_all(bind=engine)

    init_db()

    def save_user(user_id: int, name: str, age: int, weight: float, goal: str, intensity: str):
        db = SessionLocal()
        try:
            existing = db.query(User).filter_by(id=user_id).first()
            if existing:
                existing.name = name
                existing.age = age
                existing.weight = weight
                existing.goal = goal
                existing.intensity = intensity
            else:
                user = User(
                    id=user_id,
                    name=name,
                    age=age,
                    weight=weight,
                    goal=goal,
                    intensity=intensity,
                    schedule=7
                )
                db.add(user)
            db.commit()
        finally:
            db.close()

    def save_plan(user_id: int, plan: str):
        db = SessionLocal()
        try:
            existing = db.query(WorkoutPlan).filter_by(user_id=user_id).first()
            if existing:
                existing.original_plan = plan
            else:
                workout = WorkoutPlan(user_id=user_id, original_plan=plan)
                db.add(workout)
            db.commit()
        finally:
            db.close()

    def update_plan(user_id: int, updated_text: str):
        db = SessionLocal()
        try:
            workout = db.query(WorkoutPlan).filter_by(user_id=user_id).first()
            if workout:
                workout.updated_plan = updated_text
            else:
                workout = WorkoutPlan(user_id=user_id, original_plan="", updated_plan=updated_text)
                db.add(workout)
            db.commit()
        finally:
            db.close()

    def save_updated_plan(user_id: int, updated_plan: str):
        return update_plan(user_id, updated_plan)

    def get_original_plan(user_id: int):
        db = SessionLocal()
        try:
            plan = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == user_id).first()
            return plan.original_plan if plan else None
        finally:
            db.close()

    def get_user(user_id: int):
        db = SessionLocal()
        try:
            return db.query(User).filter(User.id == user_id).first()
        finally:
            db.close()

    def get_plan(user_id: int):
        db = SessionLocal()
        try:
            return db.query(WorkoutPlan).filter(WorkoutPlan.user_id == user_id).first()
        finally:
            db.close()

    def get_workout_plan(user_id: int):
        return get_plan(user_id)

    def get_all_users():
        db = SessionLocal()
        try:
            return db.query(User).all()
        finally:
            db.close()

except ImportError:
    # Pure sqlite3 fallback if SQLAlchemy is not installed
    def _get_conn():
        conn = sqlite3.connect("fitbuddy.db", check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db():
        conn = _get_conn()
        with conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                weight REAL NOT NULL,
                goal TEXT NOT NULL,
                intensity TEXT NOT NULL,
                schedule INTEGER DEFAULT 7
            )
            """)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS workout_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                original_plan TEXT NOT NULL,
                updated_plan TEXT,
                nutrition_tip TEXT,
                feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
            """)
        conn.close()

    init_db()

    class _DictObj:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def __getitem__(self, item):
            return getattr(self, item)

    def save_user(user_id: int, name: str, age: int, weight: float, goal: str, intensity: str):
        conn = _get_conn()
        with conn:
            cur = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,))
            if cur.fetchone():
                conn.execute(
                    "UPDATE users SET name = ?, age = ?, weight = ?, goal = ?, intensity = ? WHERE id = ?",
                    (name, age, weight, goal, intensity, user_id)
                )
            else:
                conn.execute(
                    "INSERT INTO users (id, name, age, weight, goal, intensity, schedule) VALUES (?, ?, ?, ?, ?, ?, 7)",
                    (user_id, name, age, weight, goal, intensity)
                )
        conn.close()

    def save_plan(user_id: int, plan: str):
        conn = _get_conn()
        with conn:
            cur = conn.execute("SELECT id FROM workout_plans WHERE user_id = ?", (user_id,))
            if cur.fetchone():
                conn.execute("UPDATE workout_plans SET original_plan = ? WHERE user_id = ?", (plan, user_id))
            else:
                conn.execute("INSERT INTO workout_plans (user_id, original_plan) VALUES (?, ?)", (user_id, plan))
        conn.close()

    def update_plan(user_id: int, updated_text: str):
        conn = _get_conn()
        with conn:
            cur = conn.execute("SELECT id FROM workout_plans WHERE user_id = ?", (user_id,))
            if cur.fetchone():
                conn.execute("UPDATE workout_plans SET updated_plan = ? WHERE user_id = ?", (updated_text, user_id))
            else:
                conn.execute("INSERT INTO workout_plans (user_id, original_plan, updated_plan) VALUES (?, '', ?)", (user_id, updated_text))
        conn.close()

    def save_updated_plan(user_id: int, updated_plan: str):
        return update_plan(user_id, updated_plan)

    def get_original_plan(user_id: int):
        conn = _get_conn()
        cur = conn.execute("SELECT original_plan FROM workout_plans WHERE user_id = ?", (user_id,))
        row = cur.fetchone()
        conn.close()
        return row["original_plan"] if row else None

    def get_user(user_id: int):
        conn = _get_conn()
        cur = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        conn.close()
        return _DictObj(**dict(row)) if row else None

    def get_plan(user_id: int):
        conn = _get_conn()
        cur = conn.execute("SELECT * FROM workout_plans WHERE user_id = ?", (user_id,))
        row = cur.fetchone()
        conn.close()
        return _DictObj(**dict(row)) if row else None

    def get_workout_plan(user_id: int):
        return get_plan(user_id)

    def get_all_users():
        conn = _get_conn()
        cur = conn.execute("SELECT * FROM users")
        rows = cur.fetchall()
        conn.close()
        return [_DictObj(**dict(r)) for r in rows]
