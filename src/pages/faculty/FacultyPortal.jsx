import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import jsPDF from 'jspdf'
import dayjs from 'dayjs'

export function FacultyPortal() {
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState('')
  const [allocId, setAllocId] = useState('')
  const [reason, setReason] = useState('')

  async function load() {
    try {
      const res = await api.myAllocations()
      setRows(res)
    } catch (e) { setMsg(e.message) }
  }

  useEffect(() => { load() }, [])

  async function submitRequest() {
    try {
      if (!allocId) return setMsg('Select an allocation')
      await api.submitRequest({ allocationId: allocId, type: 'change', reason })
      setMsg('Request submitted')
      setAllocId(''); setReason('')
    } catch (e) { setMsg(e.message) }
  }

  function downloadLetter(r) {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Invigilation Duty Letter', 105, 20, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Date: ${r.date}  Slot: ${r.slot}`, 20, 40)
    doc.text(`Room: ${r.classroomCode}`, 20, 48)
    doc.text(`Faculty: ${r.invigilatorId?.name || ''} (${r.invigilatorId?.email || ''})`, 20, 56)
    doc.text('Please report 15 minutes before the exam start time. This is an auto-generated letter.', 20, 72, { maxWidth: 170 })
    const fname = `duty_${r.date}_${r.slot}_${r.classroomCode}.pdf`
    doc.save(fname)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      <h1 className="text-3xl md:text-4xl font-semibold">Faculty Portal</h1>
      <p className="text-base md:text-lg text-gray-600">View your assigned invigilation duties, download duty letters, and request changes.</p>

      <section className="border rounded-lg p-6 bg-white">
        <h2 className="font-medium text-lg mb-3">My Allocations</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-base">
            <thead>
              <tr className="text-left border-b">
                <th className="py-3 pr-6">Date</th>
                <th className="py-3 pr-6">Slot</th>
                <th className="py-3 pr-6">Room</th>
                <th className="py-3 pr-6">Status</th>
                <th className="py-3 pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-b last:border-0">
                  <td className="py-3 pr-6">{r.date}</td>
                  <td className="py-3 pr-6">{r.slot}</td>
                  <td className="py-3 pr-6">{r.classroomCode}</td>
                  <td className="py-3 pr-6">{r.status}</td>
                  <td className="py-3 pr-6">
                    <button onClick={() => downloadLetter(r)} className="px-4 py-2 rounded border text-base">Download PDF</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="py-4 text-gray-500" colSpan="5">No allocations yet</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border rounded-lg p-6 bg-white">
        <h2 className="font-medium text-lg mb-3">Change/Replacement Request</h2>
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <label className="text-base">Allocation
            <select className="mt-1 w-full border rounded px-4 py-3 text-lg" value={allocId} onChange={e=>setAllocId(e.target.value)}>
              <option value="">Select...</option>
              {rows.map(r => (
                <option key={r._id} value={r._id}>{r.date} {r.slot} - {r.classroomCode}</option>
              ))}
            </select>
          </label>
          <label className="text-base sm:col-span-2">Reason
            <input className="mt-1 w-full border rounded px-4 py-3 text-lg" value={reason} onChange={e=>setReason(e.target.value)} placeholder="State your reason" />
          </label>
          <div>
            <button onClick={submitRequest} className="px-4 py-2.5 rounded bg-blue-600 text-white text-base">Submit Request</button>
          </div>
        </div>
        {msg && <div className="text-base text-gray-700 mt-3">{msg}</div>}
      </section>
    </div>
  )
}
