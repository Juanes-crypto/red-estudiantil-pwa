import React, { useState, useEffect } from 'react';
import { CommunicationService, GroupService } from '../lib/services';

interface Props {
    teacherId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function CreateAnnouncementForm({ teacherId, onSuccess, onCancel }: Props) {
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'homework' as 'homework' | 'exam' | 'event' | 'reminder',
        event_date: '',
        group_ids: [] as string[]
    });

    useEffect(() => {
        loadGroups();
    }, [teacherId]);

    const loadGroups = async () => {
        try {
            const data = await GroupService.getByTeacher(teacherId);
            // Normalizar datos si vienen anidados
            const normalizedGroups = data.map((g: any) => Array.isArray(g) ? g[0] : g).filter(Boolean);
            setGroups(normalizedGroups);
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.group_ids.length === 0) {
            alert('Por favor selecciona al menos un grupo');
            return;
        }

        setLoading(true);
        try {
            await CommunicationService.createAnnouncement({
                teacher_id: teacherId,
                title: formData.title,
                description: formData.description,
                type: formData.type,
                event_date: formData.event_date ? new Date(formData.event_date) : undefined,
                group_ids: formData.group_ids
            });
            onSuccess();
        } catch (error) {
            console.error('Error creating announcement:', error);
            alert('Error al crear el anuncio');
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (groupId: string) => {
        setFormData(prev => ({
            ...prev,
            group_ids: prev.group_ids.includes(groupId)
                ? prev.group_ids.filter(id => id !== groupId)
                : [...prev.group_ids, groupId]
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">
                    Título
                </label>
                <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Tarea de Matemáticas"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">
                    Descripción
                </label>
                <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalles de la actividad..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">
                        Tipo
                    </label>
                    <select
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all bg-white"
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    >
                        <option value="homework">📚 Tarea</option>
                        <option value="exam">📝 Evaluación</option>
                        <option value="event">🎉 Evento</option>
                        <option value="reminder">🔔 Recordatorio</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">
                        Fecha (Opcional)
                    </label>
                    <input
                        type="datetime-local"
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                        value={formData.event_date}
                        onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">
                    Enviar a Grupos
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {groups.map(group => (
                        <button
                            key={group.id}
                            type="button"
                            onClick={() => toggleGroup(group.id)}
                            className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${formData.group_ids.includes(group.id)
                                    ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500'
                                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-brand-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.group_ids.includes(group.id) ? 'bg-brand-500 border-brand-500' : 'border-neutral-300'
                                    }`}>
                                    {formData.group_ids.includes(group.id) && (
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                {group.nombre}
                            </div>
                        </button>
                    ))}
                </div>
                {groups.length === 0 && (
                    <p className="text-sm text-neutral-400 italic">No tienes grupos asignados.</p>
                )}
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-neutral-800 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enviando...
                        </>
                    ) : (
                        <>
                            Publicar Anuncio
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
