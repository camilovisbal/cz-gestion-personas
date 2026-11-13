import { createContext, useContext } from 'react'

// Contexto de interfaz: abrir el perfil de una persona desde cualquier vista.
export const UiCtx = createContext({ verPersona: () => {} })
export const useUi = () => useContext(UiCtx)
