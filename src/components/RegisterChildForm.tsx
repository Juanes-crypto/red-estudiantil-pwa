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
    <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-6 shadow-md">
      <form onSubmit={handleSubmit}>
        {/* Nombre Completo */}
        <div className="mb-4">
          <label
            htmlFor="fullName"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Nombre Completo del Estudiante
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-700 p-2.5 text-white"
            required
          />
        </div>

        {/* Documento */}
        <div className="mb-6">
          <label
            htmlFor="docNumber"
            className="mb-2 block text-sm font-medium text-zinc-300"
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
            className="w-full rounded-lg border border-zinc-600 bg-zinc-700 p-2.5 text-white"
            required
          />
        </div>

        {/* Botón */}
        <button
          type="submit"
          className="w-full rounded-lg bg-cyan-600 px-5 py-2.5 text-center font-medium text-white hover:bg-cyan-700"
          disabled={loading}
        >
          {loading ? "Registrando..." : "Registrar Hijo"}
        </button>

        {/* Mensaje de feedback */}
        {message && (
          <p className="mt-4 text-center text-sm font-medium text-green-400">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}