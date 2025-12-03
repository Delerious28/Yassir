import { useMemo, useState } from 'react'
import { MoveUp, MoveDown, Trash2, Palette, Image as ImageIcon, Type, Paperclip, Upload } from 'lucide-react'
import Button from '../components/ui/Button'
import { useStore } from '../store/store'
import type { EmailBlock, TemplateAttachment } from '../store/types'
import { nanoid } from '../utils/nanoid'

const blockPalette: { label: string; type: EmailBlock['type']; description: string; icon: typeof Type }[] = [
  { label: 'Text', type: 'text', description: 'Paragraphs, disclaimers, and signatures', icon: Type },
  { label: 'Image', type: 'image', description: 'Brand art or hero images', icon: ImageIcon },
  { label: 'Button', type: 'button', description: 'Primary calls to action', icon: Upload },
]

const fontOptions = [
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  '"Times New Roman", serif',
  '"Helvetica Neue", Arial, sans-serif',
  '"Courier New", monospace',
]

export default function TemplateBuilder() {
  const template = useStore(s => s.settings.defaultEmailTemplate)
  const brandLogo = useStore(s => s.settings.brandLogoUrl)
  const setSettings = useStore(s => s.setSettings)

  const [localBlocks, setLocalBlocks] = useState<EmailBlock[]>(template?.blocks || [])
  const [localAttachments, setLocalAttachments] = useState<TemplateAttachment[]>(template?.attachments || [])
  const [name, setName] = useState(template?.name || 'Default template')
  const [brandColor, setBrandColor] = useState(template?.brandColor || '#2563EB')
  const [logo, setLogo] = useState(brandLogo || '')

  const previewHtml = useMemo(() => renderPreview(localBlocks, brandColor, localAttachments), [localBlocks, brandColor, localAttachments])

  function addBlock(type: EmailBlock['type']) {
    const starter: EmailBlock = {
      id: nanoid(),
      type,
      content: type === 'image' ? '' : type === 'button' ? 'Call to action' : 'Write your email copy here.',
      align: 'left',
      padding: '12px',
      background: type === 'button' ? brandColor : undefined,
      textColor: type === 'button' ? '#FFFFFF' : undefined,
      fontFamily: type === 'text' ? 'Inter, system-ui, sans-serif' : undefined,
      fontSize: type === 'text' ? '16px' : undefined,
      buttonUrl: type === 'button' ? 'https://example.com' : undefined,
    }
    setLocalBlocks(b => [...b, starter])
  }

  function readImageFile(file: File, onDone: (dataUrl: string) => void) {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        onDone(result)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleBlockImageUpload(blockId: string, file?: File | null) {
    if (!file) return
    readImageFile(file, dataUrl => updateBlock(blockId, { content: dataUrl }))
  }

  function handleLogoUpload(file?: File | null) {
    if (!file) return
    readImageFile(file, dataUrl => setLogo(dataUrl))
  }

  function move(id: string, dir: -1 | 1) {
    setLocalBlocks(b => {
      const idx = b.findIndex(x => x.id === id)
      if (idx < 0) return b
      const next = [...b]
      const swap = idx + dir
      if (swap < 0 || swap >= b.length) return b
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  function updateBlock(id: string, patch: Partial<EmailBlock>) {
    setLocalBlocks(b => b.map(block => block.id === id ? { ...block, ...patch } : block))
  }

  function removeBlock(id: string) {
    setLocalBlocks(b => b.filter(block => block.id !== id))
  }

  function addAttachment() {
    setLocalAttachments(a => [...a, { id: nanoid(), label: 'Attachment.pdf', url: '' }])
  }

  function updateAttachment(id: string, patch: Partial<TemplateAttachment>) {
    setLocalAttachments(a => a.map(att => att.id === id ? { ...att, ...patch } : att))
  }

  function removeAttachment(id: string) {
    setLocalAttachments(a => a.filter(att => att.id !== id))
  }

  function saveTemplate() {
    setSettings({
      defaultEmailTemplate: {
        name,
        brandColor,
        blocks: localBlocks,
        attachments: localAttachments,
      },
      brandLogoUrl: logo || undefined,
    })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
      <div className="xl:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Design emails</h1>
            <p className="text-sm text-[rgb(var(--muted))]">Assemble text, images, buttons, and attachments for your outgoing emails.</p>
          </div>
          <Button onClick={saveTemplate}>Save as default</Button>
        </div>

        <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card-bg))] space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <label className="text-sm font-medium text-[rgb(var(--muted))]">Template name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="flex-1 rounded-lg border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <label className="text-sm font-medium text-[rgb(var(--muted))]">Brand color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="h-10 w-14 rounded-lg border border-[rgb(var(--border))]" />
              <input value={brandColor} onChange={e => setBrandColor(e.target.value)} className="rounded-lg border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <label className="text-sm font-medium text-[rgb(var(--muted))]">Brand logo</label>
            <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
              <input type="file" accept="image/*" onChange={e => handleLogoUpload(e.target.files?.[0])} className="text-sm" />
              {logo && (
                <div className="flex items-center gap-2">
                  <img src={logo} alt="Brand logo preview" className="h-10 w-10 rounded border border-[rgb(var(--border))] object-contain" />
                  <button onClick={() => setLogo('')} className="text-xs px-3 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.04)]">Remove</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {blockPalette.map(({ label, type, description, icon: Icon }) => (
            <button key={type} onClick={() => addBlock(type)} className="p-3 rounded-lg border border-[rgb(var(--border))] text-left bg-[rgb(var(--card-bg))] hover:border-[rgb(var(--accent))] transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[rgba(var(--accent),0.1)] text-[rgb(var(--accent))]"><Icon size={16} /></div>
                <span className="font-semibold text-xs">{label}</span>
              </div>
              <p className="text-xs text-[rgb(var(--muted))] leading-relaxed">{description}</p>
            </button>
          ))}
          <button onClick={addAttachment} className="p-3 rounded-lg border border-[rgb(var(--border))] text-left bg-[rgb(var(--card-bg))] hover:border-[rgb(var(--accent))] transition">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[rgba(var(--accent),0.1)] text-[rgb(var(--accent))]"><Paperclip size={16} /></div>
              <span className="font-semibold text-xs">Attachment</span>
            </div>
            <p className="text-xs text-[rgb(var(--muted))] leading-relaxed">Collect files to append at the bottom of the email.</p>
          </button>
        </div>

        <div className="space-y-3">
          {localBlocks.length === 0 && (
            <div className="p-6 rounded-xl border border-dashed border-[rgb(var(--border))] text-center text-[rgb(var(--muted))]">Add a block to start designing.</div>
          )}
          {localBlocks.map(block => (
            <div key={block.id} className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card-bg))] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[rgb(var(--muted))] text-sm">
                  {block.type === 'text' && <Type size={16} />}
                  {block.type === 'image' && <ImageIcon size={16} />}
                  {block.type === 'button' && <Palette size={16} />}
                  <span className="font-medium capitalize">{block.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => move(block.id, -1)} className="p-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.04)]"><MoveUp size={16} /></button>
                  <button onClick={() => move(block.id, 1)} className="p-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.04)]"><MoveDown size={16} /></button>
                  <button onClick={() => removeBlock(block.id)} className="p-2 rounded-lg border border-[rgb(var(--border))] text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-[rgb(var(--muted))]">{block.type === 'button' ? 'Button label' : block.type === 'image' ? 'Image source (optional URL)' : 'Content'}</label>
                  {block.type === 'text' ? (
                    <textarea value={block.content} onChange={e => updateBlock(block.id, { content: e.target.value })} className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent p-2 text-sm" rows={3} />
                  ) : (
                    <input value={block.content} onChange={e => updateBlock(block.id, { content: e.target.value })} className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm" />
                  )}
                  {block.type === 'image' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[rgb(var(--muted))]">Upload image</label>
                      <input type="file" accept="image/*" onChange={e => handleBlockImageUpload(block.id, e.target.files?.[0])} className="text-sm" />
                      {block.content && <img src={block.content} alt="Uploaded block" className="h-24 w-full rounded-lg object-cover border border-[rgb(var(--border))]" />}
                    </div>
                  )}
                  {block.type === 'button' && (
                    <div className="space-y-1">
                      <label className="text-xs text-[rgb(var(--muted))]">Button link</label>
                      <input value={block.buttonUrl || ''} onChange={e => updateBlock(block.id, { buttonUrl: e.target.value })} placeholder="https://destination.com" className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-[rgb(var(--muted))]">Alignment</label>
                    <select value={block.align || 'left'} onChange={e => updateBlock(block.id, { align: e.target.value as any })} className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-2 py-2 text-sm">
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[rgb(var(--muted))]">Padding</label>
                    <input value={block.padding || ''} onChange={e => updateBlock(block.id, { padding: e.target.value })} placeholder="12px 8px" className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-2 py-2 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[rgb(var(--muted))]">Background</label>
                    <input value={block.background || ''} onChange={e => updateBlock(block.id, { background: e.target.value })} placeholder="#ffffff" className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-2 py-2 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[rgb(var(--muted))]">Text color</label>
                    <input value={block.textColor || ''} onChange={e => updateBlock(block.id, { textColor: e.target.value })} placeholder="#1f2937" className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-2 py-2 text-sm" />
                  </div>
                  {block.type === 'text' && (
                    <>
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs text-[rgb(var(--muted))]">Font family</label>
                        <select value={block.fontFamily || fontOptions[0]} onChange={e => updateBlock(block.id, { fontFamily: e.target.value })} className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-2 py-2 text-sm">
                          {fontOptions.map(font => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-[rgb(var(--muted))]">Font size</label>
                        <input value={block.fontSize || '16px'} onChange={e => updateBlock(block.id, { fontSize: e.target.value })} placeholder="16px" className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-2 py-2 text-sm" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {localAttachments.length > 0 && (
            <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card-bg))] space-y-3">
              <div className="flex items-center gap-2 text-[rgb(var(--muted))] text-sm font-medium"><Paperclip size={16} /> Attachments</div>
              {localAttachments.map(att => (
                <div key={att.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                  <input value={att.label} onChange={e => updateAttachment(att.id, { label: e.target.value })} className="md:col-span-2 rounded-lg border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm" />
                  <input value={att.url || ''} onChange={e => updateAttachment(att.id, { url: e.target.value })} placeholder="https://..." className="md:col-span-2 rounded-lg border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm" />
                  <button onClick={() => removeAttachment(att.id)} className="justify-self-start px-3 py-2 rounded-lg border border-[rgb(var(--border))] text-red-500 hover:bg-red-50 text-sm">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 xl:col-span-2">
        <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card-bg))] flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Live preview</h2>
            <p className="text-xs text-[rgb(var(--muted))]">Saved design is used as the default when sending emails.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
            <Palette size={16} />
            <span>{brandColor}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-white text-black overflow-hidden shadow-lg">
          <div className="bg-gray-100 px-6 py-4 flex items-center gap-3">
            {logo && <img src={logo} alt="Brand logo" className="h-10 w-10 object-contain" />}
            <div>
              <p className="text-xs text-gray-500">Template</p>
              <p className="font-semibold text-gray-800 text-lg leading-tight">{name}</p>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4 text-base" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            {localAttachments.length > 0 && (
              <div className="mt-5 border-t pt-4 text-sm">
                <p className="font-semibold mb-2">Attachments</p>
                <ul className="list-disc ml-4 space-y-1">
                  {localAttachments.map(att => (
                    <li key={att.id}>{att.label || 'Untitled file'}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function renderPreview(blocks: EmailBlock[], brandColor: string, attachments?: TemplateAttachment[]) {
  const html = blocks.map(block => {
    const padding = block.padding || '12px'
    const align = block.align || 'left'
    const background = block.background || ''
    const textColor = block.textColor || ''

    if (block.type === 'image') {
      if (!block.content) {
        return `<div style="padding:${padding};text-align:${align};${background ? `background:${background};` : ''}"><div style="border:1px dashed #d1d5db;border-radius:12px;padding:24px;color:#6b7280;font-size:14px;">Upload an image to show it here.</div></div>`
      }
      return `<div style="padding:${padding};text-align:${align};${background ? `background:${background};` : ''}"><img src="${block.content}" alt="" style="max-width:100%;border-radius:12px" /></div>`
    }

    if (block.type === 'button') {
      const bg = block.background || brandColor
      const fg = block.textColor || '#ffffff'
      const url = block.buttonUrl || '#'
      return `<div style="padding:${padding};text-align:${align};${background ? `background:${background};` : ''}"><a href="${url}" style="display:inline-block;background:${bg};color:${fg};padding:12px 18px;border-radius:12px;font-weight:600;text-decoration:none">${block.content}</a></div>`
    }

    const fontFamily = block.fontFamily || 'Inter, system-ui, sans-serif'
    const fontSize = block.fontSize || '16px'
    return `<div style="padding:${padding};text-align:${align};${background ? `background:${background};` : ''};${textColor ? `color:${textColor};` : ''}"><p style="margin:0;line-height:1.5;font-family:${fontFamily};font-size:${fontSize};">${block.content}</p></div>`
  })

  if (attachments && attachments.length > 0) {
    html.push('<div style="padding:12px; border-top:1px solid #e5e7eb; color:#374151">Attachments:</div>')
    html.push(`<ul style="margin:0;padding:0 24px 12px 36px;color:#374151;">${attachments.map(att => `<li>${att.label || 'Untitled file'}</li>`).join('')}</ul>`)
  }

  return html.join('')
}
