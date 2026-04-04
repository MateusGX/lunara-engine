import { useNavigate } from "react-router-dom";
import { PencilSimpleIcon, GameControllerIcon, ArrowRightIcon } from "@phosphor-icons/react";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex h-screen flex-col items-center justify-center bg-surface-base overflow-hidden">
      {/* Atmospheric glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 35%, oklch(0.68 0.22 300 / 9%) 0%, transparent 65%)",
        }}
      />

      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.2) 1px, rgba(0,0,0,0.2) 2px)",
        }}
      />

      {/* Full-page corner ornaments */}
      <span className="pointer-events-none absolute top-5 left-5 h-10 w-10 border-t-2 border-l-2 border-rpg-gold/25" />
      <span className="pointer-events-none absolute top-5 right-5 h-10 w-10 border-t-2 border-r-2 border-rpg-gold/25" />
      <span className="pointer-events-none absolute bottom-5 left-5 h-10 w-10 border-b-2 border-l-2 border-rpg-gold/25" />
      <span className="pointer-events-none absolute bottom-5 right-5 h-10 w-10 border-b-2 border-r-2 border-rpg-gold/25" />

      {/* Top rule */}
      <div className="absolute top-5 left-18 right-18 flex items-center gap-3">
        <div className="h-px flex-1 bg-rpg-gold/15" />
        <span className="font-mono text-[9px] tracking-[0.35em] text-rpg-gold/30 uppercase">System v1.0</span>
        <div className="h-px flex-1 bg-rpg-gold/15" />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-6 py-20">

        {/* Logo block */}
        <div className="flex flex-col items-center gap-7">
          {/* Icon frame */}
          <div
            className="relative flex h-28 w-28 items-center justify-center border border-rpg-gold/30 bg-surface-raised"
            style={{ boxShadow: "0 0 50px oklch(0.68 0.22 300 / 14%), inset 0 0 20px oklch(0.68 0.22 300 / 4%)" }}
          >
            <span className="pointer-events-none absolute top-0 left-0 h-5 w-5 border-t-2 border-l-2 border-rpg-gold/60" />
            <span className="pointer-events-none absolute top-0 right-0 h-5 w-5 border-t-2 border-r-2 border-rpg-gold/60" />
            <span className="pointer-events-none absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-rpg-gold/60" />
            <span className="pointer-events-none absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-rpg-gold/60" />
            <span className="absolute bottom-0 right-0 h-4 w-4 bg-rpg-gold" />
            <svg
              viewBox="0 0 6 8"
              className="relative z-10 h-16 w-12"
              shapeRendering="crispEdges"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="1" y="0" width="2" height="1" fill="oklch(0.68 0.22 300)" />
              <rect x="0" y="1" width="2" height="1" fill="oklch(0.68 0.22 300)" />
              <rect x="0" y="2" width="1" height="1" fill="oklch(0.68 0.22 300)" />
              <rect x="0" y="3" width="1" height="1" fill="oklch(0.68 0.22 300)" />
              <rect x="0" y="4" width="1" height="1" fill="oklch(0.68 0.22 300)" />
              <rect x="0" y="5" width="2" height="1" fill="oklch(0.68 0.22 300)" />
              <rect x="1" y="6" width="2" height="1" fill="oklch(0.68 0.22 300)" />
            </svg>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1
              className="pl-[0.25em] text-6xl font-bold tracking-[0.25em]"
              style={{
                background:
                  "linear-gradient(180deg, oklch(0.90 0.16 300) 0%, oklch(0.62 0.22 300) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              LUNARA
            </h1>
            <div className="mt-3 flex items-center justify-center gap-4">
              <div className="h-px w-14 bg-rpg-gold/25" />
              <span className="font-mono text-[9px] tracking-[0.5em] text-rpg-gold/50 uppercase">
                Fantasy Engine
              </span>
              <div className="h-px w-14 bg-rpg-gold/25" />
            </div>
          </div>

          {/* Tagline */}
          <p className="max-w-xs text-center text-sm leading-relaxed text-rpg-stone italic">
            "Build retro-style games with Lua.<br />Write code, paint sprites, and ship your game."
          </p>
        </div>

        {/* Divider */}
        <div className="flex w-72 items-center gap-4">
          <div className="h-px flex-1 bg-rpg-gold/20" />
          <span className="text-rpg-gold/50 text-xs">✦</span>
          <div className="h-px flex-1 bg-rpg-gold/20" />
        </div>

        {/* ── Choice cards ── */}
        <div className="flex w-full max-w-120 flex-col gap-3 sm:flex-row">
          {/* Studio */}
          <button
            onClick={() => navigate("/studio")}
            className="group relative flex flex-1 flex-col gap-5 border border-rpg-gold/20 bg-surface-card p-8 text-left transition-all duration-200 hover:border-rpg-gold/50 hover:bg-rpg-gold/4"
            style={{ transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 32px oklch(0.68 0.22 300 / 12%)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
          >
            <span className="pointer-events-none absolute top-0 left-0 h-3.5 w-3.5 border-t border-l border-rpg-gold/40 transition-colors group-hover:border-rpg-gold/80" />
            <span className="pointer-events-none absolute top-0 right-0 h-3.5 w-3.5 border-t border-r border-rpg-gold/40 transition-colors group-hover:border-rpg-gold/80" />
            <span className="pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 border-b border-l border-rpg-gold/40 transition-colors group-hover:border-rpg-gold/80" />
            <span className="pointer-events-none absolute bottom-0 right-0 h-3.5 w-3.5 border-b border-r border-rpg-gold/40 transition-colors group-hover:border-rpg-gold/80" />

            <span className="absolute top-3 right-4 font-mono text-[10px] text-rpg-gold/25 tracking-widest">
              I
            </span>

            <div className="flex h-12 w-12 items-center justify-center border border-rpg-gold/25 bg-rpg-gold/6">
              <PencilSimpleIcon size={22} className="text-rpg-gold" weight="duotone" />
            </div>

            <div>
              <p className="mb-1 font-mono text-[9px] tracking-[0.35em] text-rpg-gold/40 uppercase">
                [ Studio ]
              </p>
              <h2 className="text-xl font-bold tracking-widest text-rpg-parchment uppercase">
                Editor
              </h2>
              <p className="mt-2.5 text-xs leading-relaxed text-rpg-stone">
                Create and edit game cartridges. Write Lua, paint sprites, compose maps and sounds.
              </p>
            </div>

            <div className="mt-auto flex items-center gap-2 font-mono text-xs tracking-wider text-rpg-gold/0 transition-all duration-200 group-hover:text-rpg-gold/70 group-hover:gap-3">
              Enter <ArrowRightIcon size={11} weight="bold" />
            </div>
          </button>

          {/* Player */}
          <button
            onClick={() => navigate("/launch")}
            className="group relative flex flex-1 flex-col gap-5 border border-rpg-emerald/20 bg-surface-card p-8 text-left transition-all duration-200 hover:border-rpg-emerald/50 hover:bg-rpg-emerald/4"
            style={{ transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 32px oklch(0.60 0.18 145 / 12%)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
          >
            <span className="pointer-events-none absolute top-0 left-0 h-3.5 w-3.5 border-t border-l border-rpg-emerald/30 transition-colors group-hover:border-rpg-emerald/70" />
            <span className="pointer-events-none absolute top-0 right-0 h-3.5 w-3.5 border-t border-r border-rpg-emerald/30 transition-colors group-hover:border-rpg-emerald/70" />
            <span className="pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 border-b border-l border-rpg-emerald/30 transition-colors group-hover:border-rpg-emerald/70" />
            <span className="pointer-events-none absolute bottom-0 right-0 h-3.5 w-3.5 border-b border-r border-rpg-emerald/30 transition-colors group-hover:border-rpg-emerald/70" />

            <span className="absolute top-3 right-4 font-mono text-[10px] text-rpg-emerald/25 tracking-widest">
              II
            </span>

            <div className="flex h-12 w-12 items-center justify-center border border-rpg-emerald/25 bg-rpg-emerald/6">
              <GameControllerIcon size={22} className="text-rpg-emerald" weight="duotone" />
            </div>

            <div>
              <p className="mb-1 font-mono text-[9px] tracking-[0.35em] text-rpg-emerald/40 uppercase">
                [ Player ]
              </p>
              <h2 className="text-xl font-bold tracking-widest text-rpg-parchment uppercase">
                Play
              </h2>
              <p className="mt-2.5 text-xs leading-relaxed text-rpg-stone">
                Load and run any cartridge. Drop a .lun or .png file to start playing.
              </p>
            </div>

            <div className="mt-auto flex items-center gap-2 font-mono text-xs tracking-wider text-rpg-emerald/0 transition-all duration-200 group-hover:text-rpg-emerald/70 group-hover:gap-3">
              Enter <ArrowRightIcon size={11} weight="bold" />
            </div>
          </button>
        </div>
      </div>

      {/* Bottom rule */}
      <div className="absolute bottom-5 left-18 right-18 flex items-center gap-3">
        <div className="h-px flex-1 bg-rpg-gold/15" />
        <span className="font-mono text-[9px] tracking-[0.35em] text-rpg-stone/40 uppercase">
          by Mateus Martins
        </span>
        <div className="h-px flex-1 bg-rpg-gold/15" />
      </div>
    </div>
  );
}
