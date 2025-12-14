import fs from 'fs';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importCSV(filePath, modulo) {
    try {
        const absolutePath = path.resolve(filePath);
        if (!fs.existsSync(absolutePath)) {
            console.error(`❌ Error: El archivo ${absolutePath} no existe.`);
            return;
        }

        const csvFile = fs.readFileSync(absolutePath, 'utf8');
        const { data, errors } = Papa.parse(csvFile, {
            header: true,
            skipEmptyLines: true
        });

        if (errors.length > 0) {
            console.warn('⚠️ Advertencia: Errores al parsear CSV:', errors);
        }

        console.log(`⏳ Importando ${data.length} preguntas de ${modulo}...`);

        let count = 0;
        for (const row of data) {
            // Validar datos mínimos
            if (!row.enunciado || !row.respuesta_correcta) {
                console.warn(`⚠️ Saltando fila incompleta: ${JSON.stringify(row)}`);
                continue;
            }

            const { error } = await supabase.from('icfes_questions').insert({
                modulo,
                enunciado: row.enunciado,
                opcion_a: row.opcion_a,
                opcion_b: row.opcion_b,
                opcion_c: row.opcion_c,
                opcion_d: row.opcion_d,
                respuesta_correcta: row.respuesta_correcta.toUpperCase().trim(),
                explicacion: row.explicacion,
                year: parseInt(row.year) || new Date().getFullYear()
            });

            if (error) {
                console.error(`❌ Error insertando pregunta: ${error.message}`);
            } else {
                count++;
            }
        }

        console.log(`✅ Éxito: ${count} preguntas importadas para ${modulo}.`);
    } catch (err) {
        console.error('❌ Error inesperado:', err);
    }
}

// Ejecutar importación
async function main() {
    await importCSV('./data/matematicas.csv', 'matematicas');
    // Puedes agregar más llamadas aquí para otros módulos
}

main();
