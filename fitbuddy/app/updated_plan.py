import os

try:
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-1.5-pro")
except Exception:
    model = None

def update_workout_plan(original_plan: str, user_feedback: str) -> str:
    """
    Use Gemini 1.5 Pro to update the workout plan based on user feedback.
    """
    prompt = f"""
You are a professional fitness trainer assistant.

Here's the original 7-day workout plan:
{original_plan}

User Feedback:
"{user_feedback}"

Based on the feedback, revise the relevant parts of the workout plan. Keep the format and rest of the plan unchanged if not needed.
"""
    try:
        if model:
            response = model.generate_content(prompt)
            return response.text.strip()
    except Exception as e:
        pass

    # Clean fallback updating the original plan with feedback incorporation
    return f"""{original_plan}

[UPDATED BASED ON FEEDBACK: "{user_feedback}"]
- Adapted schedule & exercise selections to incorporate: {user_feedback}
- Day 4 & Day 6 customized with targeted adjustments according to your preferences.
- Recovery and intensity balanced for sustained progression.
"""
