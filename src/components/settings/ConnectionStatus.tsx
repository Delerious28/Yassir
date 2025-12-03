import Button from '../ui/Button'
import { useStore } from '../../store/store'

export default function ConnectionStatus() {
  const status = useStore(s => s.connection)
  const setStatus = useStore(s => s.setConnection)

  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex items-center gap-2 text-sm ${status === 'connected' ? 'text-green-700' : status === 'mock' ? 'text-amber-700' : 'text-red-700'}`}>
        <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'mock' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
        {status === 'connected' ? 'Outlook Connected' : status === 'mock' ? 'Mock Mode' : 'Disconnected'}
      </span>
      {status !== 'connected' && (
        <Button variant="secondary" onClick={() => setStatus('connected')}>Connect</Button>
      )}
    </div>
  )
}
