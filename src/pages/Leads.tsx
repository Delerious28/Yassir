import { useStore } from '../store/store'
import LeadsUpload from '../components/leads/LeadsUpload'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Table, THead, TH, TBody, TR, TD } from '../components/ui/Table'

export default function Leads() {
  const { leads, removeLead } = useStore()
  return (
    <div className="grid gap-6">
      <LeadsUpload />
      <Card title="Leads">
        <Table>
          <THead>
            <TH>Email</TH>
            <TH>Actions</TH>
          </THead>
          <TBody>
            {leads.length === 0 && (
              <TR><td className="text-gray-500 p-4 text-center" colSpan={2}>No leads yet. Upload a CSV with "email".</td></TR>
            )}
            {leads.map(l => (
              <TR key={l.id}>
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
