export function FullScreenLoader() {
  return (
    <div
      className="grid min-h-screen place-content-center justify-items-center gap-3.5 text-sm text-muted"
      role="status"
      aria-live="polite"
    >
      <span
        className="size-8 animate-spin rounded-full border-[3px] border-line border-t-brand"
        aria-hidden="true"
      />
      <p>Verificando sesión...</p>
    </div>
  );
}
