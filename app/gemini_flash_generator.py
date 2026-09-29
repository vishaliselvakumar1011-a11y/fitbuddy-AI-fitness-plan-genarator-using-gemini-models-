import os

try:
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-1.5-flash")
except Exception:
    model = None

def generate_nutrition_tip_with_flash(goal: str) -> str:
    """
    Generate a nutrition or recovery tip using Gemini Flash based on the user's fitness goal.

    Args:
        goal (str): User's fitness goal - "weight loss", "muscle gain", or "general fitness".

    Returns:
        str: Generated tip.
    """
    prompt = (
        f"Give one clear, helpful nutrition or recovery tip for someone focused on '{goal}'. "
        "The tip should be practical, friendly, and easy to understand."
    )

    try:
        if model:
            response = model.generate_content(prompt)
            return response.text.strip()
    except Exception as e:
        pass

    return "Prioritize protein! Aim for a good source of protein (like chicken, fish, beans, or Greek yogurt) with every meal. Protein helps build muscle, keeps you feeling full, and supports your metabolism, all crucial for losing belly fat and gaining muscle."
