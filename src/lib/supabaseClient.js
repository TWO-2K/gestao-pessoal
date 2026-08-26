import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const REMEMBER_KEY = 'sb-remember-me'

// Sem preferência salva ainda, mantém o comportamento padrão de sempre
// lembrar (sessão em localStorage), igual ao que já existia antes do checkbox.
function isRemembering() {
  const v = localStorage.getItem(REMEMBER_KEY)
  return v === null ? true : v === 'true'
}

export function setRememberAccess(remember) {
  localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false')
}

// Storage híbrido: quando "lembrar acesso" está marcado a sessão vai para
// localStorage (sobrevive ao fechar o navegador); quando desmarcado vai para
// sessionStorage (some ao fechar a aba/navegador).
const hybridStorage = {
  getItem: (key) => localStorage.getItem(key) ?? sessionStorage.getItem(key),
  setItem: (key, value) => {
    if (isRemembering()) {
      localStorage.setItem(key, value)
      sessionStorage.removeItem(key)
    } else {
      sessionStorage.setItem(key, value)
      localStorage.removeItem(key)
    }
  },
  removeItem: (key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: hybridStorage },
})