import LogsTable from '../components/logs/LogsTable'
import { useStore } from '../store/store'

export default function Logs() {
  const logs = useStore(s => s.logs)
  const step1 = logs.filter(l => l.step === 1).length
  const step2 = logs.filter(l => l.step === 2).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">Logs</p>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Delivery history</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Straightforward tables for auditing each send.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-[rgb(var(--border))] text-center">
            <div className="text-2xl font-semibold">{step1}</div>
            <div className="text-xs text-[rgb(var(--muted))]">Mail 1</div>
          </div>
          <div className="p-3 rounded-lg border border-[rgb(var(--border))] text-center">
            <div className="text-2xl font-semibold">{step2}</div>
            <div className="text-xs text-[rgb(var(--muted))]">Mail 2</div>
          </div>
        </div>
      </div>

      <LogsTable />
    </div>
  )
}
