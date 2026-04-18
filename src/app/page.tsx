const highlights = [
  "Next.js com App Router e TypeScript",
  "Tailwind CSS configurado com pipeline moderno",
  "Docker multi-stage para dev e produção",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-10">
      <section className="overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_24px_80px_rgba(31,41,55,0.12)] backdrop-blur">
        <div className="grid gap-12 px-8 py-10 lg:grid-cols-[1.4fr_0.9fr] lg:px-12 lg:py-14">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm font-medium tracking-wide text-[color:var(--accent)]">
              Ambiente inicial pronto para evoluir
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent)]">
                Marketplace Frontend
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Base moderna para desenvolver o front-end do projeto com rapidez e isolamento.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
                Esta estrutura já sobe com hot reload em Docker, build de produção enxuto e uma fundação pronta para componentes,
                páginas e integração com backend.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noreferrer"
              >
                Ver docs do Next.js
              </a>
              <a
                className="rounded-full border border-[color:var(--border)] bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-white"
                href="https://tailwindcss.com/docs"
                target="_blank"
                rel="noreferrer"
              >
                Ver docs do Tailwind
              </a>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/60 bg-slate-950 p-6 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-emerald-300">Stack inicial</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-300">
                dockerized
              </span>
            </div>

            <ul className="space-y-3">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200"
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-emerald-50">
              <p className="font-medium">Próximo passo recomendado</p>
              <p className="mt-2 leading-6 text-emerald-100/90">
                Definir as variáveis do `.env`, modelar a navegação inicial e conectar o frontend ao backend da aplicação.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
