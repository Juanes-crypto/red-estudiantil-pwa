// ================================================
// TEACHER ATTENDANCE VIEW - Vista principal para profesores
// ================================================
import { useState, useEffect } from 'react';
import AttendanceGrid from './AttendanceGrid';
import { supabase } from '../lib/supabaseClient';

interface Props {
    groupId: string;
    groupName: string;
}

export default function TeacherAttendanceView({ groupId, groupName }: Props) {
    const [teacherId, setTeacherId] = useState<string>('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Obtener ID del profesor
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setTeacherId(data.user.id);
        });
    }, []);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{groupName}</h2>
                        <p className="text-sm text-gray-600">Registro de asistencia</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-4 py-2 text-sm font-medium rounded ${viewMode === 'grid'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            Vista semanal
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 text-sm font-medium rounded ${viewMode === 'list'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            Vista rápida
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'grid' && teacherId ? (
                <AttendanceGrid groupId={groupId} teacherId={teacherId} />
            ) : (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                    Vista rápida - En desarrollo
                </div>
            )}
        </div>
    );
}
