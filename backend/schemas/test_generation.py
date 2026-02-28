from typing import List

from pydantic import BaseModel


class GenerateModulesRequest(BaseModel):
    user_story: str


class GenerateModulesResponse(BaseModel):
    modules: List[str]


class GenerateTestCasesRequest(BaseModel):
    user_story: str
    module: str


class TestCase(BaseModel):
    id: int
    title: str
    steps: str
    expected_result: str


class GenerateTestCasesResponse(BaseModel):
    test_cases: List[TestCase]

