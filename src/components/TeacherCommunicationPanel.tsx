import { useState, useEffect } from 'react';
import { CommunicationService } from '../lib/services';
import CreateAnnouncementForm from './CreateAnnouncementForm';

interface Props {
    teacherId: string;
}

export default function TeacherCommunicationPanel({ teacherId }: Props) {
    const [activeTab, setActiveTab] = useState<'announcements' | 'excuses'>('announcements');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [excuses, setExcuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [teacherId, activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'announcements') {
                const data = await CommunicationService.getTeacherAnnouncements(teacherId);
                setAnnouncements(data);
            } else {
                const data = await CommunicationService.getTeacherExcuses(teacherId);
                setExcuses(data);
            }
        } catch (err: any) {
            console.error('Error loading data:', err);
            setError('No se pudieron cargar los datos. Por favor, verifica tu conexión o intenta más tarde.');
        } finally {
            setLoading(false);
        }
    };

    const handleExcuseStatus = async (excuseId: string, status: 'approved' | 'rejected') => {
        try {
            await CommunicationService.updateExcuseStatus(excuseId, status);
            // Recargar lista
            loadData();
        } catch (error) {
            console.error('Error updating excuse:', error);
            alert('Error al actualizar el estado');
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Aprobada</span>;
            case 'rejected':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Rechazada</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Pendiente</span>;
        }
    };

    return (
        <div className="space-y-8">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-display text-neutral-900">Centro de Comunicación</h2>
                    <p className="text-neutral-500">Gestiona anuncios y revisa excusas médicas.</p>
                </div>

                <div className="flex p-1 bg-neutral-100 rounded-xl">
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'announcements'
                            ? 'bg-white text-brand-600 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                    >
                        Anuncios
                    </button>
                    <button
                        onClick={() => setActiveTab('excuses')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'excuses'
                            ? 'bg-white text-brand-600 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                    >
                        Excusas Médicas
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}
                {activeTab === 'announcements' && (
                    <div className="space-y-6">
                        {!showCreateForm ? (
                            <>
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="w-full py-4 border-2 border-dashed border-brand-200 rounded-2xl text-brand-600 font-bold hover:bg-brand-50 hover:border-brand-300 transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Crear Nuevo Anuncio
                                </button>

                                {loading ? (
                                    <div className="text-center py-12 text-neutral-400">Cargando anuncios...</div>
                                ) : announcements.length === 0 ? (
                                    <div className="text-center py-12 text-neutral-400">No has publicado anuncios aún.</div>
                                ) : (
                                    <div className="grid gap-4">
                                        {announcements.map((announcement) => (
                                            <div key={announcement.id} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{getTypeIcon(announcement.type)}</span>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-neutral-900">{announcement.title}</h3>
                                                            <p className="text-xs text-neutral-500">
                                                                Publicado: {formatDate(announcement.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {announcement.event_date && (
                                                        <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-bold border border-brand-100">
                                                            Para: {formatDate(announcement.event_date)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-neutral-600 mb-4">{announcement.description}</p>
                                                <div className="flex items-center gap-2 text-xs text-neutral-500 border-t border-neutral-100 pt-3">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    Enviado a: {announcement.groups?.map((g: any) => g.group?.nombre).join(', ') || 'Sin grupos'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-neutral-900">Nuevo Anuncio</h3>
                                    <button onClick={() => setShowCreateForm(false)} className="text-neutral-400 hover:text-neutral-600">
                                        ✕
                                    </button>
                                </div>
                                <CreateAnnouncementForm
                                    teacherId={teacherId}
                                    onSuccess={() => {
                                        setShowCreateForm(false);
                                        loadData();
                                    }}
                                    onCancel={() => setShowCreateForm(false)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'excuses' && (
                    <div className="space-y-6">
                        {loading ? (
                            <div className="text-center py-12 text-neutral-400">Cargando excusas...</div>
                        ) : excuses.length === 0 ? (
                            <div className="text-center py-12 text-neutral-400">No hay excusas pendientes de revisión.</div>
                        ) : (
                            <div className="grid gap-4">
                                {excuses.map((excuse) => (
                                    <div key={excuse.id} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-lg text-neutral-900">{excuse.student?.full_name}</h3>
                                                    {getStatusBadge(excuse.status)}
                                                </div>
                                                <p className="text-sm text-neutral-500">
                                                    Enviada por: {excuse.parent?.full_name} • Fecha de falta: {new Date(excuse.date).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {excuse.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleExcuseStatus(excuse.id, 'rejected')}
                                                        className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                    >
                                                        Rechazar
                                                    </button>
                                                    <button
                                                        onClick={() => handleExcuseStatus(excuse.id, 'approved')}
                                                        className="px-4 py-2 text-sm font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                                    >
                                                        Aprobar
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                                            <p className="text-neutral-700 italic">"{excuse.reason}"</p>
                                            {excuse.file_url && (
                                                <a
                                                    href={excuse.file_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                    </svg>
                                                    Ver Adjunto
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
