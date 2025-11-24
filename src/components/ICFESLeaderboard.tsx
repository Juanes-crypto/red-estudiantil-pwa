// ================================================
// ICFES LEADERBOARD - Ranking de Estudiantes
// ================================================
// Top 10 estudiantes con diseño de podio épico
// ================================================

import { useState, useEffect } from 'react';
import { Loading, ErrorDisplay, EmptyState } from './ui';
import { ICFESService } from '../lib/services';

interface LeaderboardEntry {
    id: string;
    total_correctas: number;
    total_intentos: number;
    porcentaje_acierto: number;
    student: any;
}

export default function ICFESLeaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ICFESService.getLeaderboard(10) as any;
            setLeaderboard(data);
        } catch (err: any) {
            console.error('Error loading leaderboard:', err);
            setError('Error al cargar el ranking');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading text="Calculando posiciones..." />;
    if (error) return <ErrorDisplay error={error} onRetry={loadLeaderboard} />;

    if (leaderboard.length === 0) {
        return (
            <EmptyState
                icon="🏆"
                title="El Salón de la Fama está vacío"
                description="Sé el primero en grabar tu nombre en la historia."
            />
        );
    }

    const getPodiumStyle = (position: number) => {
        switch (position) {
            case 1:
                return {
                    gradient: 'from-yellow-300 via-yellow-500 to-yellow-700',
                    shadow: 'shadow-yellow-500/50',
                    scale: 'md:scale-110 md:-mt-8 z-10',
                    icon: '👑'
                };
            case 2:
                return {
                    gradient: 'from-slate-300 via-slate-400 to-slate-600',
                    shadow: 'shadow-slate-500/50',
                    scale: 'md:mt-4 z-0',
                    icon: '🥈'
                };
            case 3:
                return {
                    gradient: 'from-orange-300 via-orange-500 to-orange-800',
                    shadow: 'shadow-orange-500/50',
                    scale: 'md:mt-8 z-0',
                    icon: '🥉'
                };
            default:
                return {
                    gradient: 'from-zinc-700 to-zinc-800',
                    shadow: 'shadow-zinc-900/50',
                    scale: '',
                    icon: '🏅'
                };
        }
    };

    const getStudentName = (student: any): string => {
        if (!student) return 'Estudiante Anónimo';
        if (Array.isArray(student)) return student[0]?.full_name || 'Estudiante Anónimo';
        return student.full_name || 'Estudiante Anónimo';
    };

    return (
        <div className="space-y-12 pb-10">
            {/* Header Épico */}
            <div className="text-center space-y-2">
                <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                    Salón de la Fama
                </h2>
                <p className="text-zinc-400 text-lg">Los mentes más brillantes de la institución</p>
            </div>

            {/* Podio (Top 3) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start px-4">
                {/* Reordenar para que el 1 quede en el medio en desktop: [2, 1, 3] */}
                {[
                    leaderboard[1], // Plata (Izquierda)
                    leaderboard[0], // Oro (Centro)
                    leaderboard[2]  // Bronce (Derecha)
                ].map((entry) => {
                    if (!entry) return null; // Manejar caso de menos de 3 estudiantes

                    // Ajustar posición real basada en el índice del array original
                    const realPosition = entry === leaderboard[0] ? 1 : entry === leaderboard[1] ? 2 : 3;
                    const style = getPodiumStyle(realPosition);

                    return (
                        <div
                            key={entry.id}
                            className={`relative group transition-all duration-500 transform ${style.scale}`}
                        >
                            {/* Glow Effect */}
                            <div className={`absolute -inset-1 bg-gradient-to-r ${style.gradient} rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200`}></div>

                            <div className={`relative p-6 rounded-xl bg-gradient-to-br ${style.gradient} border border-white/10 shadow-2xl ${style.shadow}`}>
                                <div className="flex flex-col items-center text-center">
                                    <div className="text-6xl mb-4 drop-shadow-lg filter">{style.icon}</div>

                                    <div className="bg-black/20 px-3 py-1 rounded-full mb-3 backdrop-blur-sm">
                                        <span className="text-white font-bold tracking-wider text-sm">TOP {realPosition}</span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 w-full">
                                        {getStudentName(entry.student)}
                                    </h3>

                                    <div className="w-full h-px bg-white/20 my-3"></div>

                                    <div className="grid grid-cols-2 gap-2 w-full text-center">
                                        <div>
                                            <div className="text-2xl font-bold text-white">{entry.total_correctas}</div>
                                            <div className="text-xs text-white/80 uppercase tracking-wide">Aciertos</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">{entry.porcentaje_acierto.toFixed(0)}%</div>
                                            <div className="text-xs text-white/80 uppercase tracking-wide">Precisión</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lista del Resto (4-10) */}
            {leaderboard.length > 3 && (
                <div className="max-w-3xl mx-auto">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-4 bg-zinc-800/50 border-b border-zinc-700 flex justify-between items-center">
                            <h3 className="font-bold text-zinc-300">Aspirantes al Trono</h3>
                            <span className="text-xs text-zinc-500">Top 4 - 10</span>
                        </div>

                        <div className="divide-y divide-zinc-800">
                            {leaderboard.slice(3, 10).map((entry, index) => {
                                const position = index + 4;
                                return (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 font-bold group-hover:bg-cyan-900 group-hover:text-cyan-400 transition-colors">
                                                {position}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-zinc-200 group-hover:text-white transition-colors">
                                                    {getStudentName(entry.student)}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                    <span>{entry.total_intentos} intentos</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-zinc-300 group-hover:text-cyan-400 transition-colors">
                                                    {entry.total_correctas}
                                                </div>
                                                <div className="text-xs text-zinc-600">Aciertos</div>
                                            </div>
                                            <div className="w-16 text-right">
                                                <div className={`text-sm font-bold ${entry.porcentaje_acierto >= 80 ? 'text-green-400' :
                                                    entry.porcentaje_acierto >= 60 ? 'text-yellow-400' : 'text-red-400'
                                                    }`}>
                                                    {entry.porcentaje_acierto.toFixed(0)}%
                                                </div>
                                                <div className="text-xs text-zinc-600">Eficiencia</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
