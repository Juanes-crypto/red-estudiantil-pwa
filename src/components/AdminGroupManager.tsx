import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Group {
  id: string;
  name: string;
}

export default function AdminGroupManager() {
  const [groups, setGroups] = useState<Group[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // 1. Cargar Grupos
  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('grupos')
        .select('id, name')
        .order('name', { ascending: true }) // Orden alfabético (10-1 va antes que 6-1, luego lo mejoramos)
      
      if (error) throw error
      setGroups(data || [])
    } catch (error: any) {
      console.error('Error al cargar grupos:', error.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Crear Grupo
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    try {
      setCreating(true)
      
      // 1. Averiguar mi colegio_id (Requisito del Multi-Tenant)
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('colegio_id')
        .eq('id', user?.id)
        .single()

      if (!profile) throw new Error("No se encontró tu colegio")

      // 2. Insertar el grupo
      const { data, error } = await supabase
        .from('grupos')
        .insert({
          name: newGroupName.trim(),
          colegio_id: profile.colegio_id // ¡Clave!
        })
        .select()
        .single()

      if (error) throw error

      // 3. Actualizar UI
      setGroups(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewGroupName('') // Limpiar input

    } catch (error: any) {
      alert('Error al crear grupo: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  // 3. Borrar Grupo
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('¿Estás seguro de borrar este grupo? Los estudiantes quedarán "Sin Grupo".')) return

    try {
      const { error } = await supabase
        .from('grupos')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      setGroups(prev => prev.filter(g => g.id !== groupId))

    } catch (error: any) {
      alert('Error al borrar: ' + error.message)
    }
  }

  if (loading) return <p className="text-center text-zinc-400">Cargando grupos...</p>

  return (
    <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-4">
      <h3 className="mb-4 text-lg font-semibold text-white">Gestión de Grupos / Salones</h3>

      {/* FORMULARIO DE CREAR */}
      <form onSubmit={handleCreateGroup} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Ej: 8-3"
          className="flex-1 rounded-lg border border-zinc-600 bg-zinc-700 p-2 text-white placeholder-zinc-400 focus:border-pink-500 focus:ring-pink-500"
        />
        <button
          type="submit"
          disabled={creating || !newGroupName}
          className="rounded-lg bg-pink-600 px-4 py-2 font-medium text-white hover:bg-pink-700 disabled:opacity-50"
        >
          {creating ? '...' : 'Crear'}
        </button>
      </form>
      
      {/* LISTA DE GRUPOS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {groups.map((group) => (
          <div 
            key={group.id} 
            className="flex items-center justify-between rounded border border-zinc-600 bg-zinc-700 p-3"
          >
            <span className="font-medium text-white">{group.name}</span>
            
            <button
              onClick={() => handleDeleteGroup(group.id)}
              className="text-zinc-400 hover:text-red-400"
              title="Borrar grupo"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="text-center text-zinc-500 py-4">No hay grupos creados.</p>
      )}
    </div>
  )
}