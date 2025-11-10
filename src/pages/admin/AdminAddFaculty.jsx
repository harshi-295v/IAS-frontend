import React, { useState } from 'react'
import { api } from '../../lib/api'

export function AdminAddFaculty() {
  const [form, setForm] = useState({ name: '', email: '', department: 'CSE', designation: 'FACULTY', msg: '' })

  return (
    <div className="w-full min-h[calc(100vh-160px)] grid place-items-center px-4">
      <div className="w-full max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-semibold mb-8 text-center">Add Faculty</h1>
        <section className="border rounded-2xl p-10 bg-white shadow-xl">
          <div className="space-y-4">
          <input className="w-full border rounded px-5 py-3.5 text-lg" placeholder="Name" value={form.name} onChange={e=>setForm(v=>({...v, name:e.target.value}))} />
          <input className="w-full border rounded px-5 py-3.5 text-lg" placeholder="Email" value={form.email} onChange={e=>setForm(v=>({...v, email:e.target.value}))} />
          <select className="w-full border rounded px-5 py-3.5 text-lg" value={form.department} onChange={e=>setForm(v=>({...v, department:e.target.value}))}>
            <option value="CSE">CSE</option>
            <option value="EEE">EEE</option>
            <option value="IT">IT</option>
            <option value="CSBS">CSBS</option>
          </select>
          <select className="w-full border rounded px-5 py-3.5 text-lg" value={form.designation} onChange={e=>setForm(v=>({...v, designation:e.target.value}))}>
            <option value="FACULTY">FACULTY</option>
            <option value="ASSISTANT PROFESSOR">ASSISTANT PROFESSOR</option>
            <option value="PROFESSOR">PROFESSOR</option>
            <option value="HOD">HOD</option>
            <option value="DEAN">DEAN</option>
          </select>
          <div className="flex gap-3">
            <button className="px-5 py-3 rounded bg-green-600 text-white text-lg" onClick={async()=>{
              setForm(v=>({ ...v, msg: 'Adding faculty...' }))
              try {
                const res = await api.adminAddFaculty({ name: form.name, email: form.email, department: form.department, designation: form.designation, sendEmail: true })
                setForm(v=>({ ...v, msg: `Added ${res.faculty?.name}. Login: ${res.credentials?.loginId}` }))
              } catch(e) { setForm(v=>({ ...v, msg: e.message })) }
            }}>Add & Send</button>
            <button className="px-5 py-3 rounded border text-lg" onClick={()=> setForm({ name:'', email:'', department:'CSE', designation:'FACULTY', msg:'' })}>Clear</button>
          </div>
        </div>
        <div className="text-lg text-gray-700 mt-3">{form.msg}</div>
        </section>
      </div>
    </div>
  )
}
