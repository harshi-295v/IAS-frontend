import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import dayjs from 'dayjs'
import { AdminUpload } from '../../components/AdminUpload'
import { api } from '../../lib/api'
import DatePicker from 'react-datepicker'

export function AdminDashboard() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [constraints, setConstraints] = useState({ maxHoursPerDay: 0, noSameDayRepeat: true })
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [msgSchedule, setMsgSchedule] = useState('')
  const [msgConstraints, setMsgConstraints] = useState('')
  const [reassign, setReassign] = useState({}) // legacy (not used)
  const [quick, setQuick] = useState({ slot: 'FN', room: '', q: '', results: [], chosenId: '' })
  const [ready, setReady] = useState(false)
  const [calOpen, setCalOpen] = useState(false)
  const [examDates, setExamDates] = useState([]) // array of 'YYYY-MM-DD'
  const [status, setStatus] = useState({ faculty: 0, classrooms: 0, exams: 0, examsForDate: 0 })
  const [uploadsKey, setUploadsKey] = useState(0)
  const dateInputRef = useRef(null)
  const justClosedRef = useRef(false)
  const hasExam = examDates.includes(date)
  const hasGenerated = rows.length > 0
  const [canReassign, setCanReassign] = useState(false)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [cred, setCred] = useState({ list: [], msg: '', sending: false })
  const [manage, setManage] = useState({ name: '', email: '', department: 'FACULTY', designation: 'FACULTY', removeId: '', msg: '' })
  const [batches, setBatches] = useState({ list: [], loading: false, msg: '', viewing: null, creds: [] })
  const [approveCtx, setApproveCtx] = useState({ requestId: '', allocId: '' })
  const [reassignOnly, setReassignOnly] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  async function loadConstraints() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/settings/constraints`).then(r=>r.json())
      setConstraints(res)
    } catch {} finally {
      setReady(true)
    }
  }

  async function loadUploadStatus(forDate) {
    try {
      const d = forDate || date
      const url = `${import.meta.env.VITE_API_URL}/upload/status?date=${encodeURIComponent(d)}&t=${Date.now()}`
      const res = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }).then(r=>r.json())
      const up = res.uploaded || {}
      setStatus({
        faculty: up.faculty ? (res.faculty||0) : 0,
        classrooms: up.classrooms ? (res.classrooms||0) : 0,
        exams: up.exams ? (res.exams||0) : 0,
        examsForDate: up.exams ? (res.examsForDate||0) : 0,
      })
    } catch {
      setStatus({ faculty: 0, classrooms: 0, exams: 0, examsForDate: 0 })
    }
  }

  // Common validation used for disabled-generate click and actual generate
  async function validateBeforeGenerate() {
    if (!date || String(date).trim() === '') return 'Date is required'
    const maxHrs = Number(constraints.maxHoursPerDay)
    if (!Number.isFinite(maxHrs) || maxHrs <= 0) return 'Max hours must be greater than 0'
    try {
      let resp = await fetch(`${import.meta.env.VITE_API_URL}/upload/status?date=${encodeURIComponent(date)}&t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      if (!resp.ok) return 'Files not uploaded'
      const status = await resp.json()
      const facOk = Number(status.faculty) > 0
      const clsOk = Number(status.classrooms) > 0
      const exOk  = Number(status.exams) > 0
      if (!facOk || !clsOk || !exOk) {
        const missing = []
        if (!facOk) missing.push('Faculty')
        if (!clsOk) missing.push('Classrooms')
        if (!exOk)  missing.push('Exams')
        return missing.length === 3 ? 'Files not uploaded' : `${missing.join(', ')} not uploaded`
      }
      if (Number(status.examsForDate) <= 0) return 'Exam not available'
      return ''
    } catch {
      return 'Files not uploaded'
    }
  }
  

  async function loadExamDates() {
    try {
      // First check if exams exist at all
      const statusUrl = `${import.meta.env.VITE_API_URL}/upload/status?t=${Date.now()}`
      const status = await fetch(statusUrl, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }).then(r=>r.json())
      if (!status?.exams) {
        setExamDates([])
        try { console.log('Exam dates (highlight): [] (no exams in DB)') } catch {}
        return
      }
      const url = `${import.meta.env.VITE_API_URL}/schedule/exam-dates?t=${Date.now()}`
      const res = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }).then(r=>r.json())
      const list = Array.isArray(res.dates) ? res.dates : []
      const clean = Array.from(new Set(list.map(d => String(d))))
        .filter(Boolean)
        .sort()
      setExamDates(clean)
      try { console.log('Exam dates (highlight):', clean) } catch {}
    } catch {}
  }

  // When slot/room changes, auto-fill current faculty into the chooser
  useEffect(() => {
    const room = (quick.room || '').trim().toUpperCase()
    const slot = quick.slot
    if (!room) return
    const target = rows.find(r => r.slot === slot && String(r.classroomCode).toUpperCase() === room)
    if (!target) {
      setQuick(v => ({ ...v, chosenId: '', results: v.results }))
      return
    }
    const f = target.invigilatorId
    if (f && f._id) {
      // Ensure option list includes current assignee so it can appear selected immediately
      setQuick(v => {
        const exists = (v.results || []).some(x => x._id === f._id)
        const results = exists ? v.results : [{ _id: f._id, name: f.name, email: f.email, department: f.department, designation: f.designation }, ...(v.results || [])]
        return { ...v, chosenId: f._id, q: f.email || f.name || v.q, results }
      })
    } else {
      setQuick(v => ({ ...v, chosenId: '' }))
    }
  }, [quick.room, quick.slot, rows])

  async function downloadPdf() {
    // Always fetch the latest rows for the selected date to avoid stale downloads
    let data = rows
    try {
      const res = await api.scheduleForDay(date)
      data = res.data || rows
    } catch {}
    const doc = new jsPDF({ orientation: 'landscape' })
    const pageW = doc.internal.pageSize.getWidth()
    // Header bar
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
    const widths  = [24, 16, 26, 50, 60, 35, 35, 20] // ~266
    const startX = 14
    let y = 30

    function drawTableHeader() {
      let x = startX
      // Header background
      doc.setFillColor(243, 244, 246)
      doc.rect(startX - 2, y - 5, widths.reduce((a,b)=>a+b,0) + 4, 8, 'F')
      doc.setFont(undefined, 'bold')
      headers.forEach((h, i) => { doc.text(String(h), x, y); x += widths[i] })
      doc.setFont(undefined, 'normal')
      // underline
      doc.setDrawColor(229, 231, 235)
      doc.line(startX - 2, y + 2, startX - 2 + widths.reduce((a,b)=>a+b,0) + 4, y + 2)
      y += 6
    }

    function ensurePage() {
      if (y > 190) {
        const pageNum = doc.internal.getNumberOfPages()
        doc.setFontSize(9)
        doc.setTextColor(107,114,128)
        doc.text(`Page ${pageNum}`, pageW - 28, 200)
        doc.setTextColor(0,0,0)
        doc.addPage('l')
        y = 20
        // redraw title bar for new page
        drawTableHeader()
      }
    }

    drawTableHeader()
    data.forEach((r, idx) => {
      ensurePage()
      // zebra row
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(startX - 2, y - 4.5, widths.reduce((a,b)=>a+b,0) + 4, 6.5, 'F')
      }
      let x = startX
      const cells = [
        r.date,
        r.slot,
        r.classroomCode,
        r.invigilatorId?.name || 'TBD',
        r.invigilatorId?.email || '',
        r.invigilatorId?.department || '',
        r.invigilatorId?.designation || '',
        r.status || '',
      ]
      cells.forEach((val, i) => {
        const text = String(val || '')
        const clipped = text.length > 40 ? text.slice(0, 39) + '…' : text
        doc.text(clipped, x, y)
        x += widths[i]
      })
      y += 6
    })

    const lastPage = doc.internal.getNumberOfPages()
    doc.setFontSize(9)
    doc.setTextColor(107,114,128)
    doc.text(`Page ${lastPage}`, pageW - 28, 200)

    doc.save(`schedule_${date}.pdf`)
    setCanReassign(true)
  }

  // Quick reassign helpers
  function roomsForSlot(slot) {
    return Array.from(new Set(rows.filter(r => r.slot === slot).map(r => r.classroomCode))).sort()
  }

  async function onQuickSearch() {
    if (!quick.q) return
    try {
      const list = await api.facultySearch(quick.q)
      setQuick(v => ({ ...v, results: list }))
    } catch {}
  }

  async function onQuickReassign() {
    setMsg('')
    const room = (quick.room || '').trim().toUpperCase()
    const slot = quick.slot
    const target = rows.find(r => r.slot === slot && String(r.classroomCode).toUpperCase() === room)
    if (!target) {
      setMsgSchedule('No allocation found for selected date/slot/room')
      return
    }
    if (!quick.chosenId) {
      setMsgSchedule('Choose a faculty to reassign')
      return
    }
    setMsgSchedule('Reassigning...')
    try {
      await api.reassign(target._id, quick.chosenId)
      await loadDay()
      setMsgSchedule(`Reassigned ${room} (${slot}) successfully`)
      setQuick(v => ({ ...v, chosenId: '' }))
      // Auto-approve linked request if present
      if (approveCtx.requestId) {
        try { await api.approveRequest(approveCtx.requestId, { toFacultyId: quick.chosenId }) } catch {}
        setApproveCtx({ requestId: '', allocId: '' })
        // Return to requests list
        navigate('/admin/requests')
      }
    } catch (e) {
      setMsgSchedule(e.message)
    }
  }

  async function saveConstraints() {
    setMsgConstraints('Saving constraints...')
    await fetch(`${import.meta.env.VITE_API_URL}/settings/constraints`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(constraints) })
    setMsgConstraints('Constraints saved')
  }

  // Auto-save constraints with debounce when they change (after initial load)
  useEffect(() => {
    if (!ready) return
    const id = setTimeout(() => { saveConstraints() }, 600)
    return () => clearTimeout(id)
  }, [constraints, ready])

  async function generate() {
    setLoading(true); setMsgSchedule('Preparing...')
    setCanReassign(false); setReassignOpen(false)
    try {
      // Validate date
      if (!date || String(date).trim() === '') {
        setMsgSchedule('Date is required')
        return
      }
      // Validate constraints: maxHoursPerDay must be > 0
      const maxHrs = Number(constraints.maxHoursPerDay)
      if (!Number.isFinite(maxHrs) || maxHrs <= 0) {
        setMsgSchedule('Max hours must be greater than 0')
        return
      }
      // Ensure required data uploaded
      const statusUrl = `${import.meta.env.VITE_API_URL}/upload/status?date=${encodeURIComponent(date)}&t=${Date.now()}`
      const resp = await fetch(statusUrl, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      if (!resp.ok) { setMsgSchedule('Files not uploaded'); return }
      const status = await resp.json()
      const facOk = Number(status.faculty) > 0
      const clsOk = Number(status.classrooms) > 0
      const exOk  = Number(status.exams) > 0
      if (!facOk || !clsOk || !exOk) {
        const missing = []
        if (!facOk) missing.push('Faculty')
        if (!clsOk) missing.push('Classrooms')
        if (!exOk)  missing.push('Exams')
        setMsgSchedule(missing.length === 3 ? 'Files not uploaded' : `${missing.join(', ')} not uploaded`)
        return
      }
      if (Number(status.examsForDate) <= 0) { setMsgSchedule('Exam not available'); return }
      // Auto-clear allocations for this date before generating to avoid accumulation
      try { await api.clearScheduleForDay(date) } catch {}
      setMsgSchedule('Generating...')
      const res = await api.generateSchedule(date)
      setRows(res.data || [])
      setMsgSchedule(`Generated ${res.count} allocations for ${date}`)
    } catch (e) {
      const msg = String(e?.message || '')
      if (/file not uploaded|upload|import/i.test(msg)) {
        setMsgSchedule('Files not uploaded')
      } else if (/max hours/i.test(msg)) {
        setMsgSchedule('Max hours must be greater than 0')
      } else if (/exam not available/i.test(msg)) {
        setMsgSchedule('Exam not available')
      } else if (/generate failed/i.test(msg)) {
        // Backend may return a generic error; show a more helpful message
        setMsgSchedule('Files not uploaded')
      } else {
        setMsgSchedule(msg)
      }
    }
    finally { setLoading(false) }
  }

  async function loadDay() {
    setLoading(true)
    try {
      const res = await api.scheduleForDay(date)
      setRows(res.data || [])
    } finally { setLoading(false) }
  }

  async function notify() {
    setMsgSchedule('Sending emails...')
    try {
      const res = await api.notifyDay(date)
      setMsgSchedule(`Emails sent: ${res.sent}. ${res.previews?.length ? 'Ethereal previews logged in console' : ''}`)
      if (res.previews?.length) console.log('Email previews:', res.previews)
    } catch (e) { setMsgSchedule(e.message) }
  }

  async function generateCreds() {
    setCred(v => ({ ...v, msg: 'Generating credentials...' }))
    try {
      const res = await api.credentialsGenerate({ force: false })
      setCred({ list: res.credentials || [], msg: `Generated ${res.count} credential${(res.count||0)===1?'':'s'}` , sending: false })
    } catch (e) {
      setCred(v => ({ ...v, msg: e.message }))
    }
  }

  function downloadCredsPdf() {
    const list = cred.list || []
    if (!list.length) return
    const doc = new jsPDF({ orientation: 'landscape' })
    const pageW = doc.internal.pageSize.getWidth()
    // header bar
    doc.setFillColor(31,41,55)
    doc.rect(10, 10, pageW - 20, 14, 'F')
    doc.setTextColor(255,255,255)
    doc.setFont(undefined, 'bold')
    doc.setFontSize(14)
    doc.text('Faculty Credentials', 14, 19)
    doc.setTextColor(0,0,0)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)

    const headers = ['Name','Email','Department','Designation','Login ID','Password']
    const widths  = [60, 90, 35, 35, 42, 28]
    const startX = 14
    let y = 30
    const tableW = widths.reduce((a,b)=>a+b,0)

    const drawHeader = () => {
      let x = startX
      doc.setFillColor(243,244,246)
      doc.rect(startX - 2, y - 5, tableW + 4, 8, 'F')
      doc.setFont(undefined, 'bold')
      headers.forEach((h,i)=>{ doc.text(String(h), x, y); x += widths[i] })
      doc.setFont(undefined, 'normal')
      doc.setDrawColor(229,231,235)
      doc.line(startX - 2, y + 2, startX - 2 + tableW + 4, y + 2)
      y += 6
    }
    const ensurePage = () => {
      if (y > 190) { doc.addPage('l'); y = 20; drawHeader() }
    }

    drawHeader()
    list.forEach((r, idx) => {
      ensurePage()
      if (idx % 2 === 0) { doc.setFillColor(250,250,250); doc.rect(startX - 2, y - 4.5, tableW + 4, 6.5, 'F') }
      let x = startX
      ;[r.name, r.email, r.department, r.designation, r.loginId, r.password].forEach((val,i)=>{
        const t = String(val||'')
        const clipped = t.length>50 ? t.slice(0,49)+'…' : t
        doc.text(clipped, x, y)
        x += widths[i]
      })
      y += 6
    })
    doc.save('faculty_credentials.pdf')
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

  useEffect(() => {
    (async()=>{
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/schedule/reset-all`, { method: 'DELETE' })
      } catch {}
      await loadConstraints()
      await loadDay()
      await loadExamDates()
      await loadUploadStatus()
      // If redirected from /admin/requests with alloc and request, pre-fill reassign
      try {
        const params = new URLSearchParams(location.search)
        const alloc = params.get('alloc')
        const reqId = params.get('request')
        if (alloc) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/schedule/allocation/${encodeURIComponent(alloc)}`).then(r=>r.json())
          if (res && res._id) {
            if (res.date && res.date !== date) {
              setDate(res.date)
              await loadDay()
            }
            setQuick(v => ({ ...v, slot: res.slot || 'FN', room: res.classroomCode || '' }))
            setReassignOpen(true)
            setApproveCtx({ requestId: reqId || '', allocId: alloc })
            setMsgSchedule('Pick replacement faculty and click Reassign to approve the request.')
            setReassignOnly(true)
          }
        }
      } catch {}
    })()
  }, [])

  // When opening the calendar, refresh exam dates to ensure highlights are up to date
  useEffect(() => {
    if (calOpen) loadExamDates()
  }, [calOpen])

  // Refresh status when date changes
  useEffect(() => { loadUploadStatus() }, [date])

  async function loadBatches() {
    setBatches(v => ({ ...v, loading: true, msg: '' }))
    try {
      const res = await api.credentialBatches()
      setBatches(v => ({ ...v, loading: false, list: res.batches || [] }))
    } catch (e) {
      setBatches(v => ({ ...v, loading: false, msg: e.message }))
    }
  }
  useEffect(() => { loadBatches() }, [])

  // Do not show auto messages; only show messages on Generate click
  useEffect(() => { /* no-op: messages only on user action */ }, [date])

  async function onSearch(allocationId) {
    const q = reassign[allocationId]?.q || ''
    if (!q) return
    try {
      const list = await api.facultySearch(q)
      setReassign(v => ({ ...v, [allocationId]: { ...(v[allocationId]||{}), results: list } }))
    } catch {}
  }

  async function onReassign(allocationId) {
    const chosenId = reassign[allocationId]?.chosenId
    if (!chosenId) return
    setMsg('Reassigning...')
    try {
      await api.reassign(allocationId, chosenId)
      await loadDay()
      setMsg('Reassigned successfully')
      setReassign(v => ({ ...v, [allocationId]: {} }))
    } catch (e) { setMsg(e.message) }
  }

  const outerClass = !reassignOnly ? "w-full min-h-[calc(100vh-160px)] grid place-items-center px-4 animate-fade-in-up" : "space-y-8 max-w-5xl mx-auto px-4 animate-fade-in-up"
  return (
    <div className={outerClass}>
      {!reassignOnly ? (
        <h1 className="text-5xl md:text-6xl font-semibold mb-2 text-center">Admin Dashboard</h1>
      ) : (
        <h1 className="text-3xl md:text-4xl font-semibold">Admin Dashboard</h1>
      )}

      {!reassignOnly && (
        <div className="w-full max-w-7xl">
          <section className="border rounded-2xl p-14 bg-white shadow-xl">
            <h2 className="text-3xl font-semibold mb-5">Data Uploads</h2>
            <AdminUpload key={`uploads-${uploadsKey}`} onImported={(type)=>{ loadUploadStatus(); if (type === 'exams') { loadExamDates() } }} />
          </section>
        </div>
      )}


      {/* Scheduling page: credentials generation moved to Admin > Credentials */}

      {/* Scheduling page: Manage Faculty moved to Admin > Manage */}

      {/* Scheduling page: Credential History moved to Admin > History */}

      {!reassignOnly && (
      <div className="w-full max-w-7xl grid md:grid-cols-2 gap-2 mt-3">
        <section className="border rounded-2xl p-12 bg-white shadow-xl">
          <h2 className="text-2xl font-semibold mb-3">Constraints</h2>
          <div className="space-y-4">
            <label className="block text-base">Max Hours per Day
              <input className="mt-1 w-full border rounded px-4 py-3 text-lg" type="number" min="0" value={constraints.maxHoursPerDay||0} onChange={e=>setConstraints(v=>({...v, maxHoursPerDay:Number(e.target.value)}))} />
            </label>
            <label className="inline-flex items-center gap-2 text-base">
              <input type="checkbox" checked={!!constraints.noSameDayRepeat} onChange={e=>setConstraints(v=>({...v, noSameDayRepeat:e.target.checked}))} /> No same-day repeat
            </label>
            {/* Auto-saved; button removed */}
          </div>
        </section>
        <section className="border rounded-2xl p-12 bg-white shadow-xl">
          <h2 className="text-2xl font-semibold mb-3">Scheduling</h2>
          <div className="flex flex-wrap items-end gap-4 relative">
            <label className="text-base w-full max-w-xs relative">
              Date
              <input
                className="custom-date mt-1 block w-full border rounded px-4 pr-12 py-3 text-lg"
                type="date"
                value={date}
                readOnly
                onClick={()=> { if (justClosedRef.current) { justClosedRef.current = false; return } setCalOpen(true) }}
                onFocus={()=> { if (justClosedRef.current) { justClosedRef.current = false; return } setCalOpen(true) }}
                onChange={()=>{}}
                ref={dateInputRef}
              />
              <button
                type="button"
                aria-label="Open big calendar"
                className="absolute right-2 bottom-2 inline-flex items-center justify-center w-9 h-9 rounded border hover:bg-blue-50"
                onClick={(e)=>{ e.preventDefault(); setCalOpen(true) }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M7 2a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-1V3a1 1 0 1 0-2 0v1H8V3a1 1 0 0 0-1-1ZM4 9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z"/>
                </svg>
              </button>
              {calOpen && (
                <div className="absolute z-50 top-[100%] left-0 mt-2 bg-white shadow-lg rounded border p-2">
                  <DatePicker
                    key={`cal-${examDates.join(',')}`}
                    inline
                    selected={dayjs(date).toDate()}
                    onChange={(d)=> {
                      if (!d) return
                      const nd = dayjs(d).isValid() ? dayjs(d).format('YYYY-MM-DD') : ''
                      if (nd) {
                        setDate(nd)
                        // Clear any old hint; actual validation will run on Generate
                        setMsgSchedule('')
                      }
                    }}
                    onSelect={(d)=> {
                      if (!d) return
                      const nd = dayjs(d).isValid() ? dayjs(d).format('YYYY-MM-DD') : ''
                      if (nd) {
                        // Blur first, then close with a microtask to avoid reopen races
                        if (dateInputRef.current) dateInputRef.current.blur()
                        justClosedRef.current = true
                        setTimeout(()=> setCalOpen(false), 0)
                      }
                    }}
                    onClickOutside={()=> { setCalOpen(false); if (dateInputRef.current) dateInputRef.current.blur(); justClosedRef.current = true }}
                    calendarClassName="big-datepicker"
                  />
                </div>
              )}
            </label>
            <button onClick={generate} disabled={loading} className="px-4 py-2.5 rounded bg-sky-500 hover:bg-sky-400 text-white disabled:opacity-50 text-base transition-colors shadow-sm">Generate</button>
            <button onClick={notify} disabled={!hasGenerated} className="px-4 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-white text-base disabled:opacity-50 transition-colors shadow-sm">Notify Faculty</button>
          </div>
          <div className="text-base text-gray-700 mt-3">{msgSchedule}</div>
        </section>
      </div>
      )}

      {!reassignOnly && hasGenerated && (
        <section className="py-4 w-full max-w-5xl">
          <div className="flex justify-center">
            <button onClick={downloadPdf} className="px-5 py-2.5 rounded border text-base hover:bg-sky-50 transition-colors">Download PDF for {date}</button>
          </div>
        </section>
      )}

      {!reassignOnly && canReassign && !reassignOpen && (
        <section className="py-4">
          <div className="flex justify-center">
            <button className="px-5 py-2.5 rounded bg-sky-500 hover:bg-sky-400 text-white text-base transition-colors shadow-sm" onClick={()=> setReassignOpen(true)}>Reassign</button>
          </div>
        </section>
      )}

      {reassignOpen && (
      <section className="border rounded-lg p-6 bg-white">
        <h2 className="font-medium text-lg mb-3">Quick Reassign (selected date)</h2>
        <div className="grid md:grid-cols-4 gap-4 items-end">
          <label className="text-base">Slot
            <select className="mt-1 w-full border rounded px-4 py-3 text-lg" value={quick.slot} onChange={e=>setQuick(v=>({ ...v, slot: e.target.value }))}>
              <option value="FN">FN</option>
              <option value="AN">AN</option>
              <option value="EV">EV</option>
            </select>
          </label>
          <label className="text-base">Room
            <input list="rooms-list" className="mt-1 w-full border rounded px-4 py-3 text-lg" placeholder="e.g., A-101" value={quick.room} onChange={e=>setQuick(v=>({ ...v, room: e.target.value }))} />
            <datalist id="rooms-list">
              {roomsForSlot(quick.slot).map(code => <option key={code} value={code} />)}
            </datalist>
          </label>
          <label className="text-base md:col-span-2">Search Faculty
            <div className="mt-1 flex gap-2">
              <input className="flex-1 border rounded px-4 py-3 text-lg" placeholder="Name / email / department" value={quick.q} onChange={e=>setQuick(v=>({ ...v, q: e.target.value }))} />
              <button className="px-4 py-2.5 rounded border text-base" onClick={onQuickSearch}>Search</button>
            </div>
          </label>
          <label className="text-base md:col-span-3">Choose Faculty
            <select className="mt-1 w-full border rounded px-4 py-3 text-lg" value={quick.chosenId} onChange={e=>setQuick(v=>({ ...v, chosenId: e.target.value }))}>
              <option value="">Select...</option>
              {quick.results.map(f => (
                <option key={f._id} value={f._id}>{f.name} • {f.email} • {f.department} • {f.designation}</option>
              ))}
            </select>
          </label>
          <div>
            <button className="px-4 py-2.5 rounded bg-blue-600 text-white text-base" onClick={onQuickReassign}>Reassign</button>
          </div>
        </div>
      </section>
      )}
    </div>
  )
}
