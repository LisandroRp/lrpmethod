export default function AdminLoading() {
  return (
    <div className="bg-canvas flex min-h-screen items-center justify-center px-4" aria-label="Cargando">
      <div className="border-subtle h-10 w-10 animate-spin rounded-full border-4 border-t-[color:var(--color-accent)]" />
    </div>
  );
}
