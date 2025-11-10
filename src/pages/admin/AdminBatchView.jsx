import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import { api } from '../../lib/api'

export function AdminBatchView() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: false, msg: '', batch: null, creds: [] })

  async function load() {
    setState(v => ({ ...v, loading: true, msg: '' }))
    try {
      const res = await api.credentialBatchById(id)
      const batch = res.batch || { id, label: res.label, type: res.type, createdAt: res.createdAt, count: (res.credentials||[]).length }
      setState({ loading: false, msg: '', batch, creds: res.credentials || [] })
    } catch (e) {
      setState(v => ({ ...v, loading: false, msg: e.message }))
    }
  }

  useEffect(() => { load() }, [id])

  async function downloadPdf() {
    try {
      const res = await api.credentialBatchById(id)
      const list = res.credentials || []
      if (!list.length) return
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(14)
      doc.text((state.batch?.label || 'Credentials'), 14, 14)
      doc.setFontSize(10)
      const headers = ['Name','Email','Department','Designation','Login ID','Password']
      const widths = [50,80,35,35,40,26]
      let y = 22
      const drawHeader = () => { let x = 14; doc.setFont(undefined,'bold'); headers.forEach((h,i)=>{ doc.text(String(h),x,y); x+=widths[i] }); doc.setFont(undefined,'normal'); y+=6 }
      const ensure = () => { if (y>190){ doc.addPage('l'); y=14; drawHeader() } }
      drawHeader()
      list.forEach(r=>{ ensure(); let x=14; [r.name,r.email,r.department,r.designation,r.loginId,r.password].forEach((val,i)=>{ const t=String(val||''); doc.text(t.length>35?t.slice(0,34)+'…':t,x,y); x+=widths[i] }); y+=6 })
      doc.save(((state.batch?.label)||'credentials')+'.pdf')
    } catch (e) {
      setState(v => ({ ...v, msg: e.message }))
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-semibold">Batch Preview</h1>
        <Link to="/admin/history" className="px-3 py-2 rounded border bg-white hover:bg-sky-50 transition-colors">Back</Link>
      </div>
      <div className="border rounded-lg p-6 bg-white space-y-4 shadow-soft">
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          <div><span className="font-medium">Label:</span> {state.batch?.label || '-'}</div>
          <div><span className="font-medium">Type:</span> {state.batch?.type || '-'}</div>
          <div><span className="font-medium">Created:</span> {state.batch?.createdAt ? dayjs(state.batch.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</div>
          <div><span className="font-medium">Count:</span> {state.batch?.count ?? (state.creds?.length || 0)}</div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded border bg-white hover:bg-sky-50 transition-colors" onClick={downloadPdf}>Download PDF</button>
        </div>
        <div className="max-h-[500px] overflow-auto border rounded">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Login ID</th>
                <th className="py-2 pr-3">Password</th>
              </tr>
            </thead>
            <tbody>
              {(state.creds||[]).map((c,i)=> (
                <tr key={i} className="border-b odd:bg-white even:bg-gray-50">
                  <td className="py-1.5 pr-3">{c.name}</td>
                  <td className="py-1.5 pr-3">{c.email}</td>
                  <td className="py-1.5 pr-3">{c.loginId}</td>
                  <td className="py-1.5 pr-3">{c.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-base text-gray-700">{state.msg}</div>
      </div>
    </div>
  )
}
