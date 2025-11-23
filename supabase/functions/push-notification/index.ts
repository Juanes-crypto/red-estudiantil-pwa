// supabase/functions/push-notification/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

console.log("🤖 El Robot de Notificaciones se ha despertado!");

// 1. CREDENCIALES HARDCODED (Para eliminar cualquier error de lectura de archivo)
// COPIA Y PEGA AQUÍ EL CONTENIDO DE TU service-account.json
const serviceAccount = {
  "type": "service_account",
  "project_id": "pwa-colegial-notificacio-ecb35",
  "private_key_id": "f7b67e22-ecd8-4b2f-831a-78689bc31a22",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqpGsdl1TdZSzM\nGk3RXMZ1lGokaQOOeK8NBMb5iK2mb3v35GEmeSFSrW1c1JPZdYtcVF6a0CL96W2E\ngOd/503xFar5NngIKSmhXdXqF3Ckede3qWY363kM1CFG3vCWFIkAkBVo+F7XfuDu\n85xoUWgun2DJgZcs0MZ4qrJ5N0zgy/QwqXsy59iOhjzcdnL26hOtyuM0dN0t94Zx\nrXKjdJkk3s0q0MyYUerF2hFnP72YKENwQw8BI5rx2ePA0aLNwtbP2bmk2tbxStzJ\n0W6AQLdNzL0ilUe2UNjzgLpdDWMWcxdapFfIRpxM0TEJS7DrCq37J/gxTWQMSqDr\nNHMAhFFhAgMBAAECggEAAzKroAiLAM8syyWfDOv/lPDs5rVh6XsEUZ3ws99GdqNv\n0x7gXZ4D7HTvL/MuUvMrlm8tirP/dxS3bOlH7V/o8dPlhvm1v1ya7B91d9Q5BzJ4\nj9372jmhsVNBM5icytZw4gxq0LNlS59g5cZPYxRLe7wyGyfZ+aJvMpAeyIjE+kPj\nlBIi/GUmUG1xaySj6EQ3ZQtTNf/W3pz92zJuD7f7gIVCgImRr4W2FdV+pMKK/YLD\ngm9ccLycX7JeGjkkqhUwQL2/wLhKMjUTyXBMhpbYpB4xq/KJ8wFR9rrG60FubNRj\nKZ3sA4fDlWDjV8xUPLsn1NmONxKx7awR/q46dkQ+ZQKBgQDho8+9I9GiygCKCWPG\nFR8c9O0pannQ78kElc1nEo5jOv7P8bgOMGLBmqQHk0BEgHFH96VnhEhv/xaWMCp9\ny4W19FiL/pt8UGwCUGrqPNqwMP79OqI1FlzFOBI9NU64gtl1JiAL40lc4KhelA8c\n+jrCwVh8EiCs4CTdlKV9/mvvVwKBgQDBmjVGeRw7W8WNrysNPXp+u/e6GLeKyzIz\n8r5O5rlEhjWRYRnyqZeIegugY+eDa3k9VkBCdazfQ5CHQwWsJxQ/LbYEksVP2ld0\nhnjodeMqeHdVqHU9valsDnwG7I9AWGbm8jeAqMw95F6yt1ZVRcWWmZwnkxVULDCB\nG5EC/seqBwKBgApLXPj2H2Rb7vZdQ04QPKEnk4JmNzSPHA63fu2K7TAdyu5Vyt3q\n2zaWBZHK6A24BnMQG13DrUJe0vr7K5UdqfYJNdj9Pr7HNIZOgPI64IdVVOzctfXS\nFV1yF3Lvca39Wkp7+M5SClDQdx4Jhz79M50bERxn/1Gj0ErDs2EyMF51AoGAVqxP\nBYna1cg0HUY6o+bOHEbSlQHTydNGWnNmN7SbZM4g1UD/eN/r8zGQWvHfB7rpwEgI\n5LgB+MIqxiN/Op8UNWSlhE6g/yrk1EoPfyKn3K+p3TNZqZZrbvDdHcxyJYBuMR5n\nMrZfGaZPrvrdL7fYyZ9jhWQXvGM8I9DPjuO5R6kCgYEA0uY2Z+GWtvlZ+apNMO00\nxCQBZkb+IEbUnnq9SSo6dz+zLy7RY4NatsrckhRV/rZcmy9YF5vEQp9PbH3NYWIk\nsRg3OtKG9cN+lB+hQ5lgkbi2ObhfnPhp98kaYLk3SKyRUUZmso4Nudl3xeyS9wO4\n05jInriCb9JAtJrQzcIadHM=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@pwa-colegial-notificacio-ecb35.iam.gserviceaccount.com"
};

