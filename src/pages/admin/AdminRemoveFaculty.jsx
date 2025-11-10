import React, { useState } from 'react'
import { api } from '../../lib/api'

export function AdminRemoveFaculty() {
  const [form, setForm] = useState({ query: '', msg: '' })

  async function onRemove() {
    setForm(v => ({ ...v, msg: 'Removing faculty...' }))
    try {
      const payload = {}
      const s = (form.query || '').trim()
      if (!s) throw new Error('Provide ID/Email/Login ID')
      if (/^\w{24}$/.test(s)) payload.id = s
      else if (/@/.test(s)) payload.email = s
      else payload.loginId = s
      await api.adminRemoveFaculty({ ...payload, hardDelete: false })
      setForm(v => ({ ...v, msg: 'Removed faculty credentials' }))
    } catch (e) {
      setForm(v => ({ ...v, msg: e.message }))
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-160px)] grid place-items-center px-4">
      <div className="w-full max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-semibold mb-8 text-center">Remove Faculty</h1>
        <section className="border rounded-2xl p-10 bg-white shadow-xl">
          <div className="space-y-4">
            <input className="w-full border rounded px-5 py-3.5 text-lg" placeholder="ID / Email / Login ID" value={form.query} onChange={e=>setForm(v=>({...v, query:e.target.value}))} />
            <div className="flex gap-3">
              <button className="px-5 py-3 rounded bg-red-600 text-white text-lg" onClick={onRemove}>Remove Access</button>
              <button className="px-5 py-3 rounded border text-lg" onClick={()=> setForm({ query:'', msg:'' })}>Clear</button>
            </div>
            <div className="text-lg text-gray-700 mt-1">{form.msg}</div>
          </div>
        </section>
      </div>
    </div>
  )
}
