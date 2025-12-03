import Card from '../ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../ui/Table'
import { useStore } from '../../store/store'

export default function LogsTable() {
  const logs = useStore(s => s.logs)
  const campaigns = useStore(s => s.campaigns)
  const campaignName = (id: string) => campaigns.find(c => c.id === id)?.name ?? '—'

  return (
    <Card title="Logs">
      <Table>
        <THead>
          <TH>To</TH>
          <TH>Time</TH>
          <TH>Campaign</TH>
          <TH>Step</TH>
        </THead>
        <TBody>
          {logs.length === 0 && (
            <TR>
              <td className="text-[rgb(var(--muted))] p-4 text-center" colSpan={4}>No logs yet.</td>
            </TR>
          )}
          {logs.map(l => (
            <TR key={l.id}>
              <TD>{l.to}</TD>
              <TD>{new Date(l.time).toLocaleString()}</TD>
              <TD>{campaignName(l.campaignId)}</TD>
              <TD>Mail {l.step}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  )
}
