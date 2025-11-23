// ================================================
// PARENT CALENDAR - Calendario con múltiples registros por día
// ================================================
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AttendanceRecord {
    id: string;
    status: 'presente' | 'tarde' | 'falta';
    created_at: string;
    teacher: {
        full_name: string;
    };
}

interface DayData {
    date: string;
    records: AttendanceRecord[];
}

interface Props {
    studentId: string;
}

export default function ParentAttendanceCalendar({ studentId }: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [attendanceByDay, setAttendanceByDay] = useState<Map<string, AttendanceRecord[]>>(new Map());
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

    useEffect(() => {
        loadMonthData();
    }, [studentId, currentMonth]);

    async function loadMonthData() {

        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

        const { data } = await supabase
            .from('asistencia')
            .select(`
        id,
        status,
        created_at,
        teacher:profiles!teacher_id(full_name)
      `)
            .eq('student_id', studentId)
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString())
            .order('created_at', { ascending: true });

        // Agrupar por día
        const byDay = new Map<string, AttendanceRecord[]>();
        data?.forEach(record => {
            const dateKey = new Date(record.created_at).toDateString();
            if (!byDay.has(dateKey)) {
                byDay.set(dateKey, []);
            }
            byDay.get(dateKey)!.push(record as any);
        });

        setAttendanceByDay(byDay);
    }

    function previousMonth() {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    }

    function nextMonth() {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    }

    function goToToday() {
        setCurrentMonth(new Date());
    }

    // Generar días del mes
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDay = monthStart.getDay(); // 0 = Dom
    const daysInMonth = monthEnd.getDate();

    const calendarDays: (number | null)[] = [];
    // Días vacíos antes del 1
    for (let i = 0; i < startDay; i++) {
        calendarDays.push(null);
    }
    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    function getDayRecords(day: number | null): AttendanceRecord[] {
        if (!day) return [];
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return attendanceByDay.get(date.toDateString()) || [];
    }

    function handleDayClick(day: number | null) {
        if (!day) return;
        const records = getDayRecords(day);
        if (records.length > 0) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            setSelectedDay({ date: date.toDateString(), records });
        }
    }

    function getStatusColor(status: string): string {
        if (status === 'presente') return 'bg-green-500';
        if (status === 'tarde') return 'bg-yellow-500';
        return 'bg-red-500';
    }

    function getStatusText(status: string): string {
        if (status === 'presente') return 'Asistió';
        if (status === 'tarde') return 'Tarde';
        return 'Falta';
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
                <button
                    onClick={previousMonth}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                    ← Anterior
                </button>

                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                    <button
                        onClick={goToToday}
                        className="text-xs text-blue-600 hover:underline mt-1"
                    >
                        Ir a hoy
                    </button>
                </div>

                <button
                    onClick={nextMonth}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                    Siguiente →
                </button>
            </div>

            {/* Calendario */}
            <div className="p-4">
                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(name => (
                        <div key={name} className="text-center text-xs font-medium text-gray-600 py-2">
                            {name}
                        </div>
                    ))}
                </div>

                {/* Días del mes */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                        if (!day) {
                            return <div key={idx} className="aspect-square"></div>;
                        }

                        const records = getDayRecords(day);
                        const hasRecords = records.length > 0;
                        const today = new Date().toDateString();
                        const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
                        const isToday = cellDate === today;

                        return (
                            <button
                                key={idx}
                                onClick={() => handleDayClick(day)}
                                className={`aspect-square border rounded relative ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'
                                    } ${hasRecords ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
                            >
                                <div className="absolute top-1 left-1 right-1 text-xs font-medium text-gray-700">
                                    {day}
                                </div>

                                {hasRecords && (
                                    <div className="absolute bottom-1 left-1 right-1 flex flex-col gap-0.5">
                                        {records.slice(0, 3).map((record, i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 rounded ${getStatusColor(record.status)}`}
                                                title={`${getStatusText(record.status)} - ${record.teacher?.full_name}`}
                                            ></div>
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-xs text-gray-700">Asistió</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-xs text-gray-700">Tarde</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-xs text-gray-700">Falta</span>
                </div>
            </div>

            {/* Modal de detalle del día */}
            {selectedDay && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedDay(null)}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {new Date(selectedDay.date).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </h3>
                        </div>

                        <div className="p-4 space-y-3">
                            {selectedDay.records.map((record, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {getStatusText(record.status)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Profesor: {record.teacher?.full_name || 'No disponible'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(record.created_at).toLocaleTimeString('es-ES', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(record.status)}`}></div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-200">
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
