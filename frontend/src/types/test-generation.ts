export type Module = {
  id: number;
  name: string;
};

export type TestCase = {
  id: number;
  title: string;
  steps: string;
  expectedResult: string;
  // Optional fields used only for richer UI (priority badges, etc.)
  priority?: "High" | "Medium" | "Low";
  caseType?: "Positive" | "Negative" | "Edge";
};

