import { useEffect, useMemo, useState } from "react"
import Button from "../components/ui/Button"
import { useStore } from "../store/store"

export default function Settings() {
  const status = useStore(s => s.connection)
  const setStatus = useStore(s => s.setConnection)

  const theme = useStore(s => s.uiTheme)
  const setTheme = useStore(s => s.setUiTheme)

  const settings = useStore(s => s.settings)
  const setSettings = useStore(s => s.setSettings)

  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'not_authenticated'>('checking')
  const [deviceCode, setDeviceCode] = useState<string | null>(null)
  const [verificationUri, setVerificationUri] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)

  const [localSettings, setLocalSettings] = useState(settings || {})
  const [previewTheme, setPreviewTheme] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const [uploadedLogoPath, setUploadedLogoPath] = useState<string | null>(null)

  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('theme-light', 'theme-dark')
    html.classList.add(`theme-${previewTheme || theme}`)
    return () => {
      html.classList.remove('theme-light', 'theme-dark')
      html.classList.add(`theme-${theme}`)
    }
  }, [previewTheme, theme])

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const resetAll = () => {
    localStorage.removeItem("outreach-state")
    location.reload()
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("logo", file)

    try {
      const resp = await fetch("http://localhost:8000/upload/logo", {
        method: "POST",
        body: formData
      })
      const data = await resp.json()
      setUploadedLogoPath(data.path)
      setLocalSettings({ ...localSettings, appLogoUrl: data.path })
    } catch {
      alert("Failed to upload logo")
    }
  }

  function saveAllSettings() {
    setSaveStatus("saving")
    setSettings(localSettings)

    const chosen = previewTheme || theme
    setTheme(chosen as any)
    setPreviewTheme(null)

    setTimeout(() => {
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }, 500)
  }

  async function checkAuth() {
    const clientId = localSettings.azure_client_id || "4bb85405-0fc5-4dcc-b758-f2bb54057a57"
    const tenantId = localSettings.azure_tenant_id || "consumers"
    setAuthStatus("checking")

    try {
      const r = await fetch(
        `http://localhost:8000/auth/status?client_id=${clientId}&tenant_id=${tenantId}`
      )
      const data = await r.json()
      setAuthStatus(data.authenticated ? "authenticated" : "not_authenticated")
      if (data.authenticated) {
        setDeviceCode(null)
        setVerificationUri(null)
        setPolling(false)
      }
    } catch {
      setAuthStatus("not_authenticated")
    }
  }

  async function startAuth() {
    const r = await fetch(`http://localhost:8000/auth/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        azure_client_id: localSettings.azure_client_id,
        azure_tenant_id: localSettings.azure_tenant_id
      })
    })

    const data = await r.json()
    setDeviceCode(data.user_code)
    setVerificationUri(data.verification_uri)
    setPolling(true)
    pollAuth()
  }

  async function pollAuth() {
    let attempts = 0

    const loop = setInterval(async () => {
      attempts++
      if (attempts > 60) {
        clearInterval(loop)
        setPolling(false)
        return
      }

      const r = await fetch(`http://localhost:8000/auth/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          azure_client_id: localSettings.azure_client_id,
          azure_tenant_id: localSettings.azure_tenant_id
        })
      })

      if (r.ok) {
        clearInterval(loop)
        setAuthStatus("authenticated")
        setPolling(false)
        setStatus("connected")
        setDeviceCode(null)
        setVerificationUri(null)
      }
    }, 5000)
  }

  const activeTheme = previewTheme || theme

  const themeOptions = useMemo(() => ([
    {
      id: 'light',
      label: 'Light',
      icon: '☀️',
      description: 'Soft whites with a calm blue accent'
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: '🌙',
      description: 'Matte charcoal with teal highlights'
    }
  ]), [])

  return (
    <div className="space-y-6">
      <div className="p-6 border border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--card-bg))] space-y-2">
        <p className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">Control center</p>
        <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Settings</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Clean, flat controls for theme, authentication, and workspace identity.</p>
        {previewTheme && (
          <div className="inline-flex items-center gap-3 px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.04)] text-[rgb(var(--fg))]">
            <span className="text-lg">👁️</span>
            <span className="text-sm">Previewing <strong>{previewTheme}</strong> theme</span>
            <Button variant="secondary" onClick={() => setPreviewTheme(null)} className="ml-1">Cancel</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card-bg))] p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Account</p>
                <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Authentication</h2>
                <p className="text-sm text-[rgb(var(--muted))]">Link your Microsoft account to send campaigns securely.</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${authStatus==='authenticated'?'bg-green-50 text-green-600 border-green-200':authStatus==='checking'?'bg-amber-50 text-amber-600 border-amber-200':'bg-rose-50 text-rose-600 border-rose-200'}`}>
                {authStatus === 'authenticated' ? 'Connected' : authStatus === 'checking' ? 'Checking' : 'Not Connected'}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[rgb(var(--fg))]">Client ID</label>
                <input
                  className="rounded-lg px-4 py-2.5 text-sm w-full font-mono border"
                  style={{ backgroundColor: 'rgb(var(--card-bg))', color: 'rgb(var(--fg))', borderColor: 'rgb(var(--border))' }}
                  value={localSettings.azure_client_id ?? ''}
                  onChange={e=>setLocalSettings({ ...localSettings, azure_client_id: e.target.value })}
                  placeholder="4bb85405-..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[rgb(var(--fg))]">Tenant ID</label>
                <input
                  className="rounded-lg px-4 py-2.5 text-sm w-full border"
                  style={{ backgroundColor: 'rgb(var(--card-bg))', color: 'rgb(var(--fg))', borderColor: 'rgb(var(--border))' }}
                  value={localSettings.azure_tenant_id ?? ''}
                  onChange={e=>setLocalSettings({ ...localSettings, azure_tenant_id: e.target.value })}
                  placeholder="consumers"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[rgb(var(--fg))]">From Email</label>
                <input
                  className="rounded-lg px-4 py-2.5 text-sm w-full border"
                  style={{ backgroundColor: 'rgb(var(--card-bg))', color: 'rgb(var(--fg))', borderColor: 'rgb(var(--border))' }}
                  value={localSettings.mail_from ?? ''}
                  onChange={e=>setLocalSettings({ ...localSettings, mail_from: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
              <div className="flex items-end gap-3">
                {authStatus === 'not_authenticated' && !deviceCode && (
                  <Button onClick={startAuth} className="w-full">Connect Account</Button>
                )}
                {authStatus === 'authenticated' && (
                  <Button variant="secondary" onClick={checkAuth} className="w-full">Refresh Status</Button>
                )}
              </div>
            </div>

            {deviceCode && verificationUri && (
              <div className="rounded-xl border border-[rgb(var(--border))] p-4 bg-[rgb(var(--card-bg))]">
                <div className="font-semibold mb-2 text-[rgb(var(--fg))]">Complete authentication</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg p-3 border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
                    <div className="text-xs mb-1 text-[rgb(var(--muted))]">Visit URL</div>
                    <a href={verificationUri} target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-semibold hover:underline break-all text-[rgb(var(--accent))]">
                      {verificationUri}
                    </a>
                  </div>
                  <div className="rounded-lg p-3 border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
                    <div className="text-xs mb-1 text-[rgb(var(--muted))]">Enter code</div>
                    <div className="text-xl font-bold font-mono tracking-wider text-[rgb(var(--accent))]">{deviceCode}</div>
                  </div>
                </div>
                {polling && (
                  <div className="text-xs flex items-center gap-2 mt-3 text-[rgb(var(--muted))]">
                    <div className="animate-spin h-3 w-3 border-2 rounded-full" style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }}></div>
                    Waiting for authentication...
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card-bg))] p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Branding</p>
                <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Identity</h2>
                <p className="text-sm text-[rgb(var(--muted))]">Name your workspace and upload a logo.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[rgb(var(--fg))]">App Name</label>
                <input
                  className="rounded-lg px-4 py-2.5 text-sm w-full border"
                  style={{ backgroundColor: 'rgb(var(--card-bg))', color: 'rgb(var(--fg))', borderColor: 'rgb(var(--border))' }}
                  value={localSettings.appName ?? ''}
                  onChange={e=>setLocalSettings({ ...localSettings, appName: e.target.value })}
                  placeholder="Outreach"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[rgb(var(--fg))]">Upload Logo</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    className="rounded-lg px-4 py-2.5 text-sm w-full border cursor-pointer"
                    style={{ backgroundColor: 'rgb(var(--card-bg))', color: 'rgb(var(--fg))', borderColor: 'rgb(var(--border))' }}
                    onChange={handleLogoUpload}
                  />
                </div>
                <p className="text-xs text-[rgb(var(--muted))]">Use a square PNG or SVG for best results.</p>
              </div>
            </div>

            {(uploadedLogoPath || localSettings.appLogoUrl) && (
              <div className="p-4 border border-[rgb(var(--border))] rounded-xl flex items-center gap-3 bg-[rgb(var(--card-bg))]">
                <img src={uploadedLogoPath || localSettings.appLogoUrl} alt="Logo preview" className="w-12 h-12 object-contain rounded-lg" />
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">Current logo</p>
                  <p className="text-xs text-[rgb(var(--muted))]">Displayed across your navigation and outbound emails.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card-bg))] p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Appearance</p>
                <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Theme</h2>
                <p className="text-sm text-[rgb(var(--muted))]">Preview each palette and save the one you like.</p>
              </div>
            </div>

            <div className="space-y-3">
              {themeOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPreviewTheme(opt.id)}
                  className={`w-full text-left border rounded-xl p-4 flex items-start gap-3 transition-all ${activeTheme === opt.id ? 'border-[rgb(var(--accent))]' : 'border-[rgb(var(--border))]'}`}
                  style={{ backgroundColor: activeTheme === opt.id ? 'rgba(var(--accent),0.08)' : 'rgb(var(--card-bg))' }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(var(--fg),0.06)]">
                    <span className="text-xl">{opt.icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[rgb(var(--fg))]">{opt.label}</p>
                    <p className="text-xs mt-1 text-[rgb(var(--muted))]">{opt.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="text-xs px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.04)] text-[rgb(var(--muted))]">
              💡 Click a theme to preview instantly. Saving applies it everywhere.
            </div>
          </div>

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card-bg))] p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(var(--accent),0.1)]">🗑️</div>
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">Data cleanup</p>
                <p className="text-xs text-[rgb(var(--muted))]">Remove locally saved leads, campaigns, logs, and settings.</p>
              </div>
            </div>
            <Button variant="secondary" onClick={resetAll} className="w-full">Clear All Data</Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={saveAllSettings}
          disabled={saveStatus === 'saving'}
          className="px-8 py-3"
        >
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved!' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  )
}
