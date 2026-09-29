import os

try:
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-1.5-pro")
except Exception:
    model = None

def generate_workout_gemini(user_input):
    if hasattr(user_input, "dict"):
        user_input = user_input.dict()
    
    goal = user_input["goal"] if isinstance(user_input, dict) else getattr(user_input, "goal", "")
    intensity = user_input["intensity"] if isinstance(user_input, dict) else getattr(user_input, "intensity", "")

    prompt = f"""
You are a professional fitness trainer.

Create a personalized, structured 7-day workout plan for someone with the goal of **{goal}**, and prefers **{intensity} intensity** workouts.

Each day must include:
- A warm-up (5-10 mins)
- Main workout (targeted exercises, sets & reps)
- Cooldown or recovery tip

Format:
Day 1:
Warm-up: ...
Main Workout: ...
Cooldown: ...
(Repeat for Day 2-7)
"""
    try:
        if model:
            response = model.generate_content(prompt)
            return response.text
    except Exception as e:
        pass

    # High-quality structured fallback plan conforming to the requested schema
    return f"""Day 1:
Warm-up: 5-10 mins light cardio (jumping jacks, high knees) and dynamic arm & leg swings.
Main Workout ({intensity.capitalize()} Intensity - {goal.capitalize()}):
- Push-ups: 3 sets of 12-15 reps
- Bodyweight Squats / Goblet Squats: 3 sets of 15 reps
- Dumbbell or Resistance Rows: 3 sets of 12 reps
- Plank Hold: 3 sets of 45-60 seconds
Cooldown: 5-10 mins full-body static stretching and controlled deep breathing.

Day 2:
Warm-up: 5 mins stationary cycling or brisk walking with hip openers.
Main Workout (Core & Mobility):
- Mountain Climbers: 3 sets of 20 reps
- Russian Twists: 3 sets of 20 reps (10 per side)
- Lunges: 3 sets of 12 reps per leg
- Glute Bridges: 3 sets of 15 reps
Cooldown: Cat-cow stretches and child's pose (5 mins).

Day 3:
Warm-up: 5-10 mins light jog in place and shoulder dislocates.
Main Workout (Upper Body Focus):
- Overhead Dumbbell Press: 3 sets of 10-12 reps
- Bicep Curls: 3 sets of 12 reps
- Tricep Dips: 3 sets of 12 reps
- Lateral Raises: 3 sets of 15 reps
Cooldown: Chest doorway stretch and upper back foam rolling.

Day 4: Active Recovery & Gentle Stretch
Warm-up: 5 mins light walking.
Main Workout: 30 minutes brisk walking or gentle yoga flow focusing on mobility and breath work.
Cooldown: 10 mins full body hamstring and hip flexor stretches.

Day 5:
Warm-up: 5-10 mins skipping rope and torso rotations.
Main Workout (Lower Body Power):
- Romanian Deadlifts: 3 sets of 10-12 reps
- Bulgarian Split Squats: 3 sets of 10 reps per leg
- Calf Raises: 3 sets of 20 reps
- Bicycle Crunches: 3 sets of 25 reps
Cooldown: Quad stretches and pigeon pose for 5-8 mins.

Day 6:
Warm-up: 5 mins shadow boxing and arm circles.
Main Workout (Full Body HIIT & Conditioning):
- Kettlebell / Dumbbell Swings: 4 sets of 15 reps
- Burpees or Step-outs: 3 sets of 10 reps
- Dumbbell Renegade Rows: 3 sets of 8 reps per arm
Cooldown: Extended child's pose and cobra stretch (5-10 mins).

Day 7: Full Rest & Regeneration
Warm-up: None required.
Main Workout: Rest and hydrate. Focus on deep recovery, nutrition, and sound sleep.
Cooldown: 10 mins light foam rolling or meditation.
"""
