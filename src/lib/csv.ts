import Papa from 'papaparse'

export type ParsedLead = { email: string }

export function parseLeadsCsv(content: string): ParsedLead[] {
  const res = Papa.parse(content.trim(), { header: true, skipEmptyLines: true })
  if (res.errors?.length) {
    // ignore rows with errors; a backend can validate later
  }
  const rows = (res.data as any[]).map((r) => ({ email: String(r.email || '').trim() })).filter((r) => r.email)
  return rows
}
