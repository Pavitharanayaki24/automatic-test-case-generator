type Props = {
  userStoryText: string;
  onUserStoryChange: (value: string) => void;
  uploadedFileName: string | null;
  onFileSelected: (file: File | null) => void;
  canGenerate: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
};

export function UserStoryInput({
  userStoryText,
  onUserStoryChange,
  uploadedFileName,
  onFileSelected,
  canGenerate,
  onGenerate,
  isGenerating,
}: Props) {
  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      <header className="space-y-1">
        <h2 className="text-sm font-semibold text-zinc-100">
          User Story Input
        </h2>
        <p className="text-xs text-zinc-500 sm:text-[13px]">
          Enter your user story or upload a .doc/.docx file to generate modules
          and test cases.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          User Story
        </label>
        <textarea
          className="h-40 resize-none rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-50 outline-none ring-0 transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="As a user, I want to be able to login to the system so that I can access my dashboard..."
          value={userStoryText}
          onChange={(e) => onUserStoryChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950/60 px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-indigo-500 hover:bg-zinc-900">
            <span>Upload .Doc</span>
            <input
              type="file"
              accept=".doc,.docx"
              className="hidden"
              onChange={(event) =>
                onFileSelected(event.target.files?.[0] ?? null)
              }
            />
          </label>
          {uploadedFileName && (
            <p className="truncate text-xs text-emerald-400">
              {uploadedFileName}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className="mt-3 inline-flex items-center justify-center rounded-full bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-700 sm:mt-0"
        >
          {isGenerating ? "Generating..." : "Generate Modules"}
        </button>
      </div>
    </section>
  );
}

