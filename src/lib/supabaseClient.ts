import { createClient } from '@supabase/supabase-js'

// Obtenemos las variables de entorno que guardamos en .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ¡Creamos y exportamos la "tubería" (el cliente)!
export const supabase = createClient(supabaseUrl, supabaseAnonKey)