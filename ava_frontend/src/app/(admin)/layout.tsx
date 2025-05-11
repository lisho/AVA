// src/app/(admin)/layout.tsx
'use client';

import { useEffect, ReactNode } from 'react'; // ReactNode importado
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Toaster, toast } from 'sonner'; // Importa toast también
import AdminNavbar from '@/components/admin/AdminNavbar'; 
import AdminSidebar from '@/components/admin/AdminSidebar'; 
import { Loader2 } from 'lucide-react'; 

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { 
        isAuthenticated, 
        user, 
        isLoading: authOperationLoading,
        isVerifying,
        logout // Obtener logout del store
    } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        console.log('[AdminLayout] Effect | Path:', pathname, '| isAuth:', isAuthenticated, '| Role:', user?.role, '| isVerifying:', isVerifying, '| authLoading:', authOperationLoading);

        // 1. Esperar si se está verificando o si una operación de login/logout está en curso
        if (isVerifying || authOperationLoading) {
            console.log('[AdminLayout] Waiting (isVerifying or authOperationLoading)');
            return;
        }

        const isLoginPage = pathname === '/login'; // Asumimos que /login es la única página de login manejada por este layout

        // 2. Si NO está autenticado
        if (!isAuthenticated) {
            if (!isLoginPage) {
                console.log('[AdminLayout] Not authenticated & not on login page -> Redirecting to /login');
                router.push('/login');
            } else {
                console.log('[AdminLayout] Not authenticated, on login page. Rendering login page.');
                // Permite que LoginPage se renderice
            }
            return; // No hay más que hacer si no está autenticado
        }

        // 3. Si ESTÁ autenticado
        // A partir de aquí, sabemos que isAuthenticated es true y tenemos un 'user'
        if (user?.role === 'admin') {
            // Usuario es ADMIN
            if (isLoginPage) {
                console.log('[AdminLayout] Admin on login page -> Redirecting to /admin_dashboard');
                router.push('/admin_dashboard'); // O tu ruta de admin dashboard
            } else {
                console.log('[AdminLayout] Admin authenticated and on an admin page. Access granted.');
                // Permanece, está en una página de admin (que no es login)
            }
        } else {
            // Usuario está autenticado PERO NO ES ADMIN (ej. trabajador_social)
            if (!isLoginPage) {
                // Si un no-admin intenta acceder a una ruta de admin que NO es /login
                console.log(`[AdminLayout] Non-admin (role: ${user?.role}) on admin path: ${pathname}. Denying & logging out.`);
                toast.error("Acceso denegado a la sección de administración.");
                logout(); // Desloguear para limpiar sesión inválida para esta sección
                // router.push('/login'); // No es necesario redirigir aquí, el logout cambiará isAuthenticated y el efecto se re-ejecutará
            } else {
                // Es un no-admin EN la página de login.
                // LoginPage se encargará de redirigirlo a su dashboard (/dashboard).
                // AdminLayout no debe interferir aquí.
                console.log(`[AdminLayout] Non-admin (role: ${user?.role}) on login page. LoginPage will handle redirection.`);
            }
        }
    }, [isAuthenticated, user, authOperationLoading, isVerifying, router, pathname, logout]); // Añade logout a las dependencias

    // --- Lógica de Renderizado Condicional ---

    // A. Loader principal mientras se verifica o una operación de auth está en curso
    if (isVerifying || authOperationLoading) {
        // Excepción: si está en login y es authOperationLoading (login en progreso), LoginPage muestra su propio loader.
        if (pathname === '/login' && authOperationLoading && !isVerifying) {
            console.log('[AdminLayout] Render: LoginPage (children) - authOp in progress on login');
            return <>{children}<Toaster richColors /></>; // Permite que LoginPage renderice su loader
        }
        console.log('[AdminLayout] Render: Global Loader (isVerifying or authOpLoading)');
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-gray-700">Cargando...</p>
                <Toaster richColors />
            </div>
        );
    }

    // B. Si estamos en la página de login y el usuario NO está autenticado (después de verificación)
    if (/*!isAuthenticated && */pathname === '/login') {
        console.log('[AdminLayout] Render: LoginPage (children) - Not authenticated on login page');
        return <>{children}<Toaster richColors /></>;
    }

    // C. Si está autenticado, es admin, y NO está en la página de login: Muestra el Layout de Admin
    //    (Si era admin en login, el useEffect ya lo habrá redirigido)
    if (isAuthenticated && user?.role === 'admin' /*&& pathname !== '/login'*/) {
        console.log('[AdminLayout] Render: Full Admin Layout for path:', pathname);
        return (
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
                <AdminSidebar /> 
                <div className="flex-1 flex flex-col overflow-hidden"> 
                    <AdminNavbar />  
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-gray-800 p-6"> 
                        {children}
                    </main> 
                </div> 
                <Toaster richColors position="top-right" />
            </div>
        );
    }
    
    // D. Fallback / Estado Intermedio de Redirección o Acceso Denegado para no-admins en páginas de admin
    // Esto cubre casos donde:
    // - Un no-admin autenticado estaba en una página de admin (y el useEffect lo está deslogueando/redirigiendo)
    // - No autenticado y no en login (el useEffect está redirigiendo)
    // - Un admin autenticado estaba en login (el useEffect está redirigiendo)
    // Esencialmente, si ninguna de las condiciones de renderizado anteriores se cumplió, muestra un loader.
    console.log('[AdminLayout] Render: Fallback Loader / Redirection state for path:', pathname);
    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-gray-700">Procesando...</p>
            <Toaster richColors />
        </div>
    );
}