import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { IconEye, IconEyeOff, IconLock, IconStore, IconUser } from "../components/icons.tsx";
import { useAuth } from "../hooks/useAuth.ts";
import { getLoginErrorMessage } from "../services/notifications.ts";

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin";

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
      toast.error("Ingresá usuario y contraseña.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Verificando credenciales...");

    try {
      const user = await login(username.trim(), password);
      toast.success(`¡Bienvenido, ${user.fullname}!`, { id: toastId });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(getLoginErrorMessage(error), { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDefaultCredentials = () => {
    setUsername(DEFAULT_USERNAME);
    setPassword(DEFAULT_PASSWORD);
    toast("Credenciales de prueba completadas.", { icon: "🔑" });
  };

  return (
    <main className="login-page">
      <aside className="login-aside">
        <div className="brand">
          <span className="brand__mark">
            <IconStore width={22} height={22} />
          </span>
          <span>UTN TFI</span>
        </div>

        <div className="login-aside__content">
          <p className="eyebrow">Gestión comercial</p>
          <h2>Todo tu comercio, en un solo lugar.</h2>
          <p className="login-aside__lead">
            Productos, ventas, stock y estadísticas con acceso seguro por rol.
          </p>

          <ul className="login-aside__features">
            <li>Control de productos y stock en tiempo real.</li>
            <li>Registro de ventas con detalle por producto.</li>
            <li>Indicadores para tomar mejores decisiones.</li>
          </ul>
        </div>

        <p className="login-aside__footer">
          Trabajo Integrador Final · Universidad Tecnológica Nacional
        </p>
      </aside>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card__mobile-brand">
            <span className="brand__mark">
              <IconStore width={20} height={20} />
            </span>
            <span>UTN TFI</span>
          </div>

          <h1>Iniciar sesión</h1>
          <p className="login-card__subtitle">
            Ingresá tus credenciales para acceder al panel.
          </p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="username">Usuario</label>
              <div className="input-wrap">
                <span className="input-wrap__icon">
                  <IconUser width={18} height={18} />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="admin"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <div className="input-wrap">
                <span className="input-wrap__icon">
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
                />
                <button
                  type="button"
                  className="input-wrap__toggle"
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
              className="btn btn--primary btn--block"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          <div className="demo-credentials">
            <div>
              <strong>Acceso de prueba</strong>
              <p>
                Usuario <code>admin</code> · Contraseña <code>admin</code>
              </p>
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={fillDefaultCredentials}
              disabled={isSubmitting}
            >
              Completar
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
