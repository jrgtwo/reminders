export function buildFolderTree<T extends { id: string; parentId?: string }>(
  folders: T[]
): Map<string | undefined, T[]> {
  const map = new Map<string | undefined, T[]>()
  for (const f of folders) {
    const key = f.parentId ?? undefined
    const arr = map.get(key) ?? []
    arr.push(f)
    map.set(key, arr)
  }
  return map
}

export function getDescendantIds(
  folderId: string,
  childrenMap: Map<string | undefined, { id: string }[]>
): Set<string> {
  const result = new Set<string>()
  const stack = [folderId]
  while (stack.length) {
    const id = stack.pop()!
    for (const c of childrenMap.get(id) ?? []) {
      result.add(c.id)
      stack.push(c.id)
    }
  }
  return result
}
