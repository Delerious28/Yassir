import { useStore } from '../store/store'
import LeadsUpload from '../components/leads/LeadsUpload'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Table, THead, TH, TBody, TR, TD } from '../components/ui/Table'

export default function Leads() {
  const { leads, removeLead } = useStore()
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">Leads</p>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Upload and review records</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Simple, flat styling to keep the data front and center.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold">{leads.length}</div>
          <div className="text-sm text-[rgb(var(--muted))]">lead{leads.length === 1 ? '' : 's'} loaded</div>
        </div>
      </div>

      <LeadsUpload />

      <div className="grid sm:grid-cols-3 gap-3">
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">CSV format</div>
          <div className="text-sm text-[rgb(var(--muted))] mt-2">Include an <strong>email</strong> column; other fields are ignored.</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Quality tips</div>
          <div className="text-sm text-[rgb(var(--muted))] mt-2">Remove duplicates before upload to keep stats clean.</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Next step</div>
          <div className="text-sm text-[rgb(var(--muted))] mt-2">Attach leads directly from a campaign header.</div>
        </Card>
      </div>

      <Card title="Leads list">
        <Table>
          <THead>
            <TH className="w-16">#</TH>
            <TH>Email</TH>
            <TH>Actions</TH>
          </THead>
          <TBody>
            {leads.length === 0 && (
              <TR><td className="text-[rgb(var(--muted))] p-4 text-center" colSpan={3}>No leads yet. Upload a CSV with "email".</td></TR>
            )}
            {leads.map((l, idx) => (
              <TR key={l.id}>
                <TD className="w-16 text-[rgb(var(--muted))]">{idx + 1}</TD>
                <TD>{l.email}</TD>
                <TD>
                  <Button variant="ghost" onClick={()=>removeLead(l.id)}>Remove</Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  )
}
