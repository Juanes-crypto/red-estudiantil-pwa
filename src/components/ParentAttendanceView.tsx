// ================================================
// PARENT ATTENDANCE VIEW - Vista para padres con calendario y lista
// ================================================
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ParentAttendanceCalendar from './ParentAttendanceCalendar';

interface Student {
    id: string;
    full_name: string;
}

interface Props {
    parentId: string;
}

export default function ParentAttendanceView({ parentId }: Props) {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudents();
    }, [parentId]);

    async function loadStudents() {
        setLoading(true);
        const { data } = await supabase
            .from('students')
            .select('id, full_name')
            .eq('parent_id', parentId)
            .order('full_name');

        if (data && data.length > 0) {
            setStudents(data);
            setSelectedStudent(data[0]); // Seleccionar el primero por defecto
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Cargando...</div>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">No tienes hijos registrados</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Selector de hijo */}
            {students.length > 1 && (
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecciona un hijo:
                    </label>
                    <select
                        value={selectedStudent?.id || ''}
                        onChange={(e) => {
                            const student = students.find(s => s.id === e.target.value);
                            setSelectedStudent(student || null);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {students.map(student => (
                            <option key={student.id} value={student.id}>
                                {student.full_name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Título */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                    Asistencia de {selectedStudent?.full_name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    Haz clic en un día con registros para ver los detalles
                </p>
            </div>

            {/* Calendario */}
            {selectedStudent && (
                <ParentAttendanceCalendar studentId={selectedStudent.id} />
            )}
        </div>
    );
}
