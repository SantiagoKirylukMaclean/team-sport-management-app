import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anon) {
  console.error('Variables de entorno de Supabase no configuradas correctamente')
  console.error('VITE_SUPABASE_URL:', url ? 'Configurada' : 'Faltante')
  console.error('VITE_SUPABASE_ANON_KEY:', anon ? 'Configurada' : 'Faltante')
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
