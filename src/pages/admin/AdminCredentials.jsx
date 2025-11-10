import React, { useEffect, useRef, useState } from 'react'
import jsPDF from 'jspdf'
import { api } from '../../lib/api'

export function AdminCredentials() {
  const [cred, setCred] = useState({ list: [], msg: '', sending: false })
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)
  const [btnLabel, setBtnLabel] = useState('Choose File')

  async function loadUploadStatus() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload/status`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      const s = await res.json()
      // no UI indicator needed per request
    } catch {}
  }

  async function onUploadChange(e) {
    const f = e.target.files?.[0]
    setFile(f || null)
    setBtnLabel(f ? 'Uploaded' : 'Choose File')
  }

  async function uploadAndGenerate() {
    if (!file) { setCred(v => ({ ...v, msg: 'Choose a CSV file first' })); return }
    setCred(v => ({ ...v, msg: 'Uploading and generating...' }))
    try {
      const up = await api.uploadCsv('/upload/credentials', file)
      const emails = Array.isArray(up?.emails) ? up.emails : []
      const res = await api.credentialsGenerate({ targetEmails: emails, force: true, saveBatch: true, label: 'Bulk Credentials (Uploaded Set)' })
      setCred({ list: res.credentials || [], msg: `Generated ${res.count} credential${(res.count||0)===1?'':'s'}`, sending: false })
      setBtnLabel('Uploaded')
    } catch (e) {
      setCred(v => ({ ...v, msg: e.message }))
      setBtnLabel('Choose File')
    }
  }
  useEffect(() => { loadUploadStatus() }, [])

  function downloadCredsPdf() {
    try {
      const list = cred.list || []
      if (!list.length) { setCred(v => ({ ...v, msg: 'No credentials to export' })); return }
      const doc = new jsPDF({ orientation: 'landscape' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 14
      const tableTop = 36
      const rowH = 8
      const headers = ['Name','Email','Department','Designation','Login ID','Password']
      let widths = [60, 110, 40, 40, 50, 36]
      const totalW = widths.reduce((a,b)=>a+b,0)
      const maxTableW = pageW - margin*2
      if (totalW > maxTableW) {
        const scale = maxTableW / totalW
        widths = widths.map(w => Math.floor(w * scale))
      }

      doc.setFontSize(20)
      doc.setFont(undefined, 'bold')
      const title = 'Faculty Credentials'
      const titleW = doc.getTextWidth(title)
      doc.text(title, (pageW - titleW) / 2, 18)
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      const gen = new Date().toLocaleString()
      doc.text(`Generated: ${gen}`, pageW - margin, 26, { align: 'right' })

      let y = tableTop
      function drawHeader() {
        let x = margin
        doc.setDrawColor(180, 180, 180)
        doc.setFont(undefined, 'bold')
        doc.setTextColor(30)
        headers.forEach((h, i) => {
          doc.text(String(h), x + 2, y)
          x += widths[i]
        })
        doc.setFont(undefined, 'normal')
        doc.setTextColor(0)
        // header underline
        doc.line(margin, y + 2, margin + widths.reduce((a,b)=>a+b,0), y + 2)
        y += 8
      }

      function row(values) {
        let x = margin
        doc.setDrawColor(210,210,210)
        values.forEach((v, i) => {
          const t = String(v ?? '')
          const cellW = widths[i] - 4
          let out = t
          while (doc.getTextWidth(out) > cellW) {
            out = out.slice(0, out.length - 2)
          }
          if (out.length < t.length) out = out.slice(0, Math.max(0, out.length - 1)) + '…'
          doc.text(out, x + 2, y)
          x += widths[i]
        })
        // row divider
        doc.line(margin, y + 2, margin + widths.reduce((a,b)=>a+b,0), y + 2)
        y += rowH
      }

      function ensurePage() {
        if (y + rowH > pageH - margin) {
          // Add new page with same orientation
          doc.addPage()
          y = tableTop
          drawHeader()
        }
      }

      drawHeader()
      list.forEach(r => {
        ensurePage()
        row([r.name, r.email, r.department, r.designation, r.loginId, r.password])
      })

      const ts = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const fname = `faculty_credentials_${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}.pdf`
      doc.save(fname)
    } catch (err) {
      console.error('PDF export failed:', err)
      setCred(v => ({ ...v, msg: `PDF export failed: ${err.message}` }))
    }
  }

  async function notifyCreds() {
    const list = cred.list || []
    if (!list.length) { setCred(v => ({ ...v, msg: 'Generate credentials first' })); return }
    setCred(v => ({ ...v, sending: true, msg: 'Sending credentials via email...' }))
    try {
      const res = await api.credentialsNotify(list)
      setCred(v => ({ ...v, sending: false, msg: `Emails: sent ${res.sent}/${res.total}, failed ${res.failed}` }))
      if (Array.isArray(res.results)) console.log('Email results:', res.results)
    } catch (e) {
      setCred(v => ({ ...v, sending: false, msg: e.message }))
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-160px)] grid place-items-center px-4 animate-fade-in-up">
      <div className="w-full max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-semibold mb-8 text-center">Generate Credentials</h1>
        <div className="border rounded-2xl p-10 bg-white space-y-6 shadow-xl">
          <div className="space-y-3">
            <input ref={fileInputRef} className="hidden" type="file" accept=".csv" onChange={onUploadChange} />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={()=> fileInputRef.current?.click()}
                className={
                `px-5 py-3 rounded border text-lg transition-colors ` +
                (btnLabel === 'Uploaded'
                  ? 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                  : 'bg-white hover:bg-blue-50 hover:border-blue-600 hover:text-blue-700')
                }
              >
              <span className="truncate inline-block max-w-[320px] align-middle">{btnLabel}</span>
              </button>
            </div>
            <div>
            <button onClick={uploadAndGenerate} className="px-5 py-3 rounded bg-amber-500 hover:bg-amber-400 text-white text-lg transition-colors shadow">Generate</button>
            </div>
            {cred.list.length > 0 && (
              <>
              <button onClick={downloadCredsPdf} className="px-5 py-3 rounded border text-lg hover:bg-sky-50 transition-colors">Download PDF</button>
              <button onClick={notifyCreds} disabled={cred.sending} className="px-5 py-3 rounded bg-emerald-500 hover:bg-emerald-400 text-white text-lg disabled:opacity-50 transition-colors shadow">Send Notifications</button>
              </>
            )}
          </div>
        <div className="text-lg text-gray-700">{cred.msg}</div>
        </div>
      </div>
    </div>
  )
}