// Función auxiliar para convertir PEM a Binario (La medicina para el error ASN.1)
function pemToBinary(pem: string) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  try {
    const { record } = await req.json();

    if (!record) {
      return new Response("No hay registro para procesar", { status: 200 });
    }

    console.log(`📝 Nueva asistencia recibida: ${record.status} para estudiante ${record.student_id}`);

    // --- CLIENTE SUPABASE ---
    const supabaseUrl = Deno.env.get("MY_SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("MY_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- BUSCAR DATOS ---
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("full_name, parent_id")
      .eq("id", record.student_id)
      .single();

    if (studentError || !student) {
      console.error("❌ Error buscando estudiante:", studentError?.message);
      return new Response("Error buscando estudiante", { status: 400 });
    }

    const { data: parent, error: parentError } = await supabase
      .from("profiles")
      .select("fcm_token")
      .eq("id", student.parent_id)
      .single();

    if (parentError || !parent || !parent.fcm_token) {
      console.log(`⚠️ El padre no tiene token configurado.`);
      return new Response("Padre sin token", { status: 200 });
    }

    // --- BUSCAR NOMBRE DEL PROFESOR ---
    const { data: teacher, error: teacherError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", record.teacher_id)
      .single();

    if (teacherError || !teacher) {
      console.warn("⚠️ No se pudo obtener el nombre del profesor:", teacherError?.message);
    }

    // --- AUTENTICACIÓN GOOGLE (CORREGIDO) ---

    // 1. Preparamos la llave
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      pemToBinary(serviceAccount.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // 2. Creamos el JWT
    // ¡AQUÍ ESTABA MI ERROR ANTES! Pasaba { key: cryptoKey } en vez de cryptoKey directo.
    const jwt = await create(
      { alg: "RS256", typ: "JWT" },
      {
        iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        exp: getNumericDate(60 * 60),
        iat: getNumericDate(0),
      },
      cryptoKey // <--- ¡CORRECCIÓN MAESTRA! Sin llaves { } rodeándolo
    );

    // --- OBTENER ACCESS TOKEN ---
    const googleAuthResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const googleAuthData = await googleAuthResponse.json();
    const accessToken = googleAuthData.access_token;

    if (!accessToken) {
      console.error("❌ Fallo autenticación Google:", googleAuthData);
      return new Response("Fallo autenticación Google", { status: 500 });
    }

    // --- ENVIAR NOTIFICACIÓN ---
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

    // Construir mensaje con nombre del profesor
    const statusText = record.status === 'tarde' ? 'llegó tarde' : 'faltó';
    const teacherName = teacher?.full_name || 'Un profesor';
    const notificationBody = `${student.full_name} ${statusText} a la clase. Profesor: ${teacherName}`;

    const mensaje = {
      message: {
        token: parent.fcm_token,
        notification: {
          title: `🔔 Alerta de Asistencia`,
          body: notificationBody,
        },
        // Añadimos URL para que al hacer clic abra la app
        webpush: {
          fcm_options: {
            link: Deno.env.get("APP_URL") || "https://red-estudiantil-pwa.vercel.app"
          }
        }
      },
    };

    const fcmResponse = await fetch(fcmUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mensaje),
    });

    const fcmResult = await fcmResponse.json();
    console.log("✅ Notificación enviada a Firebase:", fcmResult);

    return new Response(JSON.stringify(fcmResult), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Error general en la función:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});