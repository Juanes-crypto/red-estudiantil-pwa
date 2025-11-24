// ================================================
// SERVICIO: Supabase Queries (Single Responsibility)
// ================================================
// Este servicio centraliza TODAS las consultas a Supabase
// Principio: Single Responsibility - solo maneja queries
// ================================================

import { supabase } from './supabaseClient';

// ================================================
// ATTENDANCE SERVICE
// ================================================

export const AttendanceService = {
    /**
     * Obtener asistencias de un estudiante
     */
    async getByStudent(studentId: string) {
        const { data, error } = await supabase
            .from('asistencia')
            .select(`
        id,
        status,
        created_at,
        teacher:profiles!teacher_id(full_name)
      `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Crear registro de asistencia
     */
    async create(data: {
        student_id: string;
        teacher_id: string;
        status: 'presente' | 'tarde' | 'falta';
    }) {
        const { data: result, error } = await supabase
            .from('asistencia')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Obtener estadísticas de asistencia
     */
    async getStats(studentId: string) {
        const { data, error } = await supabase
            .rpc('get_attendance_stats', { p_student_id: studentId });

        if (error) throw error;
        return data[0];
    },

    /**
     * Obtener asistencias por rango de fechas
     */
    async getByDateRange(studentId: string, startDate: Date, endDate: Date) {
        const { data, error } = await supabase
            .from('asistencia')
            .select('*')
            .eq('student_id', studentId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};

// ================================================
// STUDENT SERVICE
// ================================================

export const StudentService = {
    /**
     * Obtener estudiantes de un padre
     */
    async getByParent(parentId: string) {
        const { data, error } = await supabase
            .from('students')
            .select('id, full_name, grupo_id, grupos(name)')
            .eq('parent_id', parentId)
            .order('full_name');

        if (error) throw error;
        return data;
    },

    /**
     * Obtener estudiantes de un grupo
     */
    async getByGroup(groupId: string) {
        const { data, error } = await supabase
            .from('students')
            .select('id, full_name')
            .eq('grupo_id', groupId)
            .order('full_name');

        if (error) throw error;
        return data;
    },

    /**
     * Crear nuevo estudiante
     */
    async create(data: {
        full_name: string;
        parent_id: string;
        colegio_id: string;
        grupo_id?: string;
    }) {
        const { data: result, error } = await supabase
            .from('students')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Actualizar estudiante
     */
    async update(id: string, data: Partial<{
        full_name: string;
        grupo_id: string;
    }>) {
        const { data: result, error } = await supabase
            .from('students')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Eliminar estudiante
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ================================================
// PROFILE SERVICE
// ================================================

export const ProfileService = {
    /**
     * Obtener perfil del usuario actual
     */
    async getCurrent() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Actualizar FCM token
     */
    async updateFCMToken(userId: string, token: string) {
        const { error } = await supabase
            .from('profiles')
            .update({ fcm_token: token })
            .eq('id', userId);

        if (error) throw error;
    },

    /**
     * Obtener perfil por ID
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }
};

// ================================================
// GROUP SERVICE
// ================================================

export const GroupService = {
    /**
     * Obtener grupos de un profesor
     */
    async getByTeacher(teacherId: string) {
        const { data, error } = await supabase
            .from('docentes_grupos')
            .select(`
        grupos(
          id,
          name,
          grado
        )
      `)
            .eq('docente_id', teacherId);

        if (error) throw error;
        return data.map(d => d.grupos).filter(Boolean);
    },

    /**
     * Obtener todos los grupos de un colegio
     */
    async getBySchool(schoolId: string) {
        const { data, error } = await supabase
            .from('grupos')
            .select('*')
            .eq('colegio_id', schoolId)
            .order('grado', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Crear nuevo grupo
     */
    async create(data: {
        name: string;
        grado: string;
        colegio_id: string;
    }) {
        const { data: result, error } = await supabase
            .from('grupos')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return result;
    }
};

// ================================================
// ICFES SERVICE (para futuro módulo)
// ================================================

export const ICFESService = {
    /**
     * Obtener pregunta aleatoria por módulo
     */
    async getRandomQuestion(modulo: string, excludeIds: string[] = []) {
        // Primero obtener todas las preguntas del módulo
        let query = supabase
            .from('icfes_questions')
            .select('*')
            .eq('modulo', modulo);

        // Si hay IDs para excluir, filtrarlos
        if (excludeIds.length > 0) {
            // Nota: 'not.in' espera una lista separada por comas en formato string para RPC, 
            // pero para query builder estándar usamos .not('id', 'in', `(${ids})`)
            // Una forma más segura en Supabase JS es usar un filtro post-query si son pocos,
            // o usar .not('id', 'in', excludeIds)
            query = query.not('id', 'in', `(${excludeIds.join(',')})`);
        }

        const { data: questions, error } = await query;

        if (error) throw error;

        // Si no hay preguntas (o todas fueron excluidas)
        if (!questions || questions.length === 0) {
            return null; // Retornar null para indicar que se deben generar con IA
        }

        // Seleccionar una aleatoria
        const randomIndex = Math.floor(Math.random() * questions.length);
        return questions[randomIndex];
    },

    /**
     * Guardar pregunta generada por IA
     */
    async saveGeneratedQuestion(question: any) {
        // Eliminar ID temporal si existe
        const { id, ...questionData } = question;

        const { data, error } = await supabase
            .from('icfes_questions')
            .insert(questionData)
            .select()
            .single();

        if (error) {
            console.error('Error saving AI question:', error);
            return question; // Retornar la original si falla (fallback)
        }
        return data;
    },

    /**
     * Registrar intento de respuesta
     */
    async createAttempt(data: {
        student_id: string;
        question_id: string;
        respuesta_estudiante: string;
        es_correcta: boolean;
    }) {
        const { error } = await supabase
            .from('icfes_attempts')
            .insert(data);

        if (error) throw error;
    },

    /**
     * Obtener leaderboard
     */
    async getLeaderboard(limit: number = 10) {
        const { data, error } = await supabase
            .from('icfes_scores')
            .select(`
        id,
        total_correctas,
        total_intentos,
        porcentaje_acierto,
        student:students(full_name)
      `)
            .order('total_correctas', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    /**
     * Obtener estadísticas del estudiante
     */
    async getStudentStats(studentId: string) {
        const { data, error } = await supabase
            .from('icfes_scores')
            .select('*')
            .eq('student_id', studentId)
            .single();

        if (error) {
            // Si no existe, retornar objeto vacío
            if (error.code === 'PGRST116') {
                return {
                    total_correctas: 0,
                    total_intentos: 0,
                    porcentaje_acierto: 0
                };
            }
            throw error;
        }
        return data;
    }
};

// ================================================
// ADMIN SERVICE
// ================================================

export const AdminService = {
    /**
     * Obtener todos los profesores de un colegio
     */
    async getTeachers(schoolId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('role', 'docente')
            .eq('colegio_id', schoolId)
            .order('full_name');

        if (error) throw error;
        return data;
    },

    /**
     * Asignar profesor a grupo
     */
    async assignTeacherToGroup(teacherId: string, groupId: string) {
        const { error } = await supabase
            .from('docentes_grupos')
            .insert({ docente_id: teacherId, grupo_id: groupId });

        if (error) throw error;
    },

    /**
     * Cambiar rol de usuario
     */
    async updateUserRole(userId: string, newRole: string) {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) throw error;
    }
};

export const TeacherService = {
    /**
     * Obtener profesores de un grupo
     */
    async getByGroup(groupId: string) {
        // 1. Obtener IDs de docentes del grupo
        const { data: assignments, error: assignError } = await supabase
            .from('docentes_grupos')
            .select('docente_id')
            .eq('grupo_id', groupId);

        if (assignError) throw assignError;

        const teacherIds = assignments.map(a => a.docente_id);

        if (teacherIds.length === 0) return [];

        // 2. Obtener perfiles de esos docentes
        const { data: teachers, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', teacherIds)
            .order('full_name');

        if (profileError) throw profileError;
        return teachers;
    }
};

// ================================================
// COMMUNICATION SERVICE (NUEVO)
// ================================================

export const CommunicationService = {
    /**
     * Crear anuncio
     */
    async createAnnouncement(data: {
        teacher_id: string;
        title: string;
        description: string;
        event_date?: Date;
        type: 'homework' | 'exam' | 'event' | 'reminder';
        group_ids: string[];
    }) {
        // 1. Crear anuncio
        const { data: announcement, error: annError } = await supabase
            .from('announcements')
            .insert({
                teacher_id: data.teacher_id,
                title: data.title,
                description: data.description,
                event_date: data.event_date?.toISOString(),
                type: data.type
            })
            .select()
            .single();

        if (annError) throw annError;

        // 2. Asociar grupos
        const groupAssociations = data.group_ids.map(groupId => ({
            announcement_id: announcement.id,
            group_id: groupId
        }));

        const { error: groupError } = await supabase
            .from('announcement_groups')
            .insert(groupAssociations);

        if (groupError) throw groupError;

        return announcement;
    },

    /**
     * Obtener anuncios para un estudiante (basado en sus grupos)
     */
    async getStudentAnnouncements(studentId: string) {
        // Primero obtener el grupo del estudiante
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('grupo_id')
            .eq('id', studentId)
            .single();

        if (studentError) throw studentError;
        if (!student.grupo_id) return [];

        // Obtener anuncios de ese grupo
        const { data, error } = await supabase
            .from('announcement_groups')
            .select(`
                announcement:announcements (
                    id,
                    title,
                    description,
                    event_date,
                    type,
                    created_at,
                    teacher:profiles (full_name)
                )
            `)
            .eq('group_id', student.grupo_id)
            .order('created_at', { ascending: false, foreignTable: 'announcements' });

        if (error) throw error;
        // Aplanar respuesta
        return data.map(item => item.announcement).filter(Boolean);
    },

    /**
     * Obtener anuncios creados por un profesor
     */
    async getTeacherAnnouncements(teacherId: string) {
        const { data, error } = await supabase
            .from('announcements')
            .select(`
                *,
                groups:announcement_groups (
                    group:grupos (name)
                )
            `)
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Crear excusa médica
     */
    async createMedicalExcuse(data: {
        student_id: string;
        parent_id: string;
        date: Date;
        reason: string;
        file_url?: string;
        teacher_ids: string[]; // Nuevos destinatarios
    }) {
        // 1. Crear excusa
        const { data: result, error } = await supabase
            .from('medical_excuses')
            .insert({
                student_id: data.student_id,
                parent_id: data.parent_id,
                date: data.date.toISOString(),
                reason: data.reason,
                file_url: data.file_url,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Crear destinatarios
        if (data.teacher_ids.length > 0) {
            const recipients = data.teacher_ids.map(teacherId => ({
                excuse_id: result.id,
                teacher_id: teacherId
            }));

            const { error: recipientError } = await supabase
                .from('excuse_recipients')
                .insert(recipients);

            if (recipientError) throw recipientError;
        }

        return result;
    },

    /**
     * Obtener excusas para un profesor (de sus grupos)
     * Nota: Por simplicidad MVP, traemos todas y filtramos o confiamos en RLS si se ajustó.
     * Idealmente: Join con estudiantes -> grupos -> docentes_grupos
     */
    async getTeacherExcuses(teacherId: string) {
        // Obtener excusas donde el profesor es destinatario
        const { data, error } = await supabase
            .from('medical_excuses')
            .select(`
                *,
                student:students (full_name, grupo_id),
                parent:profiles (full_name),
                recipients:excuse_recipients!inner(teacher_id)
            `)
            .eq('recipients.teacher_id', teacherId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Actualizar estado de excusa
     */
    async updateExcuseStatus(excuseId: string, status: 'approved' | 'rejected', comment?: string) {
        const { error } = await supabase
            .from('medical_excuses')
            .update({ status, teacher_comment: comment })
            .eq('id', excuseId);

        if (error) throw error;
    },

    /**
     * Enviar alerta privada
     */
    async sendPrivateAlert(data: {
        teacher_id: string;
        student_id: string;
        parent_id: string;
        message: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
    }) {
        const { error } = await supabase
            .from('private_alerts')
            .insert(data);

        if (error) throw error;
    }
};
