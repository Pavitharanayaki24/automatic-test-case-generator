"use client";

// This is the main React client component for the homepage.
// It holds all state and wires together the 3 UI sections:
//   1) User story input   2) Generated modules   3) Generated test cases + export

import { useState } from "react";
import type { Module, TestCase } from "@/types/test-generation";
import { UserStoryInput } from "@/components/UserStoryInput";
import { ModulesSection } from "@/components/ModulesSection";
import { TestCasesSection } from "@/components/TestCasesSection";

export default function Home() {
  // --- React state for the whole page ---

  // Text the user types into the large \"User Story\" textarea
  const [userStoryText, setUserStoryText] = useState("");
  // Just the *name* of the uploaded .doc/.docx file (content not sent yet in this POC)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  // List of modules returned from the backend (e.g. Authentication, Payments)
  const [modules, setModules] = useState<Module[]>([]);
  // Which module card the user has clicked \"Generate Tests\" on
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  // Test cases for the currently selected module
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  // Loading state for the \"Generate Modules\" request
  const [isGeneratingModules, setIsGeneratingModules] = useState(false);
  // Loading state for the \"Generate Tests\" request
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  // Any error message to show at the bottom of the page
  const [error, setError] = useState<string | null>(null);

  // We only allow \"Generate Modules\" when either text is present OR a file was uploaded
  const hasInput = Boolean(userStoryText.trim() || uploadedFileName);

  // Called when the user picks (or clears) a .doc/.docx file
  const handleFileSelected = (file: File | null) => {
    if (!file) {
      setUploadedFileName(null);
      return;
    }
    // For this proof-of-concept we only keep the file *name*.
    // In a future version we could also upload the full file content to the backend.
    setUploadedFileName(file.name);
  };

  // Call backend /generate-modules to get high-level functional modules from the user story
  const handleGenerateModules = async () => {
    // Clear any previous error, set loading state and reset modules + test cases
    setError(null);
    setIsGeneratingModules(true);
    setModules([]);
    setSelectedModule(null);
    setTestCases([]);

    try {
      // Send POST request to the FastAPI backend with the user story text
      const res = await fetch("http://127.0.0.1:8000/generate-modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_story: userStoryText }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate modules from backend");
      }

      // Expected response shape: { modules: string[] }
      const data: { modules: string[] } = await res.json();
      const moduleNames: string[] = data.modules ?? [];

      // Convert plain strings into Module objects with numeric IDs for the UI
      setModules(
        moduleNames.map((name, index) => ({
          id: index + 1,
          name,
        }))
      );
    } catch (e) {
      console.error(e);
      setError("Failed to generate modules. Please try again.");
    } finally {
      setIsGeneratingModules(false);
    }
  };

  // Call backend /generate-test-cases for a specific selected module
  const handleGenerateTestCases = async (module: Module) => {
    // Clear error, set loading state and remember which module was chosen
    setError(null);
    setIsGeneratingTests(true);
    setSelectedModule(module);
    setTestCases([]);

    try {
      // Send POST request with both the user story and the chosen module name
      const res = await fetch("http://127.0.0.1:8000/generate-test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_story: userStoryText,
          module: module.name,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate test cases from backend");
      }

      // Expected response shape: { test_cases: TestCase[] }
      const data: { test_cases: TestCase[] } = await res.json();
      setTestCases(data.test_cases ?? []);
    } catch (e) {
      console.error(e);
      setError("Failed to generate test cases. Please try again.");
    } finally {
      setIsGeneratingTests(false);
    }
  };

  // Build a CSV file in the browser and trigger a download
  const handleDownloadCSV = () => {
    if (testCases.length === 0) return;

    // Column headers for the CSV file
    const header = ["ID", "Title", "Steps", "Expected Result"];
    // Map each test case into a row (array of values)
    const rows = testCases.map((tc) => [
      tc.id,
      tc.title,
      tc.steps.replace(/\n/g, "\\n"),
      tc.expectedResult,
    ]);

    // Join header + rows into a single CSV-formatted string
    const csvContent =
      [header, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n") + "\n";

    // Create a Blob and object URL so the browser can download it
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `test-cases-${selectedModule?.name ?? "module"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Similar to CSV export, but adds extra columns and uses .xlsx as the file extension
  // (Note: content is still CSV-style text; a real XLSX would use a specialized library.)
  const handleDownloadXLSX = () => {
    if (testCases.length === 0) return;

    // Header has additional columns Priority and Type
    const header = ["ID", "Title", "Steps", "Expected Result", "Priority", "Type"];
    // Derive a human-friendly test case ID (TC-001, TC-002, etc.) and default priority/type
    const rows = testCases.map((tc) => [
      `TC-${String(tc.id).padStart(3, "0")}`,
      tc.title,
      tc.steps.replace(/\n/g, "\\n"),
      tc.expectedResult,
      tc.priority ?? "High",
      tc.caseType ??
        (tc.title.toLowerCase().includes("invalid") ||
        tc.title.toLowerCase().includes("error")
          ? "Negative"
          : "Positive"),
    ]);

    // Generate CSV-style content again (but downloaded with .xlsx extension)
    const csvContent =
      [header, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n") + "\n";

    const blob = new Blob([csvContent], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `test-cases-${selectedModule?.name ?? "module"}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- JSX (the actual rendered UI) ---
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8">
        {/* Page title and short description */}
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Test Case Generator
          </h1>
          <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
            Enter a user story, generate modules, then create test cases — export
            to XLSX or CSV.
          </p>
        </header>

        {/* Section 1: user story text area + file upload + \"Generate Modules\" */}
        <UserStoryInput
          userStoryText={userStoryText}
          onUserStoryChange={setUserStoryText}
          uploadedFileName={uploadedFileName}
          onFileSelected={handleFileSelected}
          canGenerate={hasInput}
          onGenerate={handleGenerateModules}
          isGenerating={isGeneratingModules}
        />

        {/* Section 2: list of AI-generated modules (hidden until we have modules) */}
        <ModulesSection
          modules={modules}
          selectedModule={selectedModule}
          onModuleClick={handleGenerateTestCases}
        />

        {/* Section 3: test cases table for the selected module */}
        <TestCasesSection
          selectedModule={selectedModule}
          testCases={testCases}
          isGeneratingTests={isGeneratingTests}
          onRegenerate={() => {
            if (selectedModule) {
              void handleGenerateTestCases(selectedModule);
            }
          }}
          onDownloadCSV={handleDownloadCSV}
          onDownloadXLSX={handleDownloadXLSX}
        />

        {/* If an error occurred during any API call, show it at the bottom */}
        {error && (
          <p className="text-sm text-rose-400">
            <span className="font-medium">Error:</span> {error}
          </p>
        )}
      </main>
    </div>
  );
}
