// ================================================
// CUSTOM HOOKS - Separación de lógica (SOLID)
// ================================================
// Hooks reutilizables que siguen principio de Single Responsibility
// ================================================

import { useState, useEffect, useCallback } from 'react';
import { AttendanceService, StudentService, ProfileService } from '../lib/services';

// ================================================
// HOOK: useStudents (para padres)
// ================================================

export function useStudents(parentId: string) {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await StudentService.getByParent(parentId);
            setStudents(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [parentId]);

    useEffect(() => {
        if (parentId) {
            fetchStudents();
        }
    }, [parentId, fetchStudents]);

    return { students, loading, error, refetch: fetchStudents };
}

// ================================================
// HOOK: useAttendance (historial de asistencia)
// ================================================

export function useAttendance(studentId: string | null) {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!studentId) return;

        const fetchAttendance = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await AttendanceService.getByStudent(studentId);
                setAttendance(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [studentId]);

    return { attendance, loading, error };
}

// ================================================
// HOOK: useAttendanceStats (estadísticas)
// ================================================

export function useAttendanceStats(studentId: string | null) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!studentId) return;

        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await AttendanceService.getStats(studentId);
                setStats(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [studentId]);

    return { stats, loading, error };
}

// ================================================
// HOOK: useProfile (perfil del usuario)
// ================================================

export function useProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await ProfileService.getCurrent();
                setProfile(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const updateFCMToken = useCallback(async (token: string) => {
        if (!profile) return;
        try {
            await ProfileService.updateFCMToken(profile.id, token);
        } catch (err: any) {
            console.error('Error updating FCM token:', err);
        }
    }, [profile]);

    return { profile, loading, error, updateFCMToken };
}

// ================================================
// HOOK: useGroupStudents (estudiantes de un grupo)
// ================================================

export function useGroupStudents(groupId: string | null) {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!groupId) return;

        const fetchStudents = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await StudentService.getByGroup(groupId);
                setStudents(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [groupId]);

    return { students, loading, error };
}

// ================================================
// HOOK: useMarkAttendance (para profesores)
// ================================================

export function useMarkAttendance() {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const markAttendance = useCallback(async (
        studentId: string,
        teacherId: string,
        status: 'presente' | 'tarde' | 'falta'
    ) => {
        try {
            setSubmitting(true);
            setError(null);
            await AttendanceService.create({
                student_id: studentId,
                teacher_id: teacherId,
                status
            });
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setSubmitting(false);
        }
    }, []);

    return { markAttendance, submitting, error };
}

// ================================================
// HOOK: useDebounce (utilidad)
// ================================================

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
