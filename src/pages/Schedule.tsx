import ScheduleEditor from '../components/schedule/ScheduleEditor'
import Card from '../components/ui/Card'

export default function Schedule() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">Schedule</p>
        <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Control send windows and pacing</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Preview upcoming sends with clear, high-contrast text.</p>
      </div>

      <ScheduleEditor />
    </div>
  )
}
