import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { IconEye, IconEyeOff, IconLock, IconStore, IconUser } from "../components/icons.tsx";
import { useAuth } from "../hooks/useAuth.ts";
import { getLoginErrorMessage, notify } from "../services/notifications.ts";

const FEATURES = [
  "Control de productos y stock en tiempo real.",
  "Registro de ventas con detalle por producto.",
  "Indicadores para tomar mejores decisiones.",
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      notify.error("Ingresá usuario y contraseña.");
      return;
    }

    setIsSubmitting(true);
    const toastId = notify.loading("Verificando credenciales...");

    try {
      const user = await login(username.trim(), password);
      notify.resolve(toastId, `¡Bienvenido, ${user.fullname}!`);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      notify.reject(toastId, getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="login-hero relative hidden flex-col justify-between gap-10 overflow-hidden px-14 py-12 text-slate-50 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[160px] -right-[120px] size-[420px] rounded-full border border-slate-400/18 shadow-[0_0_0_60px_rgba(148,163,184,0.05)]"
        />

        <div className="relative z-10 flex items-center gap-3 text-lg font-bold tracking-[-0.01em]">
          <span className="inline-flex size-[38px] items-center justify-center rounded-[11px] border border-accent-300/35 bg-accent-500/25 text-accent-200">
            <IconStore width={22} height={22} />
          </span>
          <span>UTN TFI</span>
        </div>

        <div className="relative z-10 max-w-[460px]">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-accent-300">
            Gestión comercial
          </p>
          <h2 className="mb-[18px] text-[clamp(30px,3.4vw,42px)] font-bold leading-[1.12] tracking-[-0.03em]">
            Todo tu comercio, en un solo lugar.
          </h2>
          <p className="text-base leading-relaxed text-slate-300">
            Productos, ventas, stock y estadísticas con acceso seguro por rol.
          </p>

          <ul className="mt-[34px] grid list-none gap-3.5 p-0">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="relative pl-[30px] text-[14.5px] text-slate-200"
              >
                <span className="absolute left-0 top-0.5 grid size-[18px] place-items-center rounded-full border border-green-500/55 bg-green-500/18">
                  <svg
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="size-3 text-green-400"
                  >
                    <path d="m4 9 3.2 3.2L14 5.6" />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[12.5px] text-slate-400">
          Trabajo Integrador Final · Universidad Tecnológica Nacional
        </p>
      </aside>

      <section className="grid place-items-center bg-white px-[18px] py-8 sm:p-10">
        <div className="w-full max-w-[410px]">
          <div className="mb-7 flex items-center gap-2.5 font-bold text-brand lg:hidden">
            <span className="inline-flex size-[38px] items-center justify-center rounded-[11px] border border-accent-200 bg-brand-soft text-brand">
              <IconStore width={20} height={20} />
            </span>
            <span>UTN TFI</span>
          </div>

          <h1 className="mb-2 text-[28px] font-bold tracking-[-0.02em]">Iniciar sesión</h1>
          <p className="mb-[30px] text-[14.5px] text-muted">
            Ingresá tus credenciales para acceder al panel.
          </p>

          <form className="grid gap-[18px]" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-[7px]">
              <label
                htmlFor="username"
                className="text-[13px] font-semibold text-ink-soft"
              >
                Usuario
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-slate-400">
                  <IconUser width={18} height={18} />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                  className="w-full rounded-field border border-line bg-white py-3 pl-11 pr-11 text-sm text-ink transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-[7px]">
              <label
                htmlFor="password"
                className="text-[13px] font-semibold text-ink-soft"
              >
                Contraseña
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-slate-400">
                  <IconLock width={18} height={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-field border border-line bg-white py-3 pl-11 pr-11 text-sm text-ink transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15 disabled:bg-slate-50"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:bg-slate-100 hover:text-ink"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  tabIndex={-1}
                >
                  {showPassword ? <IconEyeOff width={18} height={18} /> : <IconEye width={18} height={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-1.5 inline-flex w-full items-center justify-center gap-2 rounded-field bg-brand px-[18px] py-[13px] text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-65"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                    aria-hidden="true"
                  />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
