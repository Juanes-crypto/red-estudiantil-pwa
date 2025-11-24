import React, { useState, useEffect } from 'react';
import { CommunicationService, StudentService, TeacherService } from '../lib/services';

interface Props {
    parentId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function MedicalExcuseForm({ parentId, onSuccess, onCancel }: Props) {
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        student_id: '',
        date: '',
        reason: '',
        file_url: '',
        teacher_ids: [] as string[]
    });

    useEffect(() => {
        loadStudents();
    }, [parentId]);

    // Cargar profesores cuando cambia el estudiante seleccionado
    useEffect(() => {
        if (formData.student_id) {
            loadTeachersForStudent(formData.student_id);
        } else {
            setTeachers([]);
        }
    }, [formData.student_id]);

    const loadStudents = async () => {
        try {
            const data = await StudentService.getByParent(parentId);
            setStudents(data);
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, student_id: data[0].id }));
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const loadTeachersForStudent = async (studentId: string) => {
        try {
            const student = students.find(s => s.id === studentId);
            if (student?.grupo_id) {
                const teachersData = await TeacherService.getByGroup(student.grupo_id);
                setTeachers(teachersData);
                // Por defecto seleccionar todos? No, mejor que el padre elija.
            }
        } catch (error) {
            console.error('Error loading teachers:', error);
        }
    };

    const handleTeacherToggle = (teacherId: string) => {
        setFormData(prev => {
            const current = prev.teacher_ids;
            if (current.includes(teacherId)) {
                return { ...prev, teacher_ids: current.filter(id => id !== teacherId) };
            } else {
                return { ...prev, teacher_ids: [...current, teacherId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.student_id) {
            alert('Por favor selecciona un estudiante');
            return;
        }
        if (formData.teacher_ids.length === 0) {
            alert('Por favor selecciona al menos un profesor destinatario');
            return;
        }

        setLoading(true);
        try {
            await CommunicationService.createMedicalExcuse({
                student_id: formData.student_id,
                parent_id: parentId,
                date: new Date(formData.date),
                reason: formData.reason,
                file_url: formData.file_url || undefined,
                teacher_ids: formData.teacher_ids
            });
            onSuccess();
        } catch (error) {
            console.error('Error creating excuse:', error);
            alert('Error al enviar la excusa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">
                    Estudiante
                </label>
                <select
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all bg-white"
                    value={formData.student_id}
                    onChange={e => setFormData({ ...formData, student_id: e.target.value, teacher_ids: [] })}
                >
                    {students.map(student => (
                        <option key={student.id} value={student.id}>
                            {student.full_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* SELECCIÓN DE PROFESORES */}
            <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">
                    Destinatarios (Profesores)
                </label>
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 max-h-48 overflow-y-auto">
                    {teachers.length > 0 ? (
                        <div className="space-y-2">
                            {teachers.map(teacher => (
                                <label key={teacher.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                                        checked={formData.teacher_ids.includes(teacher.id)}
                                        onChange={() => handleTeacherToggle(teacher.id)}
                                    />
                                    <span className="text-sm text-neutral-700 font-medium">
                                        {teacher.full_name || 'Docente sin nombre'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-400 text-center py-2">
                            {formData.student_id
                                ? 'No se encontraron profesores para el grupo de este estudiante.'
                                : 'Selecciona un estudiante para ver sus profesores.'}
                        </p>
                    )}
                </div>
                {formData.teacher_ids.length === 0 && teachers.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                        * Debes seleccionar al menos un profesor.
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">
                    Fecha de la Falta
                </label>
                <input
                    type="date"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">
                    Motivo de la Excusa
                </label>
                <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none"
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Explique brevemente la razón de la inasistencia..."
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">
                    URL del Comprobante (Opcional)
                </label>
                <input
                    type="url"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                    value={formData.file_url}
                    onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                    placeholder="https://ejemplo.com/certificado.pdf"
                />
                <p className="text-xs text-neutral-400 mt-1">
                    * Por ahora solo se admiten enlaces externos a documentos.
                </p>
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
                    disabled={loading || formData.teacher_ids.length === 0}
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
                            Enviar Excusa
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
