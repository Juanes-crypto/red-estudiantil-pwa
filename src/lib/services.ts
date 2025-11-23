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
            .select('id, full_name, grupo_id, grupos(nombre)')
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
          nombre,
          grado
        )
      `)
            .eq('teacher_id', teacherId);

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
            .order('nombre', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Crear nuevo grupo
     */
    async create(data: {
        nombre: string;
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
    async getRandomQuestion(modulo: string) {
        const { data, error } = await supabase
            .from('icfes_questions')
            .select('*')
            .eq('modulo', modulo)
            .order('id', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;
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
            .insert({ teacher_id: teacherId, grupo_id: groupId });

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
