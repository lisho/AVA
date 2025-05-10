// src/components/admin/AdminNavbar.tsx
'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button'; // Asumiendo que usas shadcn/ui
import { LogOut } from 'lucide-react'; // Icono de ejemplo

export default function AdminNavbar() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login'); // Redirige a la página de login
    };

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    {/* Podrías poner un título o un breadcrumb aquí */}
                    <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Panel de Administración</h1>
                </div>
                <div className="flex items-center space-x-3">
                    {user && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Hola, {user.name || user.email}
                        </span>
                    )}
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        </nav>
    );
}