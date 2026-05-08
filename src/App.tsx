export default function App() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-sm font-semibold tracking-wide text-slate-400">Ugent</div>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-white">Ugent Web</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Fresh start. This repository was reset from the previous UuuGent prototype.
        </p>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">Quick sanity</div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li>Run dev server: <code className="rounded bg-black/30 px-1.5 py-0.5">npm run dev</code></li>
            <li>Build: <code className="rounded bg-black/30 px-1.5 py-0.5">npm run build</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}

