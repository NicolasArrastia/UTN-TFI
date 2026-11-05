export function FullScreenLoader() {
  return (
    <div className="fullscreen-loader" role="status" aria-live="polite">
      <span className="spinner spinner--lg" aria-hidden="true" />
      <p>Verificando sesión...</p>
    </div>
  );
}
