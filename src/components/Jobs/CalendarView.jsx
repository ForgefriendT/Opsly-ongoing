import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function CalendarView({ currentPlan, currentClient, onSelectJob, onAddJob, jobs = [], refreshJobs }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // 'month' or 'week'

  const currencySymbol = currentClient?.currency_symbol || '$'

  // Helper to format Date header
  const getHeaderLabel = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })
    } else {
      const startOfWeek = new Date(currentDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
      startOfWeek.setDate(diff)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      return `${startOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
  }

  // Navigate calendar days
  const handlePrev = () => {
    const next = new Date(currentDate)
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1)
    } else {
      next.setDate(next.getDate() - 7)
    }
    setCurrentDate(next)
  }

  const handleNext = () => {
    const next = new Date(currentDate)
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1)
    } else {
      next.setDate(next.getDate() + 7)
    }
    setCurrentDate(next)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Get days array for monthly calendar
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayIndex = new Date(year, month, 1).getDay() // Day of week for 1st
    // Adjust index to start week on Monday
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1

    const numDays = new Date(year, month + 1, 0).getDate() // Total days in month
    const prevNumDays = new Date(year, month, 0).getDate() // Days in previous month
    
    const days = []
    
    // Fill previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevNumDays - i),
        isCurrentMonth: false
      })
    }
    
    // Fill current month days
    for (let i = 1; i <= numDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }
    
    // Fill next month padding up to a grid multiple of 7
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }
    
    return days
  }

  // Get days array for weekly view (Monday to Sunday)
  const getDaysInWeek = () => {
    const day = currentDate.getDay()
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1) // start on Monday
    const monday = new Date(currentDate)
    monday.setDate(diff)
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      days.push(d)
    }
    return days
  }

  const isToday = (date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  // Check jobs scheduled for a date
  const getJobsForDate = (date) => {
    return jobs.filter(job => {
      if (!job.start_date) return false
      const jobDate = new Date(job.start_date)
      return jobDate.getDate() === date.getDate() &&
        jobDate.getMonth() === date.getMonth() &&
        jobDate.getFullYear() === date.getFullYear()
    })
  }

  // Build simulated views
  const daysInMonth = getDaysInMonth()
  const daysInWeek = getDaysInWeek()
  const weekDaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="bg-opsly-card border border-opsly-border rounded-xl p-5 shadow-sm space-y-4">
      {/* Calendar Header Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-opsly-border pb-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-lg bg-opsly-input border border-opsly-border hover:bg-opsly-hover text-opsly-text flex items-center justify-center cursor-pointer transition-colors"
            title="Previous"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-sm font-bold text-opsly-text min-w-[120px] text-center">
            {getHeaderLabel()}
          </h2>
          
          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-lg bg-opsly-input border border-opsly-border hover:bg-opsly-hover text-opsly-text flex items-center justify-center cursor-pointer transition-colors"
            title="Next"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={handleToday}
            className="text-xs font-semibold text-opsly-secondary hover:text-opsly-text bg-opsly-input border border-opsly-border py-1.5 px-3 rounded-lg cursor-pointer transition-colors ml-2"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
          <div className="flex bg-opsly-input p-0.5 rounded-lg border border-opsly-border">
            <button
              onClick={() => setViewMode('month')}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                viewMode === 'month' ? 'bg-opsly-accent text-opsly-text' : 'text-opsly-secondary hover:text-opsly-text'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                viewMode === 'week' ? 'bg-opsly-accent text-opsly-text' : 'text-opsly-secondary hover:text-opsly-text'
              }`}
            >
              Week
            </button>
          </div>

          {currentPlan !== 'free' && (
            <button
              onClick={() => onAddJob()}
              className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New Job
            </button>
          )}
        </div>
      </div>

      {/* Main Grid area */}
      <div className="relative overflow-hidden">
        {/* Month View Grid */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 border-t border-l border-opsly-border rounded-lg overflow-hidden bg-opsly-input/10">
            {/* Weekdays */}
            {weekDaysShort.map(day => (
              <div key={day} className="text-center py-2 border-r border-b border-opsly-border text-[10px] font-bold text-opsly-muted uppercase tracking-wider bg-opsly-input/30">
                {day}
              </div>
            ))}
            
            {/* Month Days */}
            {daysInMonth.map((dayObj, index) => {
              const dayJobs = getJobsForDate(dayObj.date)
              return (
                <div
                  key={index}
                  onClick={() => currentPlan !== 'free' && onAddJob(dayObj.date)}
                  className={`min-h-[90px] p-2 border-r border-b border-opsly-border flex flex-col justify-between transition-colors relative ${
                    dayObj.isCurrentMonth ? 'bg-opsly-card' : 'bg-[#151413] opacity-35'
                  } ${currentPlan !== 'free' ? 'hover:bg-opsly-hover cursor-pointer' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${
                      isToday(dayObj.date)
                        ? 'w-5 h-5 rounded-full bg-opsly-accent text-opsly-text flex items-center justify-center'
                        : 'text-opsly-secondary'
                    }`}>
                      {dayObj.date.getDate()}
                    </span>
                    {dayJobs.length > 0 && (
                      <span className="text-[9px] font-bold text-opsly-accent bg-opsly-accent-soft px-1.5 py-0.5 rounded border border-opsly-accent/15">
                        {dayJobs.length} {dayJobs.length === 1 ? 'Job' : 'Jobs'}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-1 overflow-y-auto max-h-[60px] custom-scrollbar">
                    {dayJobs.map(job => (
                      <div
                        key={job.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectJob(job)
                        }}
                        className={`text-[10px] font-semibold truncate px-1.5 py-1 rounded border hover:brightness-110 cursor-pointer transition-all ${
                          job.status === 'completed'
                            ? 'bg-green-950/20 text-green-400 border-green-800/25'
                            : job.status === 'in_progress'
                            ? 'bg-blue-950/20 text-blue-400 border-blue-800/25'
                            : job.status === 'cancelled'
                            ? 'bg-red-950/20 text-red-400 border-red-800/25'
                            : 'bg-opsly-accent-soft text-opsly-accent border-opsly-accent/20'
                        }`}
                        title={job.title}
                      >
                        {job.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Week View Grid */}
        {viewMode === 'week' && (
          <div className="border border-opsly-border rounded-lg overflow-hidden bg-opsly-card">
            {/* Headers */}
            <div className="grid grid-cols-8 border-b border-opsly-border bg-opsly-input/30">
              <div className="border-r border-opsly-border py-2 text-[10px] font-bold text-opsly-muted uppercase tracking-wider text-center flex items-center justify-center">
                Time
              </div>
              {daysInWeek.map((day, idx) => (
                <div
                  key={idx}
                  className={`py-2 border-r last:border-0 border-opsly-border text-center flex flex-col justify-center items-center ${
                    isToday(day) ? 'bg-opsly-accent-soft/10' : ''
                  }`}
                >
                  <span className="text-[10px] font-bold text-opsly-muted uppercase tracking-wider">{weekDaysShort[idx]}</span>
                  <span className={`text-xs font-extrabold mt-0.5 ${isToday(day) ? 'text-opsly-accent' : 'text-opsly-text'}`}>
                    {day.getDate()}
                  </span>
                </div>
              ))}
            </div>

            {/* Hourly Slots (8 AM to 6 PM) */}
            <div className="divide-y divide-opsly-border">
              {Array.from({ length: 11 }).map((_, hourIdx) => {
                const hour = hourIdx + 8 // Starts at 8:00 AM
                const ampm = hour >= 12 ? 'PM' : 'AM'
                const displayHour = hour > 12 ? hour - 12 : hour
                const timeString = `${displayHour}:00 ${ampm}`

                return (
                  <div key={hour} className="grid grid-cols-8 min-h-[50px] relative divide-x divide-opsly-border">
                    {/* Time Label */}
                    <div className="text-[9px] font-bold text-opsly-muted text-center flex items-center justify-center select-none bg-opsly-input/10">
                      {timeString}
                    </div>

                    {/* Week Columns */}
                    {daysInWeek.map((day, colIdx) => {
                      const dayJobs = getJobsForDate(day).filter(job => {
                        if (!job.start_date) return false
                        const jobHour = new Date(job.start_date).getHours()
                        return jobHour === hour
                      })

                      return (
                        <div
                          key={colIdx}
                          onClick={() => currentPlan !== 'free' && onAddJob(new Date(day.setHours(hour, 0, 0, 0)))}
                          className={`relative p-1 ${currentPlan !== 'free' ? 'hover:bg-opsly-hover/30 cursor-pointer' : ''} ${
                            isToday(day) ? 'bg-opsly-accent-soft/[0.02]' : ''
                          }`}
                        >
                          {dayJobs.map(job => (
                            <div
                              key={job.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                onSelectJob(job)
                              }}
                              className={`absolute inset-x-1 py-1 px-1.5 text-[9px] font-bold rounded border truncate z-10 hover:brightness-110 shadow-sm transition-all ${
                                job.status === 'completed'
                                  ? 'bg-green-950/20 text-green-400 border-green-800/25'
                                  : job.status === 'in_progress'
                                  ? 'bg-blue-950/20 text-blue-400 border-blue-800/25'
                                  : job.status === 'cancelled'
                                  ? 'bg-red-950/20 text-red-400 border-red-800/25'
                                  : 'bg-opsly-accent-soft text-opsly-accent border-opsly-accent/20'
                              }`}
                              title={`${job.title} - ${new Date(job.start_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                            >
                              {job.title}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Gated Lockout Overlay for Free Plan */}
        {currentPlan === 'free' && (
          <div className="absolute inset-0 bg-[#0f0e0d]/75 backdrop-blur-[3px] flex flex-col items-center justify-center text-center p-6 z-20">
            <span className="w-10 h-10 rounded-full bg-opsly-accent/15 border border-opsly-accent/20 flex items-center justify-center text-opsly-accent mb-3.5 shadow-md">
              <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <h3 className="text-sm font-bold text-opsly-text uppercase tracking-wider">Schedule & Dispatch Gated</h3>
            <p className="text-xs text-opsly-secondary max-w-sm mt-1.5 leading-relaxed">
              Interactive calendars, technician dispatches, and profitability trackers are Starter plan features. Unlock full dashboard functionality now.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="#upgrade"
                onClick={(e) => {
                  e.preventDefault()
                  window.dispatchEvent(new CustomEvent('opsly-trigger-upgrade', { detail: { plan: 'starter' } }))
                }}
                className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text text-xs font-bold py-2 px-5 rounded-lg cursor-pointer shadow-sm transition-all"
              >
                Upgrade Plan
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
