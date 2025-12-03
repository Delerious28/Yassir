import { useState, useEffect } from "react"
import Card from "../components/ui/Card"
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
    html.className = `theme-${previewTheme || theme}`
  }, [previewTheme, theme])

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  useEffect(() => () => {
    // reset theme if user leaves preview on
    document.documentElement.className = `theme-${theme}`
  }, [])
  
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
  
  return (
    <div className="min-h-full p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--fg))' }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(var(--fg), 0.6)' }}>Configure your application preferences</p>
        </div>

        {/* Theme Preview Banner */}
        {previewTheme && (
          <div className="border-2 rounded-lg p-4 flex items-center justify-between" style={{ 
            borderColor: 'rgb(var(--accent))', 
            backgroundColor: 'rgba(var(--accent), 0.1)' 
          }}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">👁️</div>
              <div>
                <div className="font-semibold" style={{ color: 'rgb(var(--fg))' }}>Theme Preview Active</div>
                <div className="text-sm" style={{ color: 'rgba(var(--fg), 0.7)' }}>You're previewing the {previewTheme} theme. Save to keep it or cancel to revert.</div>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setPreviewTheme(null)}>Cancel Preview</Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Authentication Widget */}
          <div className="rounded-lg p-6 border" style={{ 
            backgroundColor: 'rgb(var(--card-bg))', 
            borderColor: 'rgb(var(--border))' 
          }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--accent), 0.15)' }}>
                <span className="text-2xl">🔐</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: 'rgb(var(--fg))' }}>Authentication</h3>
                <p className="text-sm" style={{ color: 'rgba(var(--fg), 0.6)' }}>Microsoft Account</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(var(--accent), 0.05)' }}>
                <span className="text-sm font-medium" style={{ color: 'rgb(var(--fg))' }}>Status</span>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${authStatus==='authenticated'?'bg-green-500/20 text-green-600':authStatus==='checking'?'bg-gray-500/20 text-gray-600':'bg-red-500/20 text-red-600'}`}>
                  {authStatus === 'authenticated' ? '✓ Connected' : authStatus === 'checking' ? 'Checking...' : '✗ Not Connected'}
                </span>
              </div>
              {authStatus === 'not_authenticated' && !deviceCode && (
                <Button onClick={startAuth} className="w-full">Connect Account</Button>
              )}
              {authStatus === 'authenticated' && (
                <Button variant="secondary" onClick={checkAuth} className="w-full">Refresh Status</Button>
              )}
              
              {deviceCode && verificationUri && (
                <div className="border-2 rounded-lg p-4 mt-3" style={{ 
                  borderColor: 'rgb(var(--accent))', 
                  backgroundColor: 'rgba(var(--accent), 0.05)' 
                }}>
                  <div className="font-semibold mb-3" style={{ color: 'rgb(var(--fg))' }}>Authentication Required</div>
                  <div className="space-y-3">
                    <div className="rounded p-3" style={{ backgroundColor: 'rgb(var(--bg))', border: '1px solid rgb(var(--border))' }}>
                      <div className="text-xs mb-1" style={{ color: 'rgba(var(--fg), 0.6)' }}>Visit URL:</div>
                      <a href={verificationUri} target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-semibold hover:underline break-all" style={{ color: 'rgb(var(--accent))' }}>
                        {verificationUri}
                      </a>
                    </div>
                    <div className="rounded p-3" style={{ backgroundColor: 'rgb(var(--bg))', border: '1px solid rgb(var(--border))' }}>
                      <div className="text-xs mb-1" style={{ color: 'rgba(var(--fg), 0.6)' }}>Enter code:</div>
                      <div className="text-xl font-bold font-mono tracking-wider" style={{ color: 'rgb(var(--accent))' }}>{deviceCode}</div>
                    </div>
                    {polling && (
                      <div className="text-xs flex items-center gap-2" style={{ color: 'rgba(var(--fg), 0.6)' }}>
                        <div className="animate-spin h-3 w-3 border-2 rounded-full" style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }}></div>
                        Waiting for authentication...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Branding Widget */}
          <div className="rounded-lg p-6 border" style={{ 
            backgroundColor: 'rgb(var(--card-bg))', 
            borderColor: 'rgb(var(--border))' 
          }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--accent), 0.15)' }}>
                <span className="text-2xl">🎨</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: 'rgb(var(--fg))' }}>Branding</h3>
                <p className="text-sm" style={{ color: 'rgba(var(--fg), 0.6)' }}>Customize your app</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'rgb(var(--fg))' }}>App Name</label>
                <input 
                  className="rounded-lg px-4 py-2.5 text-sm w-full border" 
                  style={{ 
                    backgroundColor: 'rgb(var(--bg))', 
                    color: 'rgb(var(--fg))', 
                    borderColor: 'rgb(var(--border))' 
                  }}
                  value={localSettings.appName ?? ''} 
                  onChange={e=>setLocalSettings({ ...localSettings, appName: e.target.value })} 
                  placeholder="Outreach" 
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'rgb(var(--fg))' }}>Upload Logo</label>
                <input 
                  type="file"
                  accept="image/*"
                  className="rounded-lg px-4 py-2.5 text-sm w-full border cursor-pointer" 
                  style={{ 
                    backgroundColor: 'rgb(var(--bg))', 
                    color: 'rgb(var(--fg))', 
                    borderColor: 'rgb(var(--border))' 
                  }}
                  onChange={handleLogoUpload}
                />
                <p className="text-xs mt-2" style={{ color: 'rgba(var(--fg), 0.5)' }}>Upload your own logo image</p>
                {(uploadedLogoPath || localSettings.appLogoUrl) && (
                  <div className="mt-3 p-3 border rounded-lg flex items-center gap-3" style={{ 
                    backgroundColor: 'rgba(var(--accent), 0.05)', 
                    borderColor: 'rgb(var(--border))' 
                  }}>
                    <img src={uploadedLogoPath || localSettings.appLogoUrl} alt="Logo preview" className="w-10 h-10 object-contain" />
                    <span className="text-sm" style={{ color: 'rgb(var(--fg))' }}>Current logo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Theme Widget */}
          <div className="rounded-lg p-6 border" style={{ 
            backgroundColor: 'rgb(var(--card-bg))', 
            borderColor: 'rgb(var(--border))' 
          }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--accent), 0.15)' }}>
                <span className="text-2xl">🌓</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: 'rgb(var(--fg))' }}>Appearance</h3>
                <p className="text-sm" style={{ color: 'rgba(var(--fg), 0.6)' }}>Theme settings</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setPreviewTheme('light')}
                  className="p-4 border-2 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-2"
                  style={{
                    borderColor: activeTheme === 'light' ? 'rgb(var(--accent))' : 'rgb(var(--border))',
                    backgroundColor: activeTheme === 'light' ? 'rgba(var(--accent), 0.1)' : 'transparent',
                    color: 'rgb(var(--fg))'
                  }}
                >
                  <span className="text-2xl">☀️</span>
                  <span>Light</span>
                </button>
                <button 
                  onClick={() => setPreviewTheme('dark')}
                  className="p-4 border-2 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-2"
                  style={{
                    borderColor: activeTheme === 'dark' ? 'rgb(var(--accent))' : 'rgb(var(--border))',
                    backgroundColor: activeTheme === 'dark' ? 'rgba(var(--accent), 0.1)' : 'transparent',
                    color: 'rgb(var(--fg))'
                  }}
                >
                  <span className="text-2xl">🌙</span>
                  <span>Dark</span>
                </button>
                <button 
                  onClick={() => setPreviewTheme('cyber')}
                  className="p-4 border-2 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-2"
                  style={{
                    borderColor: activeTheme === 'cyber' ? 'rgb(var(--accent))' : 'rgb(var(--border))',
                    backgroundColor: activeTheme === 'cyber' ? 'rgba(var(--accent), 0.1)' : 'transparent',
                    color: 'rgb(var(--fg))'
                  }}
                >
                  <span className="text-2xl">⚡</span>
                  <span>Cyber</span>
                </button>
              </div>
              <div className="text-xs p-3 rounded-lg" style={{ 
                backgroundColor: 'rgba(var(--accent), 0.05)', 
                color: 'rgba(var(--fg), 0.7)' 
              }}>
                💡 Click a theme to preview it. Remember to save your changes!
              </div>
            </div>
          </div>

          {/* Azure Configuration Widget */}
          <div className="rounded-lg p-6 border" style={{ 
            backgroundColor: 'rgb(var(--card-bg))', 
            borderColor: 'rgb(var(--border))' 
          }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--accent), 0.15)' }}>
                <span className="text-2xl">☁️</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: 'rgb(var(--fg))' }}>Azure Config</h3>
                <p className="text-sm" style={{ color: 'rgba(var(--fg), 0.6)' }}>App registration</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'rgb(var(--fg))' }}>Client ID</label>
                <input 
                  className="rounded-lg px-4 py-2.5 text-sm w-full font-mono border" 
                  style={{ 
                    backgroundColor: 'rgb(var(--bg))', 
                    color: 'rgb(var(--fg))', 
                    borderColor: 'rgb(var(--border))' 
                  }}
                  value={localSettings.azure_client_id ?? ''} 
                  onChange={e=>setLocalSettings({ ...localSettings, azure_client_id: e.target.value })} 
                  placeholder="4bb85405-..." 
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'rgb(var(--fg))' }}>Tenant ID</label>
                <input 
                  className="rounded-lg px-4 py-2.5 text-sm w-full border" 
                  style={{ 
                    backgroundColor: 'rgb(var(--bg))', 
                    color: 'rgb(var(--fg))', 
                    borderColor: 'rgb(var(--border))' 
                  }}
                  value={localSettings.azure_tenant_id ?? ''} 
                  onChange={e=>setLocalSettings({ ...localSettings, azure_tenant_id: e.target.value })} 
                  placeholder="consumers" 
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'rgb(var(--fg))' }}>From Email</label>
                <input 
                  className="rounded-lg px-4 py-2.5 text-sm w-full border" 
                  style={{ 
                    backgroundColor: 'rgb(var(--bg))', 
                    color: 'rgb(var(--fg))', 
                    borderColor: 'rgb(var(--border))' 
                  }}
                  value={localSettings.mail_from ?? ''} 
                  onChange={e=>setLocalSettings({ ...localSettings, mail_from: e.target.value })} 
                  placeholder="your@email.com" 
                />
              </div>
            </div>
          </div>

          {/* Data Management Widget */}
          <div className="rounded-lg p-6 border lg:col-span-2" style={{ 
            backgroundColor: 'rgb(var(--card-bg))', 
            borderColor: 'rgb(var(--border))' 
          }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--accent), 0.15)' }}>
                <span className="text-2xl">🗑️</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: 'rgb(var(--fg))' }}>Data Management</h3>
                <p className="text-sm" style={{ color: 'rgba(var(--fg), 0.6)' }}>Reset your local data</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'rgba(var(--fg), 0.8)' }}>Remove all locally saved leads, campaigns, logs, and settings</p>
              <Button variant="secondary" onClick={resetAll}>Clear All Data</Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
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
