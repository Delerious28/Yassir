import { addMinutes, format, isAfter, isBefore, parse, set } from 'date-fns'

export function parseHM(hm: string, base: Date = new Date()): Date {
  const [h, m] = hm.split(':').map(Number)
  return set(base, { hours: h, minutes: m, seconds: 0, milliseconds: 0 })
}

export function formatHM(date: Date) {
  return format(date, 'HH:mm')
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateScheduleTimes({
  count,
  windowStart,
  windowEnd,
  intervalMinMins,
  intervalMaxMins,
  startFrom = new Date(),
}: {
  count: number
  windowStart: string
  windowEnd: string
  intervalMinMins: number
  intervalMaxMins: number
  startFrom?: Date
}) {
  const dayStart = parseHM(windowStart, startFrom)
  const dayEnd = parseHM(windowEnd, startFrom)
  let current = isBefore(startFrom, dayStart) ? dayStart : startFrom
  const times: Date[] = []

  for (let i = 0; i < count; i++) {
    if (isAfter(current, dayEnd)) break
    // ensure current is within window
    if (isBefore(current, dayStart)) current = dayStart
    // push current time
    times.push(current)
    // add random interval for next
    const delta = randomInt(intervalMinMins, intervalMaxMins)
    current = addMinutes(current, delta)
  }
  return times
}
