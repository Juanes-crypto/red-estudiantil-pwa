// ================================================
// ATTENDANCE GRID - Interfaz tipo Excel para profesores
// ================================================
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Student {
    id: string;
    full_name: string;
}

interface AttendanceRecord {
    date: string;
    student_id: string;
    status: 'A' | 'T' | 'F' | null; // A=Asistió, T=Tarde, F=Falta
}

interface Props {
    groupId: string;
    teacherId: string;
}

export default function AttendanceGrid({ groupId, teacherId }: Props) {
    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceRecord>>(new Map());
    const [selectedCell, setSelectedCell] = useState<{ studentId: string; date: string } | null>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
    const [loading, setLoading] = useState(true);

    // Obtener inicio de la semana (lunes)
    function getWeekStart(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    // Generar array de 7 días de la semana
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        return date;
    });

    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date().toDateString();

    useEffect(() => {
        loadData();
    }, [groupId, currentWeekStart]);

    async function loadData() {
        setLoading(true);

        // Cargar estudiantes
        const { data: studentsData } = await supabase
            .from('students')
            .select('id, full_name')
            .eq('grupo_id', groupId)
            .order('full_name');

        if (studentsData) setStudents(studentsData);

        // Cargar asistencia de la semana
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const { data: attendanceRaw } = await supabase
            .from('asistencia')
            .select('student_id, created_at, status')
            .in('student_id', studentsData?.map(s => s.id) || [])
            .gte('created_at', currentWeekStart.toISOString())
            .lt('created_at', weekEnd.toISOString());

        // Mapear a estructura clave: studentId_date
        const attendanceMap = new Map<string, AttendanceRecord>();
        attendanceRaw?.forEach(record => {
            const date = new Date(record.created_at).toDateString();
            const key = `${record.student_id}_${date}`;
            const statusCode = record.status === 'presente' ? 'A' : record.status === 'tarde' ? 'T' : 'F';
            attendanceMap.set(key, {
                date,
                student_id: record.student_id,
                status: statusCode as 'A' | 'T' | 'F'
            });
        });

        setAttendanceData(attendanceMap);
        setLoading(false);
    }

    async function markAttendance(studentId: string, date: Date, status: 'presente' | 'tarde' | 'falta') {
        const dateStr = date.toDateString();

        // Insertar en DB
        await supabase.from('asistencia').insert({
            student_id: studentId,
            teacher_id: teacherId,
            status,
            created_at: date.toISOString()
        });

        // Actualizar local
        const key = `${studentId}_${dateStr}`;
        const statusCode = status === 'presente' ? 'A' : status === 'tarde' ? 'T' : 'F';
        const newMap = new Map(attendanceData);
        newMap.set(key, { date: dateStr, student_id: studentId, status: statusCode as 'A' | 'T' | 'F' });
        setAttendanceData(newMap);
        setSelectedCell(null);
    }

    function getCellStatus(studentId: string, date: Date): 'A' | 'T' | 'F' | null {
        const key = `${studentId}_${date.toDateString()}`;
        return attendanceData.get(key)?.status || null;
    }

    function getCellColor(status: 'A' | 'T' | 'F' | null): string {
        if (status === 'A') return 'bg-green-500 text-white';
        if (status === 'T') return 'bg-yellow-500 text-gray-900';
        if (status === 'F') return 'bg-red-500 text-white';
        return 'bg-white border border-gray-300 hover:bg-gray-50';
    }

    function previousWeek() {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() - 7);
        setCurrentWeekStart(newStart);
    }

    function nextWeek() {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + 7);
        setCurrentWeekStart(newStart);
    }

    function goToCurrentWeek() {
        setCurrentWeekStart(getWeekStart(new Date()));
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Cargando lista...</div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-md">
            {/* Header con navegación de semanas */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
                <button
                    onClick={previousWeek}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                    ← Semana anterior
                </button>

                <button
                    onClick={goToCurrentWeek}
                    className="px-4 py-1 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Semana actual
                </button>

                <button
                    onClick={nextWeek}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                    Semana siguiente →
                </button>
            </div>

            {/* Grid tipo Excel */}
            <div className="overflow-x-auto pb-24">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="sticky left-0 z-10 bg-gray-100 border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                                Estudiante
                            </th>
                            {weekDays.map((date, idx) => {
                                const isToday = date.toDateString() === today;
                                return (
                                    <th
                                        key={idx}
                                        className={`border border-gray-300 px-3 py-3 text-center text-sm font-medium ${isToday ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                                            }`}
                                    >
                                        <div>{dayNames[idx]}</div>
                                        <div className="text-xs font-normal">{date.getDate()}</div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, studentIndex) => {
                            // Detectar si es uno de los últimos 2 estudiantes
                            const isLastRows = studentIndex >= students.length - 2;

                            return (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="sticky left-0 z-10 bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900">
                                        {student.full_name}
                                    </td>
                                    {weekDays.map((date, idx) => {
                                        const status = getCellStatus(student.id, date);
                                        const isToday = date.toDateString() === today;
                                        const isSelected = selectedCell?.studentId === student.id && selectedCell?.date === date.toDateString();

                                        return (
                                            <td
                                                key={idx}
                                                className={`border border-gray-300 relative ${isToday ? 'bg-blue-50' : ''
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => {
                                                        // Siempre abrir popup (para poder cambiar asistencia)
                                                        setSelectedCell({ studentId: student.id, date: date.toDateString() });
                                                    }}
                                                    className={`w-full h-12 text-sm font-bold flex items-center justify-center ${getCellColor(status)}`}
                                                >
                                                    {status || ''}
                                                </button>

                                                {/* Popup con botones - Posicionamiento inteligente */}
                                                {isSelected && (
                                                    <>
                                                        {/* Backdrop para cerrar al hacer click fuera */}
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setSelectedCell(null)}
                                                        ></div>

                                                        <div className={`absolute ${isLastRows ? 'bottom-full mb-1' : 'top-full mt-1'
                                                            } left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-20 flex gap-2 whitespace-nowrap`}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAttendance(student.id, date, 'presente');
                                                                }}
                                                                className="px-3 py-2 text-xs font-medium bg-green-500 text-white rounded hover:bg-green-600"
                                                            >
                                                                Presente
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAttendance(student.id, date, 'tarde');
                                                                }}
                                                                className="px-3 py-2 text-xs font-medium bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600"
                                                            >
                                                                Tarde
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAttendance(student.id, date, 'falta');
                                                                }}
                                                                className="px-3 py-2 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600"
                                                            >
                                                                Falta
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedCell(null);
                                                                }}
                                                                className="px-2 py-2 text-xs text-gray-600 hover:text-gray-900"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-700">A = Asistió</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                    <span className="text-sm text-gray-700">T = Tarde</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-700">F = Falta</span>
                </div>
            </div>
        </div>
    );
}
