// store/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '@/lib/axios'; // Ajusta la ruta
import axios from 'axios';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string | null; // El rol podría ser null si algo falla
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean; // Para manejar estados de carga durante login/logout
    isVerifying: boolean; // Para manejar la verificación del token
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    verifyCurrentUser: () => Promise<void>; // Función para validar/refrescar el token
    //loadUserFromStorage: () => void; // Para cargar al inicio de la app
    // setUserAndToken: (user: User, token: string) => void; // Helper si es necesario
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            isVerifying: true, // Comenzar en true, ya que `onRehydrateStorage` llamará a verifyCurrentUser

            login: async (email, password) => {
                set({ isLoading: true, isVerifying: false }); // Cuando se intenta login, no estamos verificando token previo
                try {
                    const response = await apiClient.post<{ user: User; token: string; message: string }>(
                        '/auth/login',
                        { email, password }
                    );
                    const { user, token } = response.data;
                    set({ user, token, isAuthenticated: true, isLoading: false });
                    console.log('Login exitoso (store):', user);
                } catch (error) {
                    let errorMessage = 'Error desconocido durante el login.';
                    if (axios.isAxiosError(error)) {
                        errorMessage = error.response?.data?.message || error.message || errorMessage;
                    } else if (error instanceof Error) {
                        errorMessage = error.message;
                    }
                    console.error('Error en login (store):', errorMessage, error);
                    set({ isLoading: false, user: null, token: null, isAuthenticated: false, isVerifying: false }); // Limpiar en error de login
                    throw new Error(errorMessage);
                }
            },

            logout: () => {
                console.log('Ejecutando logout (store)');
                set({ 
                    user: null, 
                    token: null, 
                    isAuthenticated: false, 
                    isLoading: false, 
                    isVerifying: false });
                // `persist` middleware limpiará de localStorage porque token es null
                // Si tienes una llamada API para invalidar token en backend, hazla aquí.
            },
            
            verifyCurrentUser: async () => {
                const token = get().token;
                if (!token) {
                    console.log('verifyCurrentUser: No hay token, estableciendo isVerifying a false.');
                    set({ 
                        user: null, 
                        isAuthenticated: false, 
                        isVerifying: false, 
                    });
                    return;
                }

                // No establecer isLoading a true aquí, usamos isVerifying para este propósito específico
                // set({ isVerifying: true }); // Ya está en true o lo establece onRehydrateStorage

                try {
                    console.log('verifyCurrentUser: Intentando verificar token con /auth/me');
                    // El interceptor de apiClient ya debería añadir el token a la cabecera
                    const response = await apiClient.get<{ user: User }>('/auth/me');
                    set({ user: response.data.user, isAuthenticated: true, isVerifying: false });
                    console.log('verifyCurrentUser: Usuario verificado y cargado:', response.data.user);
                } catch (error) {
                    let errorMessage = 'Error verificando el token.';
                     if (axios.isAxiosError(error)) {
                        errorMessage = error.response?.data?.message || error.message || errorMessage;
                    } else if (error instanceof Error) {
                        errorMessage = error.message;
                    }
                    console.error('verifyCurrentUser: Error, deslogueando.', errorMessage, error);
                    // Si /auth/me falla (ej. 401), el token no es válido o ha expirado
                    set({ user: null, token: null, isAuthenticated: false, isVerifying: false });
                }
            },
        }),
        {
            name: 'auth-storage', // Nombre de la clave en localStorage
            storage: createJSONStorage(() => localStorage), // Usar localStorage
            partialize: (state) => ({ // Solo persistir user y token
                user: state.user,
                token: state.token,
                // isAuthenticated se derivará de la presencia de token y la verificación
            }),
            onRehydrateStorage: () => {
                // Esta función se llama después de que el estado ha sido rehidratado.
                // No devuelve nada y no debe modificar el estado directamente aquí.
                // Su propósito es permitir efectos secundarios después de la rehidratación.
                return (state, error) => {
                    if (error) {
                        console.error("Error durante la rehidratación de auth-storage:", error);
                        // Podrías querer limpiar el estado si hay un error grave de rehidratación.
                        // state?.logout(); // No puedes llamar a logout así directamente aquí
                        useAuthStore.getState().logout(); // Llama a logout si hay error de rehidratación
                    } else {
                        console.log("Rehidratación de auth-storage completada. Estado actual:", state);
                        // Iniciar la verificación del usuario actual.
                        // Ponemos un timeout muy corto para asegurar que la rehidratación
                        // y el renderizado inicial no se bloqueen.
                        setTimeout(() => {
                            console.log("Llamando a verifyCurrentUser post-rehidratación.");
                            useAuthStore.getState().verifyCurrentUser();
                        }, 10); // Un timeout pequeño
                    }
                };
            }
        }
    )
);

// Inicializa isVerifying a true la primera vez que se carga el store en el cliente,
// antes de que onRehydrateStorage pueda ser llamado si no hay nada en localStorage.
// O confía en el onRehydrateStorage y el valor inicial de isVerifying.
//if (typeof window !== 'undefined') {
    // Esta llamada puede ser redundante si onRehydrateStorage lo maneja,
    // pero asegura que isVerifying se establece correctamente si no hay rehidratación.
    // Si el token ya está y es válido, verifyCurrentUser lo manejará.
    // Si no hay token, verifyCurrentUser pondrá isVerifying a false.
    // useAuthStore.getState().verifyCurrentUser(); // Considera si es necesario aquí además de onRehydrateStorage
//}