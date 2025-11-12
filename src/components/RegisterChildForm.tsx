// 1. Imports
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

// 2. Definimos las "Props" (propiedades) que este componente
// necesita para funcionar. ¡Necesita saber quién es el padre!
interface Props {
  parentId: string; // Recibiremos el ID del padre que está logueado
  onChildRegistered: () => void;
}

export default function RegisterChildForm({ parentId, onChildRegistered }: Props) {
  // 3. Estados para el formulario
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
      // 5. ¡AQUÍ! Insertamos en la tabla 'students'
      // ¡Usando las Políticas que creamos en el PASO 25!
      const { error } = await supabase.from("students").insert({
        full_name: fullName,
        document_number: docNumber,
        parent_id: parentId, // ¡La conexión clave!
      });

      if (error) {
        // Si el error es por "UNIQUE constraint" (documento duplicado)
        if (error.message.includes("duplicate key")) {
          throw new Error("Ese número de documento ya está registrado.");
        }
        throw error;
      }

      // ¡Éxito!
      setMessage("¡Hijo registrado con éxito!");
      setFullName(""); // Limpiamos el formulario
      setDocNumber("");
      onChildRegistered();
    } catch (error: any) {
      console.error(error.message);
      setMessage(`Error: ${error.message}`);
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
            type="text" // Sigue siendo 'text' para evitar flechas
            // --- MAGIA NUEVA AQUÍ ---
            inputMode="numeric" // Pide el TECLADO NUMÉRICO en celulares
            pattern="[0-9]*" // Regla: Solo acepta dígitos del 0 al 9
            // --- FIN DE LA MAGIA ---

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
          disabled={loading} // Se deshabilita mientras carga
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
