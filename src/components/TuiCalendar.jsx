import React, { useEffect, useRef } from 'react'
import Calendar from '@toast-ui/calendar'
import '@toast-ui/calendar/dist/toastui-calendar.min.css'

export default function TuiCalendar({
  schedules = [],
  onCreate,
  onSelectDate,
}) {
  const elRef = useRef(null)
  const calRef = useRef(null)

  useEffect(() => {
    const cal = new Calendar(elRef.current, {
      defaultView: 'month',
      useFormPopup: true,
      useDetailPopup: true,
      month: { startDayOfWeek: 0 },
      calendars: [
        { id: 'workout', name: '운동', color: '#fff', backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
        { id: 'toeic', name: '토익', color: '#fff', backgroundColor: '#111827', borderColor: '#111827' },
        { id: 'etc', name: '기타', color: '#fff', backgroundColor: '#9333ea', borderColor: '#9333ea' },
      ],
    })
    calRef.current = cal

    cal.on('beforeCreateEvent', (ev) => {
      const newEvent = {
        id: String(Date.now()),
        calendarId: ev.calendarId || 'toeic',
        title: ev.title || '새 일정',
        start: ev.start,
        end: ev.end,
        isAllday: ev.isAllday || false,
      }
      try { cal.createEvents([newEvent]) } catch (_) {}
      if (onCreate) onCreate(newEvent)
    })

    cal.on('selectDateTime', (ev) => {
      if (onSelectDate && ev?.start) onSelectDate(ev.start.toDate ? ev.start.toDate() : new Date(ev.start))
    })

    if (schedules && schedules.length) {
      try { cal.createEvents(schedules) } catch (_) {}
    }

    const onResize = () => {
      try { cal.render() } catch (_) {}
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      try { cal.destroy() } catch (_) {}
      calRef.current = null
    }
  }, [])

  useEffect(() => {
    const cal = calRef.current
    if (!cal) return
    try { cal.clear() } catch (_) {}
    if (schedules && schedules.length) {
      try { cal.createEvents(schedules) } catch (_) {}
    }
  }, [schedules])

                return <div ref={elRef} style={{ width: '100%', height: '640px' }} />
}


