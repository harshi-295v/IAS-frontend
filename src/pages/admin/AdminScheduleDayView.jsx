import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import { api } from '../../lib/api'

export function AdminScheduleDayView() {
  const { date } = useParams()
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState('')

  async function load() {
    setMsg('')
    try {
      const res = await api.scheduleForDay(date)
      setRows(res.data || [])
    } catch (e) {
      setMsg(String(e.message||'Failed to load'))
    }
  }

  useEffect(()=>{ load() }, [date])

  async function downloadPdf() {
    try {
      const res = await api.scheduleForDay(date)
      const data = res.data || []
      if (!data.length) return
      const doc = new jsPDF({ orientation: 'landscape' })
      const pageW = doc.internal.pageSize.getWidth()
      doc.setFillColor(31, 41, 55)
      doc.rect(10, 10, pageW - 20, 14, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text(`Invigilator Schedule — ${date}`, 14, 19)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
      const headers = ['Date','Slot','Room','Invigilator','Email','Department','Designation','Status']
      const widths  = [24, 16, 26, 50, 60, 35, 35, 20]
      const startX = 14
      let y = 30
      function drawHeader(){ let x=startX; doc.setFillColor(243,244,246); const w=widths.reduce((a,b)=>a+b,0); doc.rect(startX-2,y-5,w+4,8,'F'); doc.setFont(undefined,'bold'); headers.forEach((h,i)=>{ doc.text(String(h),x,y); x+=widths[i] }); doc.setFont(undefined,'normal'); doc.setDrawColor(229,231,235); doc.line(startX-2,y+2,startX-2+w+4,y+2); y+=6 }
      function ensure(){ if (y>190){ doc.addPage('l'); y=20; drawHeader() } }
      drawHeader()
      data.forEach((r,idx)=>{ ensure(); if (idx%2===0){ const w=widths.reduce((a,b)=>a+b,0); doc.setFillColor(250,250,250); doc.rect(startX-2,y-4.5,w+4,6.5,'F') } let x=startX; [r.date,r.slot,r.classroomCode,r.invigilatorId?.name||'TBD',r.invigilatorId?.email||'',r.invigilatorId?.department||'',r.invigilatorId?.designation||'',r.status||''].forEach((val,i)=>{ const t=String(val||''); const clipped=t.length>40?t.slice(0,39)+'…':t; doc.text(clipped,x,y); x+=widths[i] }); y+=6 })
      const lastPage = doc.internal.getNumberOfPages(); doc.setFontSize(9); doc.setTextColor(107,114,128); doc.text(`Page ${lastPage}`, pageW - 28, 200)
      doc.save(`schedule_${date}.pdf`)
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-semibold">Schedule — {date}</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded border bg-white hover:bg-sky-50 transition-colors" onClick={downloadPdf}>Download PDF</button>
          <Link to="/admin/schedule-history" className="px-3 py-2 rounded border bg-white hover:bg-sky-50 transition-colors">Back</Link>
        </div>
      </div>
      <div className="border rounded-lg p-6 bg-white space-y-4 shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Slot</th>
                <th className="py-2 pr-4">Room</th>
                <th className="py-2 pr-4">Invigilator</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Designation</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=> (
                <tr key={r._id||i} className="border-b odd:bg-white even:bg-gray-50">
                  <td className="py-2 pr-4">{r.date}</td>
                  <td className="py-2 pr-4">{r.slot}</td>
                  <td className="py-2 pr-4">{r.classroomCode}</td>
                  <td className="py-2 pr-4">{r.invigilatorId?.name || 'TBD'}</td>
                  <td className="py-2 pr-4">{r.invigilatorId?.email || ''}</td>
                  <td className="py-2 pr-4">{r.invigilatorId?.department || ''}</td>
                  <td className="py-2 pr-4">{r.invigilatorId?.designation || ''}</td>
                  <td className="py-2 pr-4">{r.status || ''}</td>
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
