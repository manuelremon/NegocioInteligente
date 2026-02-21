import { create } from 'zustand'
import type { RegisterSession } from '@renderer/types/ipc'

interface RegisterState {
  currentSession: RegisterSession | null
  setSession: (session: RegisterSession | null) => void
  clearSession: () => void
}

export const useRegisterStore = create<RegisterState>((set) => ({
  currentSession: null,
  setSession: (session) => set({ currentSession: session }),
  clearSession: () => set({ currentSession: null })
}))
