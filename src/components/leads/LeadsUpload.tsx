import { useRef, useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { parseLeadsCsv } from '../../lib/csv'
import { useStore } from '../../store/store'

export default function LeadsUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const addLeads = useStore(s => s.addLeads)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imported, setImported] = useState<number>(0)

  async function handleFiles(files: FileList | null) {
    setError(null)
    setImported(0)
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file with an "email" column.')
      return
    }
    const text = await file.text()
    const rows = parseLeadsCsv(text)
    if (rows.length === 0) {
      setError('No valid rows found. Ensure there is an "email" header and non-empty values.')
      return
    }
    const unique = Array.from(new Set(rows.map(r => r.email.toLowerCase()))).map(email => ({ email }))
    addLeads(unique)
    setImported(unique.length)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <Card title="Upload Leads (CSV)">
      <div
        onDragOver={(e)=>{ e.preventDefault(); setDragOver(true) }}
        onDragLeave={()=>setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-300 bg-gray-50'}`}
      >
        <div className="mb-3 text-sm text-gray-700">Drop a CSV here or select a file.</div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={()=>inputRef.current?.click()}>Choose File</Button>
          <a
            className="text-sm text-brand-700 hover:underline"
            href={URL.createObjectURL(new Blob(["email\nfounder@example.com\nhello@company.com\n"], { type: 'text/csv' }))}
            download="leads-template.csv"
          >Download template</a>
        </div>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e)=>handleFiles(e.target.files)} />
      </div>
      {error && <div className="mt-3 text-sm text-red-700">{error}</div>}
      {imported > 0 && <div className="mt-3 text-sm text-green-700">Imported {imported} lead(s).</div>}
    </Card>
  )
}
