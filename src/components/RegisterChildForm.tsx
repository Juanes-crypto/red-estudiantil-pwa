// 1. Imports
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

// 2. Definimos las "Props"
interface Props {
  parentId: string;
  colegioId: string; // --- ¡NUEVA PROP OBLIGATORIA! ---
  onChildRegistered: () => void;
}

export default function RegisterChildForm({ parentId, colegioId, onChildRegistered }: Props) {
  // 3. Estados
  const [fullName, setFullName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 4. Función de envío
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Importar la función de hash dinámicamente
      const { hashPassword } = await import('../lib/studentAuth');

      // Generar hash de la contraseña (contraseña inicial = documento)
      const passwordHash = await hashPassword(docNumber);

      // Crear registro del estudiante con contraseña hasheada
      const { error: studentError } = await supabase.from("students").insert({
        full_name: fullName,
        document_number: docNumber,
        password_hash: passwordHash,
        parent_id: parentId,
        colegio_id: colegioId,
      });

      if (studentError) {
        if (studentError.message.includes("duplicate key")) {
          throw new Error("Ese número de documento ya está registrado.");
        }
        throw studentError;
      }

      // ¡Éxito!
      setMessage("¡Hijo registrado! Puede ingresar con su documento como contraseña.");
      setFullName("");
      setDocNumber("");
      onChildRegistered();

    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Mensaje:', error.message);
      console.error('Código:', error.code);
      setMessage(`Error: ${error.message || 'Error desconocido al registrar'}`);
    } finally {
      setLoading(false);
    }
  };

  // 6. El JSX (HTML) del formulario
  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre Completo */}
        <div>
          <label
            htmlFor="fullName"
            className="mb-2 block text-sm font-bold text-slate-700 uppercase tracking-wide"
          >
            Nombre Completo del Estudiante
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
            placeholder="Ej: Juan Pérez"
            required
          />
        </div>

        {/* Documento */}
        <div>
          <label
            htmlFor="docNumber"
            className="mb-2 block text-sm font-bold text-slate-700 uppercase tracking-wide"
          >
            Número de Documento
          </label>
          <input
            id="docNumber"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
            placeholder="Ej: 123456789"
            required
          />
        </div>

        {/* Botón */}
        <button
          type="submit"
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all duration-200"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Registrando...
            </span>
          ) : "Registrar Hijo"}
        </button>

        {/* Mensaje de feedback */}
        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium text-center ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}