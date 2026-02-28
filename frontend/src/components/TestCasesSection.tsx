import type { Module, TestCase } from "@/types/test-generation";

type Props = {
  selectedModule: Module | null;
  testCases: TestCase[];
  isGeneratingTests: boolean;
  onRegenerate: () => void;
  onDownloadCSV: () => void;
  onDownloadXLSX: () => void;
};

export function TestCasesSection({
  selectedModule,
  testCases,
  isGeneratingTests,
  onRegenerate,
  onDownloadCSV,
  onDownloadXLSX,
}: Props) {
  if (!selectedModule) return null;

  const total = testCases.length;

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-100">
            Test Cases —{" "}
            <span className="text-indigo-400">{selectedModule.name}</span>
            {total > 0 && (
              <span className="ml-1 text-xs text-zinc-500">({total})</span>
            )}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isGeneratingTests}
            className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-indigo-500 hover:text-indigo-100 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-500"
          >
            {isGeneratingTests ? "Refreshing..." : "Regenerate"}
          </button>
          <button
            type="button"
            onClick={onDownloadXLSX}
            disabled={testCases.length === 0}
            className="inline-flex items-center justify-center rounded-full border border-zinc-600 px-4 py-1.5 text-xs font-medium text-zinc-100 transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-500"
          >
            XLSX
          </button>
          <button
            type="button"
            onClick={onDownloadCSV}
            disabled={testCases.length === 0}
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
          >
            CSV
          </button>
        </div>
      </div>

      {isGeneratingTests && (
        <p className="text-xs text-zinc-400">Generating test cases using AI...</p>
      )}

      {testCases.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/40">
          <table className="min-w-full text-left text-xs text-zinc-200">
            <thead className="bg-zinc-900 text-[11px] uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Steps</th>
                <th className="px-3 py-2">Expected Result</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {testCases.map((tc) => (
                <tr
                  key={tc.id}
                  className="border-t border-zinc-800/80 align-top"
                >
                        <td className="px-3 py-2 text-zinc-400">
                          {`TC-${String(tc.id).padStart(3, "0")}`}
                        </td>
                  <td className="px-3 py-2">{tc.title}</td>
                  <td className="whitespace-pre-wrap px-3 py-2 text-zinc-300">
                    {tc.steps}
                  </td>
                  <td className="px-3 py-2 text-zinc-300">
                    {tc.expectedResult}
                  </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium text-rose-300">
                            {tc.priority ?? "High"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                            {tc.caseType ??
                              (tc.title.toLowerCase().includes("invalid") ||
                              tc.title.toLowerCase().includes("error")
                                ? "Negative"
                                : "Positive")}
                          </span>
                        </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {testCases.length === 0 && !isGeneratingTests && null}
    </section>
  );
}

