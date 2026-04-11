import { useState, useMemo } from 'react'

const DEFAULT_PAGE_SIZE = 20

export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const clampedPage = Math.min(page, totalPages)

  const pageItems = useMemo(
    () => items.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [items, clampedPage, pageSize]
  )

  return {
    page: clampedPage,
    totalPages,
    totalItems: items.length,
    pageItems,
    setPage: (n: number) => setPage(Math.max(1, Math.min(n, totalPages))),
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
    needsPagination: items.length > pageSize,
  }
}
