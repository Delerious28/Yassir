import ScheduleEditor from '../components/schedule/ScheduleEditor'
import Card from '../components/ui/Card'

export default function Schedule() {
  return (
    <div className="grid gap-5">
      <Card className="bg-gradient-to-r from-[rgba(var(--accent),0.1)] to-[rgba(var(--accent2),0.08)]">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.25em] text-[rgba(var(--fg),0.6)]">Cadence guardrails</p>
          <h1 className="text-2xl font-bold tracking-tight">Control send windows and pacing</h1>
          <p className="text-[rgba(var(--fg),0.75)]">Preview the next ten sends and adjust intervals before you launch a campaign.</p>
        </div>
      </Card>

      <ScheduleEditor />
    </div>
  )
}
