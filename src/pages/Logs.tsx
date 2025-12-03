import LogsTable from '../components/logs/LogsTable'
import Card from '../components/ui/Card'
import { useStore } from '../store/store'

export default function Logs() {
  const logs = useStore(s => s.logs)
  const step1 = logs.filter(l => l.step === 1).length
  const step2 = logs.filter(l => l.step === 2).length

  return (
    <div className="grid gap-5">
      <Card className="bg-gradient-to-r from-[rgba(var(--accent),0.1)] to-[rgba(var(--accent2),0.08)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[rgba(var(--fg),0.6)]">Delivery log</p>
            <h1 className="text-2xl font-bold tracking-tight">See what went out and when</h1>
            <p className="text-[rgba(var(--fg),0.75)] mt-1">Use this to reconcile send history and validate cadence.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[rgba(var(--accent),0.1)] text-center">
              <div className="text-2xl font-semibold">{step1}</div>
              <div className="text-xs text-[rgba(var(--fg),0.65)]">Mail 1</div>
            </div>
            <div className="p-3 rounded-lg bg-[rgba(var(--accent2),0.1)] text-center">
              <div className="text-2xl font-semibold">{step2}</div>
              <div className="text-xs text-[rgba(var(--fg),0.65)]">Mail 2</div>
            </div>
          </div>
        </div>
      </Card>

      <LogsTable />
    </div>
  )
}
