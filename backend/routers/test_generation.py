from typing import List

from fastapi import APIRouter, HTTPException

from schemas.test_generation import (
    GenerateModulesRequest,
    GenerateModulesResponse,
    GenerateTestCasesRequest,
    GenerateTestCasesResponse,
    TestCase,
)
from services.fallbacks import fallback_modules_from_story, fallback_test_cases
from services.groq_client import call_groq

router = APIRouter(tags=["test-generation"])


@router.post("/generate-modules", response_model=GenerateModulesResponse)
def generate_modules(req: GenerateModulesRequest) -> GenerateModulesResponse:
    """
    Use Groq to extract high-level modules from a user story.
    """
    system_prompt = (
        "You are a senior QA and software architect. "
        "Given the following user story or set of user stories, "
        "identify 3-8 high-level functional modules. "
        "Return ONLY a JSON array of strings (module names), no explanation, no markdown."
    )
    user_prompt = f"User story:\n{req.user_story}"

    try:
        raw_text = call_groq(system_prompt, user_prompt)
    except Exception:
        # Fallback: derive simple modules without LLM so the app still works.
        modules = fallback_modules_from_story(req.user_story)
        return GenerateModulesResponse(modules=modules)

    # Be defensive: the LLM might already return JSON, or plain text list.
    modules: List[str] = []
    try:
        # Try to parse as JSON array first
        import json

        parsed = json.loads(raw_text)
        if isinstance(parsed, list):
            modules = [str(m).strip() for m in parsed if str(m).strip()]
    except Exception:  # noqa: BLE001
        # Fallback: split by newlines or commas
        for line in raw_text.splitlines():
            name = line.strip(" -•\t")
            if name:
                modules.append(name)

    if not modules:
        raise HTTPException(
            status_code=500,
            detail="LLM did not return any modules.",
        )

    return GenerateModulesResponse(modules=modules)


@router.post("/generate-test-cases", response_model=GenerateTestCasesResponse)
def generate_test_cases(req: GenerateTestCasesRequest) -> GenerateTestCasesResponse:
    """
    Use Groq to generate structured test cases for a selected module + user story.
    """
    system_prompt = (
        "You are a senior QA engineer. "
        "Generate a concise set of high-quality functional test cases as JSON. "
        "Return ONLY a JSON array of objects with keys: "
        "id (integer), title (string), steps (string with line breaks), expected_result (string). "
        "Do not include any explanation, markdown, or extra keys."
    )
    user_prompt = (
        f"User story:\n{req.user_story}\n\n"
        f"Selected module: {req.module}\n\n"
        "Generate test cases that cover happy path, edge cases, and validation."
    )

    try:
        raw_text = call_groq(system_prompt, user_prompt)
    except Exception:
        # Fallback: deterministic test cases if Groq is unavailable.
        test_cases = fallback_test_cases(req.user_story, req.module)
        return GenerateTestCasesResponse(test_cases=test_cases)

    import json

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse LLM JSON: {raw_text}",
        ) from exc

    if not isinstance(parsed, list):
        raise HTTPException(
            status_code=500,
            detail="LLM response is not a JSON array.",
        )

    test_cases: List[TestCase] = []
    for idx, item in enumerate(parsed, start=1):
        if not isinstance(item, dict):
            continue
        tc = TestCase(
            id=int(item.get("id", idx)),
            title=str(item.get("title", f"Test case {idx}")),
            steps=str(item.get("steps", "")),
            expected_result=str(item.get("expected_result", "")),
        )
        test_cases.append(tc)

    if not test_cases:
        raise HTTPException(
            status_code=500,
            detail="LLM did not return any test cases.",
        )

    return GenerateTestCasesResponse(test_cases=test_cases)

