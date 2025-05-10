// lib/axios.ts
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store'; // Ajusta la ruta si es necesario

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api', // Asegúrate de tener NEXT_PUBLIC_API_URL en .env.local
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para añadir el token a las peticiones
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token; // Acceder al token desde el store de Zustand
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Opcional: Interceptor para manejar errores 401 (token expirado/inválido)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Si el error es 401, desloguear al usuario y redirigir a login
            // Esto es un efecto secundario, podría manejarse mejor en el componente que hace la llamada
            // o con un listener global de eventos.
            console.error('Interceptor: Error 401 - No autorizado o token expirado');
            useAuthStore.getState().logout(); // Llama a la acción de logout
            // Considera redirigir aquí o dejar que el layout/componente lo haga
            // window.location.href = '/admin/login'; // Evita usar window.location directamente en Next.js si puedes
        }
        return Promise.reject(error);
    }
);


export default apiClient;