import { useMemo, useState } from 'react'

export function useDateTree<I>(items: I[], getDate: (item: I) => string | undefined) {
  const tree = useMemo(() => {
    const t: Record<string, Record<string, Record<string, I[]>>> = {}
    for (const item of items) {
      const date = getDate(item)
      if (!date) continue
      const [year, month, day] = date.split('-')
      if (!t[year]) t[year] = {}
      if (!t[year][month]) t[year][month] = {}
      if (!t[year][month][day]) t[year][month][day] = []
      t[year][month][day].push(item)
    }
    return t
  }, [items, getDate])

  const years = Object.keys(tree).sort((a, b) => b.localeCompare(a))

  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set())
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  function toggle(set: Set<string>, setFn: (s: Set<string>) => void, key: string) {
    const next = new Set(set)
    next.has(key) ? next.delete(key) : next.add(key)
    setFn(next)
  }

  function toggleYear(year: string) {
    toggle(expandedYears, setExpandedYears, year)
  }

  function toggleMonth(key: string) {
    toggle(expandedMonths, setExpandedMonths, key)
  }

  function toggleDay(key: string) {
    toggle(expandedDays, setExpandedDays, key)
  }

  return { tree, years, expandedYears, expandedMonths, expandedDays, toggleYear, toggleMonth, toggleDay }
}
