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

  /* Apply preview theme in real-time */
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

  /* Logo Upload */
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

  /* Save Settings */
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

  /* Authentication */
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
      description: 'Soft whites with a calming blue accent',
      accentClass: 'from-blue-500/15 via-blue-500/10 to-transparent'
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: '🌙',
      description: 'Matte charcoal with teal highlights',
      accentClass: 'from-cyan-400/15 via-cyan-500/10 to-transparent'
    }
  ]), [])

  return (
    <div className="min-h-full p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-2xl p-8 border" style={{ backgroundColor: 'rgb(var(--card-bg))', borderColor: 'rgb(var(--border))' }}>
          <div className="absolute inset-0 opacity-80 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-white/10" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] font-semibold" style={{ color: 'rgba(var(--fg),0.65)' }}>Control Center</p>
              <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--fg))' }}>Settings</h1>
              <p className="text-sm" style={{ color: 'rgba(var(--fg),0.65)' }}>
                Personalize the look and feel, connect your account, and keep your outreach workspace tidy.
              </p>
              {previewTheme && (
                <div className="inline-flex items-center gap-3 px-3 py-2 rounded-lg border" style={{ borderColor: 'rgb(var(--accent))', backgroundColor: 'rgba(var(--accent),0.08)', color: 'rgb(var(--fg))' }}>
                  <span className="text-lg">👁️</span>
                  <span className="text-sm">Previewing <strong>{previewTheme}</strong> theme</span>
                  <Button variant="secondary" onClick={() => setPreviewTheme(null)} className="ml-1">Cancel</Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-1/2">
              <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgba(var(--accent),0.06)' }}>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(var(--fg),0.6)' }}>Connection</p>
                <p className="text-lg font-semibold" style={{ color: 'rgb(var(--fg))' }}>{status === 'connected' ? 'Ready to send' : 'Not connected'}</p>
                <p className="text-[11px] mt-1" style={{ color: 'rgba(var(--fg),0.55)' }}>Microsoft authentication status</p>
              </div>
              <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgba(var(--accent),0.04)' }}>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(var(--fg),0.6)' }}>Theme</p>
                <p className="text-lg font-semibold" style={{ color: 'rgb(var(--fg))' }}>{activeTheme}</p>
                <p className="text-[11px] mt-1" style={{ color: 'rgba(var(--fg),0.55)' }}>Live preview updates instantly</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-2xl border p-6 space-y-6" style={{ backgroundColor: 'rgb(var(--card-bg))', borderColor: 'rgb(var(--border))' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(var(--fg),0.55)' }}>Account</p>
                  <h2 className="text-xl font-semibold" style={{ color: 'rgb(var(--fg))' }}>Authentication</h2>
                  <p className="text-sm mt-1" style={{ color: 'rgba(var(--fg),0.65)' }}>Link your Microsoft account to send campaigns securely.</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${authStatus==='authenticated'?'bg-green-500/10 text-green-500 border-green-400/40':authStatus==='checking'?'bg-amber-500/10 text-amber-500 border-amber-400/40':'bg-rose-500/10 text-rose-500 border-rose-400/40'}`}>
                  {authStatus === 'authenticated' ? 'Connected' : authStatus === 'checking' ? 'Checking' : 'Not Connected'}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: 'rgb(var(--fg))' }}>Client ID</label>
                  <input
                    className="rounded-lg px-4 py-2.5 text-sm w-full font-mono border"
                    style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--fg))', borderColor: 'rgb(var(--border))' }}
                    value={localSettings.azure_client_id ?? ''}
                    onChange={e=>setLocalSettings({ ...localSettings, azure_client_id: e.target.value })}
                    placeholder="4bb85405-..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: 'rgb(var(--fg))' }}>Tenant ID</label>
                  <input
                    className="rounded-lg px-4 py-2.5 text-sm w-full border"
                    style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--fg))', borderColor: 'rgb(var(--border))' }}
                    value={localSettings.azure_tenant_id ?? ''}
                    onChange={e=>setLocalSettings({ ...localSettings, azure_tenant_id: e.target.value })}
                    placeholder="consumers"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: 'rgb(var(--fg))' }}>From Email</label>
                  <input
                    className="rounded-lg px-4 py-2.5 text-sm w-full border"
                    style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--fg))', borderColor: 'rgb(var(--border))' }}
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
                <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgba(var(--accent),0.04)' }}>
                  <div className="font-semibold mb-2" style={{ color: 'rgb(var(--fg))' }}>Complete authentication</div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgb(var(--bg))', borderColor: 'rgb(var(--border))' }}>
                      <div className="text-xs mb-1" style={{ color: 'rgba(var(--fg), 0.6)' }}>Visit URL</div>
                      <a href={verificationUri} target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-semibold hover:underline break-all" style={{ color: 'rgb(var(--accent))' }}>
                        {verificationUri}
                      </a>
                    </div>
                    <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgb(var(--bg))', borderColor: 'rgb(var(--border))' }}>
                      <div className="text-xs mb-1" style={{ color: 'rgba(var(--fg), 0.6)' }}>Enter code</div>
                      <div className="text-xl font-bold font-mono tracking-wider" style={{ color: 'rgb(var(--accent))' }}>{deviceCode}</div>
                    </div>
                  </div>
                  {polling && (
                    <div className="text-xs flex items-center gap-2 mt-3" style={{ color: 'rgba(var(--fg), 0.6)' }}>
                      <div className="animate-spin h-3 w-3 border-2 rounded-full" style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }}></div>
                      Waiting for authentication...
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border p-6 space-y-6" style={{ backgroundColor: 'rgb(var(--card-bg))', borderColor: 'rgb(var(--border))' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(var(--fg),0.55)' }}>Branding</p>
                  <h2 className="text-xl font-semibold" style={{ color: 'rgb(var(--fg))' }}>Identity</h2>
                  <p className="text-sm mt-1" style={{ color: 'rgba(var(--fg),0.65)' }}>Name your workspace and upload a logo for emails.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: 'rgb(var(--fg))' }}>App Name</label>
                  <input
                    className="rounded-lg px-4 py-2.5 text-sm w-full border"
                    style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--fg))', borderColor: 'rgb(var(--border))' }}
                    value={localSettings.appName ?? ''}
                    onChange={e=>setLocalSettings({ ...localSettings, appName: e.target.value })}
                    placeholder="Outreach"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: 'rgb(var(--fg))' }}>Upload Logo</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="rounded-lg px-4 py-2.5 text-sm w-full border cursor-pointer"
                      style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--fg))', borderColor: 'rgb(var(--border))' }}
                      onChange={handleLogoUpload}
                    />
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(var(--fg), 0.55)' }}>Use a square PNG or SVG for best results.</p>
                </div>
              </div>

              {(uploadedLogoPath || localSettings.appLogoUrl) && (
                <div className="p-4 border rounded-xl flex items-center gap-3" style={{ backgroundColor: 'rgba(var(--accent),0.05)', borderColor: 'rgb(var(--border))' }}>
                  <img src={uploadedLogoPath || localSettings.appLogoUrl} alt="Logo preview" className="w-12 h-12 object-contain rounded-lg" />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>Current logo</p>
                    <p className="text-xs" style={{ color: 'rgba(var(--fg), 0.55)' }}>Displayed across your navigation and outbound emails.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'rgb(var(--card-bg))', borderColor: 'rgb(var(--border))' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(var(--fg),0.55)' }}>Appearance</p>
                  <h2 className="text-xl font-semibold" style={{ color: 'rgb(var(--fg))' }}>Theme</h2>
                  <p className="text-sm mt-1" style={{ color: 'rgba(var(--fg),0.65)' }}>Preview each palette and save the one you like.</p>
                </div>
              </div>

              <div className="space-y-3">
                {themeOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setPreviewTheme(opt.id)}
                    className={`w-full text-left border rounded-xl p-4 flex items-start gap-3 transition-all ${activeTheme === opt.id ? 'ring-2 ring-[rgb(var(--accent))]' : ''}`}
                    style={{
                      borderColor: activeTheme === opt.id ? 'rgb(var(--accent))' : 'rgb(var(--border))',
                      backgroundColor: activeTheme === opt.id ? 'rgba(var(--accent),0.08)' : 'rgba(var(--accent),0.03)'
                    }}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${opt.accentClass}`}>
                      <span className="text-xl">{opt.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'rgb(var(--fg))' }}>{opt.label}</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(var(--fg),0.65)' }}>{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-xs px-3 py-2 rounded-lg border" style={{ backgroundColor: 'rgba(var(--accent),0.04)', borderColor: 'rgb(var(--border))', color: 'rgba(var(--fg),0.7)' }}>
                💡 Click a theme to preview instantly. Saving applies it everywhere.
              </div>
            </div>

            <div className="rounded-2xl border p-6 space-y-3" style={{ backgroundColor: 'rgb(var(--card-bg))', borderColor: 'rgb(var(--border))' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--accent),0.15)' }}>🗑️</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>Data cleanup</p>
                  <p className="text-xs" style={{ color: 'rgba(var(--fg),0.65)' }}>Remove locally saved leads, campaigns, logs, and settings.</p>
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
    </div>
  )
}
