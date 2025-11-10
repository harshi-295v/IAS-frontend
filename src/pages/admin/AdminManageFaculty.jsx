import React, { useState } from 'react'
import { api } from '../../lib/api'

export function AdminManageFaculty() {
  const [manage, setManage] = useState({ name: '', email: '', department: 'CSE', designation: 'FACULTY', removeId: '', addMsg: '', removeMsg: '' })

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      <h1 className="text-3xl md:text-4xl font-semibold">Manage Faculty</h1>

      <section className="border rounded-lg p-6 bg-white">
        <h2 className="font-medium text-lg mb-3">Add Faculty</h2>
        <div className="space-y-3">
          <input className="w-full border rounded px-4 py-3 text-base" placeholder="Name" value={manage.name} onChange={e=>setManage(v=>({...v, name:e.target.value}))} />
          <input className="w-full border rounded px-4 py-3 text-base" placeholder="Email" value={manage.email} onChange={e=>setManage(v=>({...v, email:e.target.value}))} />
          <select className="w-full border rounded px-4 py-3 text-base" value={manage.department} onChange={e=>setManage(v=>({...v, department:e.target.value}))}>
            <option value="CSE">CSE</option>
            <option value="EEE">EEE</option>
            <option value="IT">IT</option>
            <option value="CSBS">CSBS</option>
          </select>
          <select className="w-full border rounded px-4 py-3 text-base" value={manage.designation} onChange={e=>setManage(v=>({...v, designation:e.target.value}))}>
            <option value="FACULTY">FACULTY</option>
            <option value="ASSISTANT PROFESSOR">ASSISTANT PROFESSOR</option>
            <option value="PROFESSOR">PROFESSOR</option>
            <option value="HOD">HOD</option>
            <option value="DEAN">DEAN</option>
          </select>
          <div className="flex gap-3">
            <button className="px-4 py-2.5 rounded bg-green-600 text-white text-base" onClick={async()=>{
              setManage(v=>({ ...v, addMsg: 'Adding faculty...' }))
              try {
                const res = await api.adminAddFaculty({ name: manage.name, email: manage.email, department: manage.department, designation: manage.designation, sendEmail: true })
                setManage(v=>({ ...v, addMsg: `Added ${res.faculty?.name}. Login: ${res.credentials?.loginId}` }))
              } catch(e) { setManage(v=>({ ...v, addMsg: e.message })) }
            }}>Add & Send</button>
            <button className="px-4 py-2.5 rounded border text-base" onClick={()=> setManage({ name:'', email:'', department:'CSE', designation:'FACULTY', removeId:'', addMsg:'', removeMsg: manage.removeMsg })}>Clear</button>
          </div>
        </div>
        <div className="text-base text-gray-700 mt-3">{manage.addMsg}</div>
      </section>

      <section className="border rounded-lg p-6 bg-white">
        <h2 className="font-medium text-lg mb-3">Remove Faculty</h2>
        <div className="space-y-3">
          <input className="w-full border rounded px-4 py-3 text-base" placeholder="ID / Email / Login ID" value={manage.removeId} onChange={e=>setManage(v=>({...v, removeId:e.target.value}))} />
          <div className="flex gap-3">
            <button className="px-4 py-2.5 rounded bg-red-600 text-white text-base" onClick={async()=>{
              setManage(v=>({ ...v, removeMsg: 'Removing faculty...' }))
              try {
                const payload = {}
                const s = (manage.removeId||'').trim()
                if (!s) throw new Error('Provide ID/Email/Login ID')
                if (/^\w{24}$/.test(s)) payload.id = s
                else if (/@/.test(s)) payload.email = s
                else payload.loginId = s
                await api.adminRemoveFaculty({ ...payload, hardDelete:false })
                setManage(v=>({ ...v, removeMsg: 'Removed faculty credentials' }))
              } catch(e) { setManage(v=>({ ...v, removeMsg: e.message })) }
            }}>Remove Access</button>
            <button className="px-4 py-2.5 rounded border text-base" onClick={()=> setManage(v=>({ ...v, removeId:'', removeMsg:'' }))}>Clear</button>
          </div>
          <div className="text-base text-gray-700 mt-1">{manage.removeMsg}</div>
        </div>
      </section>
    </div>
  )
}
