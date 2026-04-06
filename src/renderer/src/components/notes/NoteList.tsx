import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { Note } from '../../types/models'
import NoteItem from './NoteItem'

interface Props {
  notes: Note[]
  onNew: () => void
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
  onReorder: (orderedIds: string[]) => void
}

export default function NoteList({ notes, onNew, onEdit, onDelete, onReorder }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragStart() {
    document.body.style.cursor = 'grabbing'
  }

  function handleDragEnd(event: DragEndEvent) {
    document.body.style.cursor = ''
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = notes.findIndex((n) => n.id === active.id)
    const newIndex = notes.findIndex((n) => n.id === over.id)
    const reordered = arrayMove(notes, oldIndex, newIndex)
    onReorder(reordered.map((n) => n.id))
  }

  const sorted = [...notes].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-white/30">
          Notes
        </h3>
        <button
          onClick={onNew}
          className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
          title="New note"
        >
          <Plus size={11} />
        </button>
      </div>
      {sorted.length === 0 && (
        <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">No notes yet</p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sorted.map((n) => n.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1 py-1">
            {sorted.map((note) => (
              <NoteItem key={note.id} note={note} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
