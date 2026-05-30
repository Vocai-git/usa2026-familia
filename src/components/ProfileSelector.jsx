import { useApp } from '../context/AppContext'

export default function ProfileSelector() {
  const { people, perfil, cambiarPerfil } = useApp()

  const todos = { id: 'todos', name: 'Todos', emoji: '👨‍👩‍👧‍👦' }
  const opciones = [todos, ...people]

  return (
    <div className="profile-bar">
      {opciones.map(p => (
        <button
          key={p.id}
          className={`profile-pill${perfil === p.id ? ' active' : ''}`}
          onClick={() => cambiarPerfil(p.id)}
        >
          {p.emoji} {p.name}
        </button>
      ))}
    </div>
  )
}
