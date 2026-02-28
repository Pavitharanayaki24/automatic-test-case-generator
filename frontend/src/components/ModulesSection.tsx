import type { Module } from "@/types/test-generation";

type Props = {
  modules: Module[];
  selectedModule: Module | null;
  onModuleClick: (module: Module) => void;
};

export function ModulesSection({
  modules,
  selectedModule,
  onModuleClick,
}: Props) {
  if (modules.length === 0) return null;

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">
          Generated Modules
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <div
            key={module.id}
            className={`flex flex-col items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
              selectedModule?.id === module.id
                ? "border-indigo-400 bg-indigo-500/10 text-indigo-50"
                : "border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:border-indigo-500 hover:bg-zinc-900"
            }`}
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Module
              </p>
              <span className="text-sm font-semibold">{module.name}</span>
            </div>
            <button
              type="button"
              onClick={() => onModuleClick(module)}
              className="inline-flex items-center justify-center rounded-full border border-zinc-600 px-3 py-1 text-[11px] font-medium text-zinc-100 transition hover:border-indigo-400 hover:text-indigo-100"
            >
              Generate Tests
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

