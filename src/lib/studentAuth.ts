// ================================================
// CUSTOM STUDENT AUTHENTICATION
// ================================================
// Sistema de autenticación custom para estudiantes
// NO usa Supabase Auth - solo documento + contraseña
// ================================================

import bcrypt from 'bcryptjs';
import { supabase } from './supabaseClient';

export interface StudentSession {
    studentId: string;
    studentName: string;
    sessionToken: string;
    expiresAt: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

/**
 * Student login with document + password
 */
export async function studentLogin(document: string, password: string): Promise<StudentSession> {
    // 1. Find student by document
    const { data: student, error } = await supabase
        .from('students')
        .select('id, full_name, password_hash')
        .eq('document_number', document)
        .single();

    if (error || !student) {
        throw new Error('Documento no encontrado');
    }

    if (!student.password_hash) {
        throw new Error('Este estudiante aún no tiene contraseña configurada');
    }

    // 2. Verify password
    const isValid = await verifyPassword(password, student.password_hash);
    if (!isValid) {
        throw new Error('Contraseña incorrecta');
    }

    // 3. Generate session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // 4. Create session in database
    const { error: sessionError } = await supabase
        .from('student_sessions')
        .insert({
            student_id: student.id,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString()
        });

    if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw new Error('Error al crear la sesión');
    }

    return {
        studentId: student.id,
        studentName: student.full_name,
        sessionToken,
        expiresAt: expiresAt.toISOString()
    };
}

/**
 * Get current student session from localStorage
 */
export function getCurrentSession(): StudentSession | null {
    try {
        const session = localStorage.getItem('student_session');
        if (!session) return null;

        const parsed: StudentSession = JSON.parse(session);

        // Check if expired
        if (new Date(parsed.expiresAt) < new Date()) {
            studentLogout();
            return null;
        }

        return parsed;
    } catch (error) {
        console.error('Error parsing session:', error);
        studentLogout();
        return null;
    }
}

/**
 * Save session to localStorage
 */
export function saveSession(session: StudentSession): void {
    localStorage.setItem('student_session', JSON.stringify(session));
}

/**
 * Student logout - clear session
 */
export function studentLogout(): void {
    const session = getCurrentSession();

    // Delete session from database
    if (session) {
        supabase
            .from('student_sessions')
            .delete()
            .eq('session_token', session.sessionToken)
            .then(() => console.log('Session deleted from DB'));
    }

    // Clear localStorage
    localStorage.removeItem('student_session');
}

/**
 * Verify if current session is valid
 */
export async function verifySession(): Promise<boolean> {
    const session = getCurrentSession();
    if (!session) return false;

    // Check in database
    const { data, error } = await supabase
        .from('student_sessions')
        .select('id')
        .eq('session_token', session.sessionToken)
        .eq('student_id', session.studentId)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (error || !data) {
        studentLogout();
        return false;
    }

    return true;
}
