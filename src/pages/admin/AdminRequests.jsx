import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

export function AdminRequests() {
  const [list, setList] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [statusTab, setStatusTab] = useState('pending')

  async function load(status='pending') {
    setLoading(true); setMsg('')
    try {
      const res = await api.adminRequests(status)
      setList(res.requests || [])
      setStatusTab(status)
    } catch (e) {
      setMsg(e.message)
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load('pending') }, [])

  function goReassign(reqRow) {
    const allocId = reqRow?.allocationId?._id || reqRow?.allocationId
    if (!allocId) { setMsg('Missing allocation'); return }
    navigate(`/admin/scheduling?alloc=${encodeURIComponent(allocId)}&request=${encodeURIComponent(reqRow._id)}`)
  }

  async function approve(reqRow) {
    try {
      await api.approveRequest(reqRow._id, {})
      // Flip this row to approved locally so the Reassign button appears immediately
      setList(prev => prev.map(r => r._id === reqRow._id ? { ...r, status: 'approved' } : r))
      setMsg('Approved. You can now click Reassign.')
    } catch (e) { setMsg(e.message) }
  }

  // Clean list: remove malformed and dedupe by faculty+allocation+status
  const seen = new Set()
  const clean = (list||[]).filter(r => r && r.facultyId && r.allocationId).filter(r => {
    const key = `${r.facultyId?._id}|${r.allocationId?._id}|${r.status}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 animate-fade-in-up">
      <h1 className="text-3xl md:text-4xl font-semibold">Requests</h1>
      <div className="border rounded-lg p-6 bg-white space-y-3 shadow-soft">
        <div className="flex gap-2">
          <button className={`px-3 py-1.5 rounded border ${statusTab==='pending'?'bg-sky-50 border-sky-400':''}`} onClick={()=>load('pending')}>Pending</button>
          <button className={`px-3 py-1.5 rounded border ${statusTab==='approved'?'bg-sky-50 border-sky-400':''}`} onClick={()=>load('approved')}>Approved</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-2 pr-4">Faculty</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Slot</th>
                <th className="py-2 pr-4">Room</th>
                <th className="py-2 pr-4">Reason</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clean.map(r=> (
                <tr key={r._id} className="border-b odd:bg-white even:bg-gray-50">
                  <td className="py-2 pr-4">{r.facultyId?.name || ''} ({r.facultyId?.email || ''})</td>
                  <td className="py-2 pr-4">{r.allocationId?.date || ''}</td>
                  <td className="py-2 pr-4">{r.allocationId?.slot || ''}</td>
                  <td className="py-2 pr-4">{r.allocationId?.classroomCode || ''}</td>
                  <td className="py-2 pr-4">{r.reason || '-'}</td>
                  <td className="py-2 pr-4">
                    {r.status === 'pending' && (
                      <button className="px-3 py-1.5 rounded border bg-white hover:bg-sky-50" onClick={()=>approve(r)}>Approve</button>
                    )}
                    {r.status === 'approved' && (
                      <button className="ml-2 px-3 py-1.5 rounded border bg-white hover:bg-sky-50" onClick={()=>goReassign(r)}>Reassign</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-base text-gray-700">{loading ? 'Loading...' : msg}</div>
      </div>
    </div>
  )
}
