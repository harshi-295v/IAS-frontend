import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import { api } from '../../lib/api'
import DatePicker from 'react-datepicker'

export function AdminHistory() {
  const [state, setState] = useState({ list: [], loading: false, msg: '', viewing: null, creds: [] })
  const [filters, setFilters] = useState({ date: '', month: '', year: '' })
  const [openCal, setOpenCal] = useState(false)
  const [openFilters, setOpenFilters] = useState(false)
  const [filterMode, setFilterMode] = useState('date') // 'date' | 'month' | 'year'
  const navigate = useNavigate()

  async function loadBatches() {
    setState(v => ({ ...v, loading: true, msg: '' }))
    try {
      const res = await api.credentialBatches()
      const list = (res.batches || []).map(b => ({ ...b, id: b.id || b._id }))
      setState(v => ({ ...v, loading: false, list }))
    } catch (e) {
      setState(v => ({ ...v, loading: false, msg: e.message }))
    }
  }

  useEffect(() => { loadBatches() }, [])

  function viewBatch(id) {
    navigate(`/admin/history/${id}`)
  }

  async function downloadBatchPdf(batch) {
    try {
      const res = await api.credentialBatchById(batch.id)
      const list = res.credentials || []
      if (!list.length) return
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(14)
      doc.text(batch.label || 'Credentials', 14, 14)
      doc.setFontSize(10)
      const headers = ['Name','Email','Department','Designation','Login ID','Password']
      const widths = [50,80,35,35,40,26]
      let y = 22
      const drawHeader = () => { let x = 14; doc.setFont(undefined,'bold'); headers.forEach((h,i)=>{ doc.text(String(h),x,y); x+=widths[i] }); doc.setFont(undefined,'normal'); y+=6 }
      const ensure = () => { if (y>190){ doc.addPage('l'); y=14; drawHeader() } }
      drawHeader()
      list.forEach(r=>{ ensure(); let x=14; [r.name,r.email,r.department,r.designation,r.loginId,r.password].forEach((val,i)=>{ const t=String(val||''); doc.text(t.length>35?t.slice(0,34)+'…':t,x,y); x+=widths[i] }); y+=6 })
      doc.save((batch.label||'credentials')+'.pdf')
    } catch (e) {
      setState(v => ({ ...v, msg: e.message }))
    }
  }

  // Apply filters
  const filtered = (state.list || []).filter(b => {
    const d = dayjs(b.createdAt)
    const byDate = filters.date ? d.isSame(dayjs(filters.date), 'day') : true
    const byMonth = filters.month ? (d.month() + 1) === Number(filters.month) : true
    const byYear = filters.year ? d.year() === Number(filters.year) : true
    return byDate && byMonth && byYear
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 animate-fade-in-up">
      <h1 className="text-3xl md:text-4xl font-semibold">Credential History</h1>
      <div className="border rounded-lg p-6 bg-white space-y-3 relative shadow-soft">
        <div className="flex justify-end">
          <button className="px-3 py-2 rounded border inline-flex items-center gap-2 bg-white hover:bg-sky-50 transition-colors" onClick={()=> setOpenFilters(v=>!v)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3 5h18v2H3V5Zm3 6h12v2H6v-2Zm3 6h6v2H9v-2Z"/></svg>
            <span>Filters</span>
          </button>
        </div>
        {openFilters && (
          <div className="absolute right-4 top-14 z-50 bg-white border rounded shadow-soft p-4 w-[320px] animate-fade-in">
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Filter by</label>
                <div className="grid grid-cols-3 gap-2">
                  <button className={`px-2 py-1.5 rounded border ${filterMode==='date'?"bg-sky-500 text-white":"bg-white hover:bg-sky-50"}`} onClick={()=> setFilterMode('date')}>Date</button>
                  <button className={`px-2 py-1.5 rounded border ${filterMode==='month'?"bg-sky-500 text-white":"bg-white hover:bg-sky-50"}`} onClick={()=> setFilterMode('month')}>Month</button>
                  <button className={`px-2 py-1.5 rounded border ${filterMode==='year'?"bg-sky-500 text-white":"bg-white hover:bg-sky-50"}`} onClick={()=> setFilterMode('year')}>Year</button>
                </div>
              </div>
              {filterMode === 'date' && (
                <div className="relative">
                  <label className="block text-sm mb-1">Date</label>
                  <input
                    readOnly
                    value={filters.date ? dayjs(filters.date).format('DD-MM-YYYY') : ''}
                    placeholder="dd-mm-yyyy"
                    className="border rounded px-3 py-2 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-sky-300"
                    onClick={()=> setOpenCal(true)}
                  />
                  <button type="button" aria-label="Open calendar" className="absolute right-2 bottom-2 text-gray-700" onClick={()=> setOpenCal(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M7 2a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-1V3a1 1 0 1 0-2 0v1H8V3a1 1 0 0 0-1-1ZM4 9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z"/></svg>
                  </button>
                  {openCal && (
                    <div className="absolute z-50 top-[100%] left-0 mt-2 bg-white rounded border p-2 shadow-soft animate-fade-in">
                      <DatePicker
                        inline
                        selected={filters.date ? dayjs(filters.date).toDate() : null}
                        onChange={(d)=> setFilters(v=>({ ...v, date: d ? dayjs(d).format('YYYY-MM-DD') : '' }))}
                        onSelect={()=> setTimeout(()=> setOpenCal(false), 0)}
                        onClickOutside={()=> setOpenCal(false)}
                        calendarClassName="big-datepicker-sm"
                        popperClassName="big-datepicker-popper"
                      />
                    </div>
                  )}
                </div>
              )}
              {filterMode === 'month' && (
                <div>
                  <label className="block text-sm mb-1">Month</label>
                  <select className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-300" value={filters.month} onChange={e=>setFilters(v=>({...v, month:e.target.value}))}>
                    <option value="">All</option>
                    <option value="1">Jan</option>
                    <option value="2">Feb</option>
                    <option value="3">Mar</option>
                    <option value="4">Apr</option>
                    <option value="5">May</option>
                    <option value="6">Jun</option>
                    <option value="7">Jul</option>
                    <option value="8">Aug</option>
                    <option value="9">Sep</option>
                    <option value="10">Oct</option>
                    <option value="11">Nov</option>
                    <option value="12">Dec</option>
                  </select>
                </div>
              )}
              {filterMode === 'year' && (
                <div>
                  <label className="block text-sm mb-1">Year</label>
                  <input type="number" placeholder="YYYY" className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-300" value={filters.year} onChange={e=>setFilters(v=>({...v, year:e.target.value}))} />
                </div>
              )}
              <div className="flex justify-between gap-2 pt-1">
                <button className="px-3 py-2 rounded border bg-white hover:bg-sky-50 transition-colors" onClick={()=> setFilters({ date:'', month:'', year:'' })}>Clear</button>
                <button className="px-3 py-2 rounded bg-sky-500 hover:bg-sky-400 text-white transition-colors" onClick={()=> setOpenFilters(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="py-2 pr-4">Label</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Created</th>
              <th className="py-2 pr-4">Count</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id || b._id} className="border-b odd:bg-white even:bg-gray-50 hover:bg-sky-50 transition-colors">
                <td className="py-2 pr-4">{b.label}</td>
                <td className="py-2 pr-4">{b.type}</td>
                <td className="py-2 pr-4">{dayjs(b.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                <td className="py-2 pr-4">{b.count}</td>
                <td className="py-2 pr-4 space-x-2">
                  <button className="px-3 py-1.5 rounded border bg-white hover:bg-sky-50 transition-colors" onClick={()=> viewBatch(b.id || b._id)}>View</button>
                  <button className="px-3 py-1.5 rounded border bg-white hover:bg-sky-50 transition-colors" onClick={()=> downloadBatchPdf(b)}>Download PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        <div className="text-base text-gray-700">{state.msg}</div>
      </div>
      <div className="flex justify-center pt-4">
        <button className="px-4 py-2.5 rounded bg-red-500 hover:bg-red-400 text-white text-base transition-colors shadow-sm" onClick={async()=>{
          if (!confirm('This will clear all credential history. Continue?')) return
          try {
            await api.clearCredentialBatches()
            await loadBatches()
            setState(v=> ({ ...v, msg: 'History cleared' }))
          } catch (e) {
            setState(v => ({ ...v, msg: e.message }))
            setState(v=> ({ ...v, msg: e.message }))
          }
        }}>Clear History</button>
      </div>
    </div>
  )
}
