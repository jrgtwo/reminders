import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { TodoListItem } from '../../types/models'
import TodoItem from './TodoItem'

interface Props {
  todos: TodoListItem[]
  onToggle: (t: TodoListItem) => void
  onEdit: (t: TodoListItem) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onReorder: (orderedIds: string[]) => void
  editingItemId?: string | null
  onSaveEdit: (item: TodoListItem, title: string) => void
  onCancelEdit: (item: TodoListItem) => void
  onSaveDesc: (item: TodoListItem, description: string) => void
}

export default function SortableTodoList({ todos, onToggle, onEdit, onDelete, onReorder, editingItemId, onSaveEdit, onCancelEdit, onSaveDesc }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  function handleDragStart() {
    document.body.style.cursor = 'grabbing'
  }

  function handleDragEnd(event: DragEndEvent) {
    document.body.style.cursor = ''
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = todos.findIndex((t) => t.id === active.id)
    const newIndex = todos.findIndex((t) => t.id === over.id)
    const reordered = arrayMove(todos, oldIndex, newIndex)
    onReorder(reordered.map((t) => t.id))
  }

  const sorted = [...todos].sort((a, b) => a.order - b.order)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={sorted.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1 py-1">
          {sorted.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              isEditing={editingItemId === todo.id}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onSaveDesc={onSaveDesc}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
