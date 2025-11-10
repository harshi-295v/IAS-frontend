import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function AdminScheduleHistory() {
  const [list, setList] = useState([])
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  async function load() {
    setMsg('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/schedule/history?t=${Date.now()}`, { cache: 'no-store' }).then(r=>r.json())
      setList(res.history || [])
    } catch (e) {
      setMsg(String(e.message||'Failed to load'))
    }
  }

  useEffect(()=>{ load() }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-semibold">Schedule History</h1>
        <Link to="/admin" className="px-3 py-2 rounded border bg-white hover:bg-sky-50 transition-colors">Back</Link>
      </div>
      <div className="border rounded-lg p-6 bg-white space-y-4 shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Allocations</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(it => (
                <tr key={it.date} className="border-b odd:bg-white even:bg-gray-50 hover:bg-sky-50 transition-colors">
                  <td className="py-2 pr-4">{it.date}</td>
                  <td className="py-2 pr-4">{it.count}</td>
                  <td className="py-2 pr-4">
                    <button className="px-3 py-1.5 rounded border bg-white hover:bg-sky-50 transition-colors" onClick={()=> navigate(`/admin/schedule-history/${encodeURIComponent(it.date)}`)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-base text-gray-700">{msg}</div>
      </div>
    </div>
  )
}
