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
    // --- IDENTIFICAR TIPO DE NOTIFICACIÓN ---
    // Caso A: Excusa Médica (record tiene excuse_id)
    if (record.excuse_id) {
      console.log(`📝 Nueva excusa asignada a docente: ${record.teacher_id}`);

      // 1. Obtener datos del docente (Token FCM)
      const { data: teacher, error: teacherError } = await supabase
        .from("profiles")
        .select("fcm_token, full_name")
        .eq("id", record.teacher_id)
        .single();

      if (teacherError || !teacher || !teacher.fcm_token) {
        console.log(`⚠️ El docente no tiene token configurado.`);
        return new Response("Docente sin token", { status: 200 });
      }

      // 2. Obtener datos de la excusa y estudiante
      const { data: excuse, error: excuseError } = await supabase
        .from("medical_excuses")
        .select(`
          reason,
          date,
          student:students(full_name)
        `)
        .eq("id", record.excuse_id)
        .single();

      if (excuseError || !excuse) {
        console.error("❌ Error buscando excusa:", excuseError?.message);
        return new Response("Error buscando excusa", { status: 400 });
      }

      // 3. Construir mensaje
      const notificationBody = `Nueva excusa de ${excuse.student.full_name}. Motivo: ${excuse.reason.substring(0, 50)}${excuse.reason.length > 50 ? '...' : ''}`;

      const mensaje = {
        message: {
          token: teacher.fcm_token,
          notification: {
            title: `🏥 Nueva Excusa Médica`,
            body: notificationBody,
          },
          webpush: {
            fcm_options: {
              link: Deno.env.get("APP_URL") || "https://red-estudiantil-pwa.vercel.app"
            }
          }
        },
      };

      // 4. Enviar a Firebase (Reutilizamos lógica de abajo)
      await sendToFirebase(mensaje, accessToken, serviceAccount.project_id);
      return new Response("Notificación de excusa enviada", { status: 200 });
    }

    // Caso B: Asistencia (record tiene status)
    if (record.status) {
      console.log(`📝 Nueva asistencia recibida: ${record.status} para estudiante ${record.student_id}`);

      // 1. Buscar Estudiante y Padre
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

      // 2. Buscar Profesor
      const { data: teacher, error: teacherError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", record.teacher_id)
        .single();

      // 3. Construir mensaje
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
          webpush: {
            fcm_options: {
              link: Deno.env.get("APP_URL") || "https://red-estudiantil-pwa.vercel.app"
            }
          }
        },
      };

      // 4. Enviar
      await sendToFirebase(mensaje, accessToken, serviceAccount.project_id);
      return new Response("Notificación de asistencia enviada", { status: 200 });
    }

    return new Response("Tipo de registro no manejado", { status: 200 });

  } catch (error) {
    console.error("❌ Error general en la función:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// Función auxiliar para enviar a Firebase y limpiar el código principal
async function sendToFirebase(mensaje: any, accessToken: string, projectId: string) {
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

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
  return fcmResult;
}
