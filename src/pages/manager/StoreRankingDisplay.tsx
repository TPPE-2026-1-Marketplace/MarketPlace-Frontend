import React, { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Sparkles, Target, TrendingUp, Trophy, Wifi } from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../../lib/api";

/**
 * Tela de ranking pra ficar aberta num monitor/TV da loja física.
 *
 * Usa o mesmo visual do painel (cards brancos, borda cinza, preto/rosa da
 * marca) — só acrescenta animação e rotação de telas. Dados reais (mesmos
 * endpoints da aba Comissões), sem controles de edição, pensada pra rodar
 * sozinha o dia inteiro: atualiza os dados em segundo plano a cada 45s e
 * alterna entre 3 telas (ranking geral / meta da equipe / destaque
 * individual) a cada 12s.
 */

const REFRESH_INTERVAL_MS = 45_000;
const SLIDE_DURATION_MS = 12_000;
const MEDAL_COLORS = ["#c8a840", "#a0a0a0", "#c2793f"];
const SLIDES = ["ranking", "meta", "destaque"] as const;
type Slide = (typeof SLIDES)[number];

interface CommissionReport {
  total_vendas: number | string;
  comissao: number | string;
  meta_batida: boolean;
  meta_vendas: number | string;
  valor_bonus: number | string;
}

interface RankedSeller {
  cpf: string;
  name: string;
  metaVendas: number;
  totalVendas: number;
  comissao: number;
  metaBatida: boolean;
  bonus: number;
}

