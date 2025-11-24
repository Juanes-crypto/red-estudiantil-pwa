import { useState, useEffect } from 'react';
import { CommunicationService, StudentService } from '../lib/services';

interface Props {
    parentId: string;
}

export default function ParentNotificationsView({ parentId }: Props) {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [parentId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Obtener estudiantes del padre
            const myStudents = await StudentService.getByParent(parentId);
            setStudents(myStudents);

            // 2. Obtener anuncios para cada estudiante
            // Nota: Esto podría optimizarse en backend, pero por ahora iteramos
            let allAnnouncements: any[] = [];
            for (const student of myStudents) {
                const studentAnnouncements = await CommunicationService.getStudentAnnouncements(student.id);
                // Agregar info del estudiante al anuncio para saber a quién va dirigido
                const enriched = studentAnnouncements.map((a: any) => ({ ...a, studentName: student.full_name }));
                allAnnouncements = [...allAnnouncements, ...enriched];
            }

            // Ordenar por fecha
            allAnnouncements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // Eliminar duplicados si un anuncio va a varios grupos donde tengo hijos (raro pero posible)
            const uniqueAnnouncements = Array.from(new Map(allAnnouncements.map(item => [item.id + item.studentName, item])).values());

            setAnnouncements(uniqueAnnouncements);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'homework': return '📚';
            case 'exam': return '📝';
            case 'event': return '🎉';
            case 'reminder': return '🔔';
            default: return '📌';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-display text-neutral-900">Tablero de Anuncios</h2>
                <button
                    onClick={loadData}
                    className="p-2 text-neutral-400 hover:text-brand-600 transition-colors"
                    title="Actualizar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-neutral-400">Cargando notificaciones...</div>
            ) : announcements.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-neutral-500 font-medium">No hay anuncios nuevos por ahora.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {announcements.map((announcement, index) => (
                        <div key={`${announcement.id}-${index}`} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${announcement.type === 'exam' ? 'bg-red-500' :
                                    announcement.type === 'homework' ? 'bg-brand-500' :
                                        'bg-cyan-500'
                                }`}></div>

                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{getTypeIcon(announcement.type)}</span>
                                    <div>
                                        <h3 className="font-bold text-lg text-neutral-900">{announcement.title}</h3>
                                        <p className="text-xs text-neutral-500">
                                            Publicado por: {announcement.teacher?.full_name}
                                        </p>
                                    </div>
                                </div>
                                {announcement.event_date && (
                                    <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-bold border border-neutral-200">
                                        {formatDate(announcement.event_date)}
                                    </span>
                                )}
                            </div>

                            <p className="text-neutral-600 mb-4 pl-11">{announcement.description}</p>

                            <div className="flex items-center justify-between pl-11 pt-3 border-t border-neutral-50">
                                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
                                    Para: {announcement.studentName}
                                </span>
                                <span className="text-xs text-neutral-400">
                                    {new Date(announcement.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
