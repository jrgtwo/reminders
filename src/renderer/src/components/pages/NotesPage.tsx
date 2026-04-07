import NotesNav from '../notes/NotesNav'

export default function NotesPage() {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-app)] overflow-y-auto">
      <NotesNav />
    </div>
  )
}
