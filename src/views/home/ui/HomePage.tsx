export function HomePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-6 text-text">
      <section className="w-full max-w-md rounded-2xl border bg-panel p-6 shadow-sm">
        <p className="text-sm font-medium text-accent">Planora</p>

        <h1 className="mt-2 text-2xl font-semibold">
          Основа приложения готова
        </h1>

        <p className="mt-3 text-sm leading-6 text-text-muted">
          Следующим шагом добавим доменную модель и локальное хранилище.
        </p>
      </section>
    </main>
  );
}
