import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Todo } from '../../types/models'
import TodoItem from './TodoItem'

interface Props {
  todos: Todo[]
  onToggle: (t: Todo) => void
  onEdit: (t: Todo) => void
  onDelete: (id: string) => void
  onReorder: (orderedIds: string[]) => void
}

export default function SortableTodoList({ todos, onToggle, onEdit, onDelete, onReorder }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

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
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
