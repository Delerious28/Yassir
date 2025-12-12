import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[rgb(var(--bg))] text-[rgb(var(--fg))] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-24 -right-10 w-96 h-96 bg-[rgba(var(--accent2),0.12)] blur-3xl rounded-full" />
        <div className="absolute -bottom-32 -left-10 w-[28rem] h-[28rem] bg-[rgba(var(--accent),0.12)] blur-3xl rounded-full" />
      </div>
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <Topbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="rounded-2xl border border-[rgba(var(--border),0.6)] bg-[rgba(var(--card-bg),0.9)] shadow-xl shadow-[rgba(var(--fg),0.06)] backdrop-blur-xl p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
