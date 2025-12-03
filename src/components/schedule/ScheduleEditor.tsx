import Card from '../ui/Card'
import Button from '../ui/Button'
import { useStore } from '../../store/store'
import { generateScheduleTimes } from '../../lib/time'

export default function ScheduleEditor() {
  const settings = useStore(s => s.settings)
  const setSettings = useStore(s => s.setSettings)
  const sampleTimes = generateScheduleTimes({ count: 10, ...settings })

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card title="Send Window & Intervals">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Window start</label>
              <input type="time" value={settings.windowStart} onChange={e=>setSettings({ windowStart: e.target.value })} className="border rounded-md px-3 py-2 w-full" />
            </div>
            <div>
              <label className="text-sm font-medium">Window end</label>
              <input type="time" value={settings.windowEnd} onChange={e=>setSettings({ windowEnd: e.target.value })} className="border rounded-md px-3 py-2 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Interval min (mins)</label>
              <input type="number" min={1} value={settings.intervalMinMins} onChange={e=>setSettings({ intervalMinMins: Number(e.target.value)||1 })} className="border rounded-md px-3 py-2 w-full" />
            </div>
            <div>
              <label className="text-sm font-medium">Interval max (mins)</label>
              <input type="number" min={1} value={settings.intervalMaxMins} onChange={e=>setSettings({ intervalMaxMins: Number(e.target.value)||1 })} className="border rounded-md px-3 py-2 w-full" />
            </div>
          </div>
          <div>
            <Button onClick={() => {/* reserved for backend save later */}}>Save</Button>
          </div>
        </div>
      </Card>
      <Card title="Preview (next 10)">
        <ul className="space-y-2">
          {sampleTimes.map((t, i) => (
            <li
              key={i}
              className="text-sm"
              style={{ color: 'rgba(var(--fg),0.9)' }}
            >
              {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
