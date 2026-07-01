import { type LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useModuleCubeContext } from "@/components/ModuleCubeContext";

interface ModuleCubeProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  comingSoon?: boolean;
  to?: string;
}

export function ModuleCube({
  icon: Icon,
  title,
  description,
  comingSoon,
  to,
}: ModuleCubeProps) {
  const [isClickFlipped, setIsClickFlipped] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const navigate = useNavigate();
  const ctx = useModuleCubeContext();

  const isInteractive = !comingSoon && !!to;

  const isFlipped = ctx.isTouch
    ? isClickFlipped
    : isClickFlipped || isHovering;

  useEffect(() => {
    if (ctx.isTouch && ctx.openId !== title) {
      setIsClickFlipped(false);
    }
  }, [ctx.openId, ctx.isTouch, title]);

  const handleClick = () => {
    if (!isInteractive) return;

    if (ctx.isTouch) {
      if (isClickFlipped && ctx.openId === title) {
        navigate(to);
      } else {
        setIsClickFlipped(true);
        ctx.setOpenId(title);
      }
    } else {
      if (isClickFlipped) {
        navigate(to);
      } else {
        setIsClickFlipped(true);
      }
    }
  };

  const handleMouseEnter = () => {
    if (!ctx.isTouch) setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (!ctx.isTouch) setIsHovering(false);
  };

  const degY = isFlipped ? -65 : -28;

  return (
    <div
      data-module-cube={title}
      className={`flex flex-col items-center [perspective:1200px] ${
        ctx.isTouch
          ? "select-none [touch-action:manipulation]"
          : ""
      } ${
        isInteractive ? "cursor-pointer" : "cursor-not-allowed select-none"
      }`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (ctx.isTouch) {
                  if (isClickFlipped && ctx.openId === title) {
                    navigate(to);
                  } else {
                    setIsClickFlipped(true);
                    ctx.setOpenId(title);
                  }
                } else {
                  if (isClickFlipped) navigate(to);
                  else setIsClickFlipped(true);
                }
              }
            }
          : undefined
      }
    >
      <div
        className="relative h-44 w-44 transition-transform duration-700 ease-out [transform-style:preserve-3d] will-change-transform"
        style={{
          transform: `rotateY(${degY}deg)`,
        }}
      >
        {/* ── Front face — Title ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-black/[0.08] bg-black/[0.03] p-5 [backface-visibility:hidden] dark:border-white/[0.08] dark:bg-white/[0.04]"
          style={{
            transform: "translateZ(88px)",
            backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-center border border-black/[0.06] bg-black/[0.03] p-2 dark:border-white/[0.06] dark:bg-white/[0.04]">
            <Icon size={30} className="text-brand-600 dark:text-brand-400" />
          </div>
          <h3 className="text-center text-sm font-bold leading-tight text-slate-800 dark:text-slate-200">
            {title}
          </h3>
          {comingSoon && (
            <span className="rounded-full border border-black/[0.08] bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:border-white/[0.10] dark:bg-white/[0.06] dark:text-slate-400">
              Em breve
            </span>
          )}
        </div>

        {/* ── Right face — Description ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-black/[0.06] bg-black/[0.06] p-6 [backface-visibility:hidden] dark:border-white/[0.06] dark:bg-white/[0.07]"
          style={{
            transform: "rotateY(90deg) translateZ(88px)",
            backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-center border border-black/[0.05] bg-black/[0.02] p-2 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <Icon size={18} className="text-brand-500/60 dark:text-brand-400/50" />
          </div>
          <p className="text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
          {isInteractive && (
            <span className="text-[11px] font-medium tracking-wide text-brand-600/60 dark:text-brand-400/50">
              Acessar módulo →
            </span>
          )}
        </div>

        {/* ── Top face — visible sliver for 3D depth ── */}
        <div className="absolute inset-0 border border-black/[0.04] bg-black/[0.08] [backface-visibility:hidden] dark:border-white/[0.04] dark:bg-white/[0.05]"
          style={{ transform: "rotateX(90deg) translateZ(88px)" }}
        />

        {/* ── Dark filler faces — solid volume ── */}
        <div className="absolute inset-0 border border-black/[0.03] bg-black/[0.08] [backface-visibility:hidden] dark:border-white/[0.03] dark:bg-white/[0.04]"
          style={{ transform: "rotateY(180deg) translateZ(88px)" }}
        />
        <div className="absolute inset-0 border border-black/[0.03] bg-black/10 [backface-visibility:hidden] dark:border-white/[0.03] dark:bg-white/[0.03]"
          style={{ transform: "rotateY(-90deg) translateZ(88px)" }}
        />
        <div className="absolute inset-0 border border-black/[0.03] bg-black/[0.08] [backface-visibility:hidden] dark:border-white/[0.03] dark:bg-white/[0.04]"
          style={{ transform: "rotateX(-90deg) translateZ(88px)" }}
        />
      </div>

      {/* ── Ground shadow — extremely subtle ── */}
      <div className="-mt-3 h-3 w-24 rounded-full bg-black/[0.03] blur-2xl dark:bg-black/15" />
    </div>
  );
}
