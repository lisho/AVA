// src/app/(app)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Toaster } from "@/components/ui/sonner"; // O el que uses
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';


// Navbar simple para el trabajador social
const AppNavbar = () => {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login'); // Asumiendo que la ruta de login de admin es la misma, o crea una específica
    };

    return (
        <nav className="bg-primary text-primary-foreground p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/dashboard" className="text-2xl font-bold">
                    AVA IA - Valoraciones
                </Link>
                <div className="flex items-center space-x-3">
                    {user && (
                        <span className="text-sm hidden sm:inline">
                            Usuario: {user.name || user.email} ({user.role})
                        </span>
                    )}
                    <Button variant="outline" size="sm" onClick={handleLogout} className="bg-primary-foreground text-primary hover:bg-slate-100">
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        </nav>
    );
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user, isVerifying, isLoading: authOperationLoading, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname(); // Para saber si estamos en la página de login

    useEffect(() => {
        // La verificación inicial del token ya se maneja en el store y el AdminLayout
        // Aquí solo nos preocupamos de la autorización para esta sección (app)

        if (isVerifying || authOperationLoading) {
            return; // Esperar a que la autenticación se resuelva
        }

        // Redirigir a login si no está autenticado Y no está ya en una página de login pública
        // (Asumimos que /login es la misma para todos o que el AdminLayout ya redirigió a la de admin si se accedió sin /app/)
        if (!isAuthenticated && !pathname.endsWith('/login')) { // Evitar bucles si hay una /app/login
            router.push('/login'); // O la ruta de login específica para trabajadores
            return;
        }

        // Si está autenticado, verificar rol
        if (isAuthenticated) {
            if (user?.role !== 'trabajador_social' && user?.role !== 'admin') {
                // Si no es trabajador social ni admin, no debería estar aquí
                toast.error("Acceso denegado. No tiene los permisos necesarios.");
                logout(); // Desloguear
                router.push('/login'); // Redirigir
            }
            // Si está autenticado con el rol correcto pero intenta ir a /login, redirigir al dashboard de la app
            else if (pathname.endsWith('/login')) {
                 router.push('/dashboard'); // O la página principal de la app
            }
        }

    }, [isAuthenticated, user, isVerifying, authOperationLoading, router, pathname]);

    // Mostrar loader mientras se verifica o carga la autenticación
    if (isVerifying || authOperationLoading) {
        // Si está en /login y cargando el login, deja que la página de login muestre su propio loader
        if (pathname.endsWith('/login') && authOperationLoading && !isVerifying) return <>{children}<Toaster richColors /></>;
        
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Cargando aplicación...</p>
                <Toaster richColors />
            </div>
        );
    }

    // Si está autenticado y tiene el rol correcto, muestra el layout de la app
    if (isAuthenticated && (user?.role === 'trabajador_social' || user?.role === 'admin')) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
                <AppNavbar />
                <main className="flex-grow container mx-auto px-4 py-8">
                    {children}
                </main>
                <Toaster richColors position="top-right" />
            </div>
        );
    }
    
    // Si es la página de login y aún no está autenticado (o tiene rol incorrecto y está siendo redirigido)
    if (pathname.endsWith('/login')) {
         return <>{children}<Toaster richColors /></>;
    }

    // Fallback, debería haber sido manejado por la redirección
    return (
         <div className="flex justify-center items-center h-screen"><p>Redirigiendo...</p><Toaster richColors /></div>
    );
}