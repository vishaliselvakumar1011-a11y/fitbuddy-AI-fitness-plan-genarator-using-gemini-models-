from .gemini_flash_generator import generate_nutrition_tip_with_flash

def generate_nutrition(goal: str) -> str:
    """
    Helper function to generate nutrition or recovery tip for a fitness goal.
    """
    return generate_nutrition_tip_with_flash(goal)