/** Colunas `numeric` do Postgres chegam como string no JSON — normaliza. */
function num(value: unknown): number {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(prefersReducedMotion ? target : 0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(from + (target - from) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fireConfetti(originX: number) {
  if (prefersReducedMotion) return;
  confetti({
    particleCount: 110,
    spread: 75,
    startVelocity: 45,
    gravity: 0.9,
    ticks: 220,
    origin: { x: originX, y: 0.55 },
    colors: ["#C8427C", "#c8a840", "#1a1a1a"],
    zIndex: 60,
  });
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono tabular-nums text-lg text-gray-700">
      {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

function RankDelta({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) {
    return <span className="text-gray-300 text-xs w-8 text-center">—</span>;
  }
  const up = delta > 0;
  return (
    <span
      className={`text-xs w-8 text-center font-semibold ${up ? "text-emerald-600" : "text-rose-500"}`}
    >
      {up ? "▲" : "▼"} {Math.abs(delta)}
    </span>
  );
}

/** Slide 1 — pódio + lista, no mesmo cartão branco/borda cinza do resto do painel. */
function RankingSlide({
  sellers,
  deltas,
}: {
  sellers: RankedSeller[];
  deltas: Record<string, number | null>;
}) {
  const podium = sellers.slice(0, 3);
  const rest = sellers.slice(3);

  return (
    <div className="flex flex-col gap-6">
      {podium.length > 0 && (
        <div className="bg-white border border-gray-100 p-6">
          <div className="flex items-end justify-center gap-6 sm:gap-10">
            {podium[1] && <PodiumCard seller={podium[1]} position={2} height="h-14" />}
            {podium[0] && <PodiumCard seller={podium[0]} position={1} height="h-20" />}
            {podium[2] && <PodiumCard seller={podium[2]} position={3} height="h-9" />}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="bg-white border border-gray-100 p-5">
          <h3 className="text-gray-900 mb-4 text-sm uppercase tracking-widest text-gray-400">
            Demais colocações
          </h3>
          <div className="flex flex-col gap-2">
            {rest.map((seller, i) => {
              const rank = i + 4;
              const progress =
                seller.metaVendas > 0 ? Math.min(100, (seller.totalVendas / seller.metaVendas) * 100) : 0;
              return (
                <div
                  key={seller.cpf}
                  className="flex items-center gap-4 border border-gray-100 px-4 py-3"
                >
                  <span className="w-6 text-gray-400 font-mono text-sm text-center">{rank}</span>
                  <RankDelta delta={deltas[seller.cpf]} />
                  <div className="w-9 h-9 bg-gray-200 flex items-center justify-center text-sm text-gray-700 shrink-0">
                    {seller.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm text-gray-800 truncate">{seller.name}</span>
                      <span className="font-mono tabular-nums text-sm text-gray-600 shrink-0">
                        R$ {formatBRL(seller.totalVendas)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 overflow-hidden">
                      <div
                        className="h-full transition-all duration-700 bg-[#1a1a1a]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PodiumCard({
  seller,
  position,
  height,
}: {
  seller: RankedSeller;
  position: 1 | 2 | 3;
  height: string;
}) {
  const value = useCountUp(seller.totalVendas);
  const color = MEDAL_COLORS[position - 1];

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-[190px]">
      {position === 1 && <Crown className="w-6 h-6 mb-0.5" style={{ color }} />}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-serif text-white shrink-0"
        style={{ background: "#1a1a1a", boxShadow: `0 0 0 3px ${color}` }}
      >
        {seller.name.charAt(0).toUpperCase()}
      </div>
      <div className="text-center">
        <p className="text-gray-900 text-sm font-medium leading-tight truncate max-w-[170px]">
          {seller.name}
        </p>
        <p className="font-mono tabular-nums text-base mt-0.5" style={{ color }}>
          R$ {formatBRL(value)}
        </p>
        {seller.metaBatida && (
          <span className="inline-block mt-1 text-[10px] uppercase tracking-widest text-emerald-600">
            Meta batida
          </span>
        )}
      </div>
      <div
        className={`w-full flex items-start justify-center pt-2 ${height}`}
        style={{ background: `${color}1a`, borderTop: `2px solid ${color}` }}
      >
        <span className="font-serif text-2xl" style={{ color }}>
          {position}°
        </span>
      </div>
    </div>
  );
}

/** Slide 2 — meta da equipe em destaque, número grande. */
function MetaSlide({ teamTotal, teamGoal }: { teamTotal: number; teamGoal: number }) {
  const progress = teamGoal > 0 ? Math.min(100, (teamTotal / teamGoal) * 100) : 0;
  const value = useCountUp(teamTotal);
  const missing = Math.max(0, teamGoal - teamTotal);

  return (
    <div className="bg-white border border-gray-100 p-10 flex flex-col items-center text-center gap-4">
      <Target className="w-8 h-8 text-[#C8427C]" />
      <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Meta coletiva do mês</p>
      <p className="font-mono tabular-nums text-5xl sm:text-6xl text-gray-900">
        R$ {formatBRL(value)}
      </p>
      <p className="text-gray-400 text-sm">
        de <span className="font-mono tabular-nums">R$ {formatBRL(teamGoal)}</span>
      </p>
      <div className="w-full max-w-lg h-4 bg-gray-100 overflow-hidden mt-2">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, #C8427C, #e06da0)" }}
        />
      </div>
      <p className="font-serif text-3xl" style={{ color: "#C8427C" }}>
        {progress.toFixed(0)}%
      </p>
      <p className="text-gray-500 text-sm">
        {missing > 0
          ? `Faltam R$ ${formatBRL(missing)} para bater a meta da equipe`
          : "Meta da equipe batida! 🎉"}
      </p>
    </div>
  );
}

/** Slide 3 — destaque individual, alterna de vendedor a cada rodada. */
function SpotlightSlide({ seller }: { seller: RankedSeller }) {
  const totalValue = useCountUp(seller.totalVendas);
  const progress =
    seller.metaVendas > 0 ? Math.min(100, (seller.totalVendas / seller.metaVendas) * 100) : 0;

  return (
    <div className="bg-white border border-gray-100 p-10 flex flex-col items-center text-center gap-4">
      <Sparkles className="w-8 h-8 text-[#C8427C]" />
      <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Destaque</p>
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-serif text-white"
        style={{ background: "#1a1a1a" }}
      >
        {seller.name.charAt(0).toUpperCase()}
      </div>
      <p className="text-gray-900 text-2xl font-serif">{seller.name}</p>
      <p className="font-mono tabular-nums text-4xl text-gray-900">R$ {formatBRL(totalValue)}</p>
      <div className="w-full max-w-md h-3 bg-gray-100 overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ${seller.metaBatida ? "bg-emerald-500" : "bg-[#1a1a1a]"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gray-500 text-sm">
        {seller.metaBatida
          ? `Meta batida! Comissão: R$ ${formatBRL(seller.comissao)}`
          : `${progress.toFixed(0)}% da meta de R$ ${formatBRL(seller.metaVendas)}`}
      </p>
    </div>
  );
}

export function StoreRankingDisplay() {
  const [sellers, setSellers] = useState<RankedSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  const prevRankRef = useRef<Record<string, number>>({});
  const celebratedRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api.get<{ data: any[] }>("/employees?limit=100");
        const vendedores = res.data.filter((u: any) => u.ativo && u.role_perfil === "vendedor");

        const now = new Date();
        const mes = now.getMonth() + 1;
        const ano = now.getFullYear();

        const ranked: RankedSeller[] = await Promise.all(
          vendedores.map(async (emp: any) => {
            try {
              const report = await api.get<CommissionReport>(
                `/employees/${emp.cpf}/commissions?mes=${mes}&ano=${ano}`,
              );
              return {
                cpf: emp.cpf,
                name: emp.person?.nome ?? "Vendedor(a)",
                metaVendas: num(report.meta_vendas) || num(emp.meta_vendas),
                totalVendas: num(report.total_vendas),
                comissao: num(report.comissao),
                metaBatida: report.meta_batida || false,
                bonus: num(report.valor_bonus),
              };
            } catch {
              return {
                cpf: emp.cpf,
                name: emp.person?.nome ?? "Vendedor(a)",
                metaVendas: num(emp.meta_vendas),
                totalVendas: 0,
                comissao: 0,
                metaBatida: false,
                bonus: 0,
              };
            }
          }),
        );

        if (cancelled) return;

        ranked.sort((a, b) => b.totalVendas - a.totalVendas);

        // Primeira carga: só grava o placar de referência, sem confete nem setas
        // (evita uma "explosão" de confete pra metas já batidas antes da tela abrir).
        const isFirstLoad = celebratedRef.current === null;
        if (isFirstLoad) {
          celebratedRef.current = new Set(ranked.filter((s) => s.metaBatida).map((s) => s.cpf));
        } else {
          ranked.forEach((s, index) => {
            if (s.metaBatida && !celebratedRef.current!.has(s.cpf)) {
              celebratedRef.current!.add(s.cpf);
              const podiumSlots = Math.min(3, ranked.length);
              const originX = podiumSlots > 0 ? (index + 0.5) / podiumSlots : 0.5;
              fireConfetti(Math.min(0.9, Math.max(0.1, originX)));
            }
          });
        }

        prevRankRef.current = Object.fromEntries(ranked.map((s, i) => [s.cpf, i]));

        setSellers(ranked);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        if (!cancelled) setError("Não foi possível carregar o ranking. Tentando novamente...");
        console.error("Failed to load store ranking", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Rotação entre telas (ranking / meta / destaque de vendedor).
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), SLIDE_DURATION_MS);
    return () => clearInterval(interval);
  }, []);

  const teamGoal = sellers.reduce((sum, s) => sum + s.metaVendas, 0);
  const teamTotal = sellers.reduce((sum, s) => sum + s.totalVendas, 0);

  const deltas: Record<string, number | null> = {};
  sellers.forEach((s, i) => {
    const prev = prevRankRef.current[s.cpf];
    deltas[s.cpf] = prev === undefined ? null : prev - i;
  });

  const slide: Slide = SLIDES[tick % SLIDES.length];
  const spotlightSeller = useMemo(() => {
    if (sellers.length === 0) return null;
    const cycle = Math.floor(tick / SLIDES.length);
    return sellers[cycle % sellers.length];
  }, [sellers, tick]);

  return (
    <div className="min-h-screen bg-[#f8f8f8] font-sans">
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-gray-400">DK Fashion · Loja</p>
            <h1 className="font-serif text-2xl sm:text-3xl text-gray-900 mt-0.5 flex items-center gap-2">
              <Trophy className="w-6 h-6" style={{ color: "#C8427C" }} />
              Ranking de Vendas
            </h1>
            <p className="text-gray-500 text-sm mt-0.5 capitalize">
              {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <LiveClock />
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <Wifi className="w-3 h-3 text-emerald-500" />
              {lastUpdated
                ? `Atualizado às ${lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                : "Carregando..."}
            </span>
          </div>
        </header>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center text-gray-400">Carregando ranking...</div>
        ) : sellers.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center gap-2 text-gray-400">
            <TrendingUp className="w-8 h-8" />
            <p>Nenhum vendedor com meta registrada neste mês ainda.</p>
          </div>
        ) : (
          <>
            {/* Slide ativo, com transição suave */}
            <div key={tick} className={prefersReducedMotion ? "" : "animate-slide-fade"}>
              {slide === "ranking" && <RankingSlide sellers={sellers} deltas={deltas} />}
              {slide === "meta" && <MetaSlide teamTotal={teamTotal} teamGoal={teamGoal} />}
              {slide === "destaque" && spotlightSeller && (
                <SpotlightSlide seller={spotlightSeller} />
              )}
            </div>

            {/* Indicador de qual tela está ativa */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {SLIDES.map((s) => (
                <span
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    s === slide ? "w-6 bg-[#1a1a1a]" : "w-1.5 bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </>
        )}

      </div>

      <style>{`
        @keyframes slideFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-fade {
          animation: slideFade 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
