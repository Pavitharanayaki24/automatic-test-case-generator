from typing import List

from schemas.test_generation import TestCase


def fallback_modules_from_story(user_story: str) -> list[str]:
    """
    Simple rule-based module extractor used when the LLM call fails.
    This keeps the app working for demos even without live AI.
    """
    story_lower = user_story.lower()
    modules: list[str] = []

    def add(name: str) -> None:
        if name not in modules:
            modules.append(name)

    if any(word in story_lower for word in ["login", "signin", "password", "auth"]):
        add("Authentication")
    if any(word in story_lower for word in ["register", "signup", "profile", "user"]):
        add("User Management")
    if any(word in story_lower for word in ["payment", "checkout", "order", "cart"]):
        add("Payments & Checkout")
    if any(word in story_lower for word in ["report", "dashboard", "analytics"]):
        add("Reporting & Analytics")
    if any(word in story_lower for word in ["search", "filter", "sort"]):
        add("Search & Filtering")

    if not modules:
        add("Core Functionality")

    return modules


def fallback_test_cases(user_story: str, module: str) -> List[TestCase]:
    """
    Simple deterministic test cases used when the LLM call fails.
    """
    base_steps = (
        "1. Navigate to the application\n"
        f"2. Go to the {module} area\n"
        "3. Perform the main action described in the user story\n"
        "4. Observe the result"
    )

    return [
        TestCase(
            id=1,
            title=f"Happy path for {module}",
            steps=base_steps,
            expected_result="The system behaves exactly as described in the user story.",
        ),
        TestCase(
            id=2,
            title=f"Validation errors in {module}",
            steps=(
                f"1. Go to the {module} area\n"
                "2. Provide invalid or missing input\n"
                "3. Submit the form or action\n"
                "4. Observe the validation feedback"
            ),
            expected_result="Clear validation messages are shown and invalid data is not accepted.",
        ),
        TestCase(
            id=3,
            title=f"Negative scenario for {module}",
            steps=(
                f"1. Attempt an action in {module} that should not be allowed\n"
                "2. Observe the system behaviour"
            ),
            expected_result="The system prevents the action and shows an appropriate error or message.",
        ),
    ]

