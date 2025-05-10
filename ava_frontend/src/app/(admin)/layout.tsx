// app/(admin)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Toaster } from "@/components/ui/sonner"; // O el toaster que uses
import AdminNavbar from '@/components/admin/AdminNavbar'; 
import AdminSidebar from '@/components/admin/AdminSidebar'; 

// Puedes crear componentes de Navbar y Sidebar aquí o importarlos
// Ejemplo simple de Navbar
/*
const AdminNavbar = () => {
    const { logout, user } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login'); // Redirigir explícitamente al logout
    };

    return (
        <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold">Panel de Administración</h1>
            <div>
                {user && <span className="mr-4">Hola, {user.name || user.email}</span>}
                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                    Cerrar Sesión
                </button>
            </div>
        </nav>
    );
};

// Ejemplo simple de Sidebar (puedes usar Sheet de shadcn/ui para móvil)
const AdminSidebar = () => {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', label: 'Dashboard (Inicio)' },
        { href: '/dashboard/valuation-types', label: 'Tipos de Valoración' },
        // Futuros enlaces:
        // { href: '/admin/dashboard/users', label: 'Usuarios' },
    ];

    return (
        <aside className="w-64 bg-gray-700 text-white p-4 space-y-2">
             {navItems.map(item => (
                <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-600 ${pathname === item.href ? 'bg-gray-900' : ''}`}
                >
                    {item.label}
                </button>
             ))}
        </aside>
    );
}
*/
// --- PLACEHOLDERS TEMPORALES PARA NAVBAR Y SIDEBAR ---
/*
const AdminNavbarPlaceholder = () => {
    const router = useRouter(); // Necesitas useRouter aquí también si lo usas
    return (
        <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold">Panel Admin (Navbar)</h1>
            <button 
                onClick={() => {
                    useAuthStore.getState().logout();
                    router.push('/login'); // Redirigir a /login al hacer logout
                }} 
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
                Cerrar Sesión
            </button>
        </nav>
    );
};
*/
/*
const AdminSidebarPlaceholder = () => {
    const router = useRouter();
    return (
        <aside className="w-64 bg-gray-700 text-white p-4 space-y-2">
            <p>Sidebar</p>
            
            <button onClick={() => router.push('/dashboard')} className="w-full text-left px-3 py-2 rounded hover:bg-gray-600">Dashboard</button>
            <button onClick={() => router.push('/valuation-types')} className="w-full text-left px-3 py-2 rounded hover:bg-gray-600">Tipos de Valoración</button>
        </aside>
    );
};
*/
// --- FIN DE PLACEHOLDERS ---

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { 
        isAuthenticated, 
        user, 
        isLoading: authOperationLoading, // Renombrado para claridad (login/logout)
        isVerifying,
        // verifyCurrentUser // Ya no necesitas llamarlo explícitamente desde aquí
    } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // La lógica de verifyCurrentUser ahora se dispara desde onRehydrateStorage en el store.
        // No es necesario llamarla aquí.
    }, []); // Podrías remover este useEffect si no hace nada más.

    useEffect(() => {
        console.log('AdminLayout Effect: isVerifying:', isVerifying, 'authOperationLoading:', authOperationLoading, 'isAuthenticated:', isAuthenticated, 'pathname:', pathname, 'user role:', user?.role);

        if (isVerifying || authOperationLoading) {
            console.log('AdminLayout: Verificando o cargando, no hacer nada aún.');
            return; // No hacer nada mientras se verifica o una operación de auth está en curso
        }

        if (!isAuthenticated) {
            if (pathname !== '/login') {
                console.log('AdminLayout: No autenticado y no en login, redirigiendo a login.');
                router.push('/login');
            }
        } else { // Usuario está autenticado
            if (user?.role !== 'admin') {
                console.log('AdminLayout: Autenticado pero no es admin. Deslogueando y redirigiendo.');
                useAuthStore.getState().logout(); // Llama a logout directamente desde el store
                // router.push('/admin/login'); // logout en el store ya puede manejar la redirección o no
            } else if (pathname === '/login') {
                console.log('AdminLayout: Autenticado como admin y en login, redirigiendo a dashboard.');
                router.push('/dashboard');
            }
        }
    }, [isAuthenticated, user, authOperationLoading, isVerifying, router, pathname]);


    // Contenido a renderizar
    if (isVerifying) {
        console.log('AdminLayout: Renderizando loader global (isVerifying).');
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <p className="text-lg">Cargando aplicación...</p> {/* O un spinner */}
                <Toaster richColors position="top-right" />
            </div>
        );
    }

    if (pathname === '/login') {
        // Si estamos en la página de login, la dejamos renderizar su propio contenido.
        // Si ya está autenticado, el useEffect de arriba lo redirigirá.
        // Si authOperationLoading es true, el propio login page mostrará su loader.
        console.log('AdminLayout: Renderizando página de login.');
        return <>{children}<Toaster richColors position="top-right" /></>;
    }
    
    if (isAuthenticated && user?.role === 'admin') {
        console.log('AdminLayout: Renderizando layout de admin con contenido.');
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

    // Si no está autenticado y no es la página de login, el useEffect debería haber redirigido.
    // Este es un fallback, podría mostrar null o un loader mientras la redirección ocurre.
    // O si algo sale muy mal (ej. rol incorrecto y no se desloguea bien).
    console.log('AdminLayout: Fallback, no debería llegar aquí idealmente si la lógica es correcta.');
    return (
         <div className="flex justify-center items-center h-screen bg-slate-50">
            <p className="text-lg">Redirigiendo...</p>
            <Toaster richColors position="top-right" />
        </div>
    );


    // Si es la página de login, o si algo más falla, solo renderiza children (o un fallback)
    // Esto cubre el caso donde estamos en /admin/login y aún no estamos autenticados
    return <>{children}<Toaster richColors /></>;
}