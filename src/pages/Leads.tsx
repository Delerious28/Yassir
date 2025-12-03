import { useStore } from '../store/store'
import LeadsUpload from '../components/leads/LeadsUpload'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Table, THead, TH, TBody, TR, TD } from '../components/ui/Table'

export default function Leads() {
  const { leads, removeLead } = useStore()
  return (
    <div className="grid gap-6">
      <Card className="bg-gradient-to-r from-[rgba(var(--accent),0.1)] to-[rgba(var(--accent2),0.08)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[rgba(var(--fg),0.6)]">Lead desk</p>
            <h1 className="text-2xl font-bold tracking-tight">Upload, review, and cleanse records</h1>
            <p className="text-[rgba(var(--fg),0.75)] mt-1">Keep the list tidy before attaching to campaigns.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold">{leads.length}</div>
            <div className="text-sm text-[rgba(var(--fg),0.7)]">lead{leads.length === 1 ? '' : 's'} loaded</div>
          </div>
        </div>
      </Card>

      <LeadsUpload />

      <div className="grid sm:grid-cols-3 gap-3">
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgba(var(--fg),0.65)]">CSV expected</div>
          <div className="text-sm text-[rgba(var(--fg),0.75)] mt-2">Include an <strong>email</strong> column; other fields are ignored.</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgba(var(--fg),0.65)]">Quality tips</div>
          <div className="text-sm text-[rgba(var(--fg),0.75)] mt-2">Remove duplicates before upload to keep stats clean.</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[rgba(var(--fg),0.65)]">Next step</div>
          <div className="text-sm text-[rgba(var(--fg),0.75)] mt-2">Attach leads directly from a campaign header.</div>
        </Card>
      </div>

      <Card title="Leads list" className="border-[rgba(var(--border),0.85)]">
        <Table>
          <THead>
            <TH className="w-16">#</TH>
            <TH>Email</TH>
            <TH>Actions</TH>
          </THead>
          <TBody>
            {leads.length === 0 && (
              <TR><td className="text-[rgba(var(--fg),0.6)] p-4 text-center" colSpan={3}>No leads yet. Upload a CSV with "email".</td></TR>
            )}
            {leads.map((l, idx) => (
              <TR key={l.id}>
                <TD className="w-16 text-[rgba(var(--fg),0.7)]">{idx + 1}</TD>
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
