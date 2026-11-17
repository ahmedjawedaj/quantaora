export default function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-background)] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center text-sm text-[color:var(--color-ink-500)] sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-display)] text-base text-[color:var(--color-foreground)]">
            Quantaora
          </span>
          <span className="h-1 w-1 rounded-full bg-[color:var(--color-brand)]" />
          <span>See science move.</span>
        </div>
        <p>No backend. No account. Progress stays on this device.</p>
      </div>
    </footer>
  )
}
