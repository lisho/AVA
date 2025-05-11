// src/components/admin/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'; // Utilidad de shadcn/ui para classnames
import { LayoutDashboard, ListChecks, /*Users, Settings*/ } from 'lucide-react'; // Iconos de ejemplo

const navItems = [
    { href: '/admin_dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/valuation-types', label: 'Tipos de Valoración', icon: ListChecks },
    // { href: '/users', label: 'Usuarios', icon: Users }, // Futuro
    // { href: '/settings', label: 'Configuración', icon: Settings }, // Futuro
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
                {/* Puedes poner un logo o título de la app aquí */}
                <Link href="/admin_dashboard" className="text-2xl font-bold text-gray-800 dark:text-white">
                    AVA IA
                </Link>
            </div>
            <nav className="flex-grow p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin_dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                                isActive
                                    ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
            {/* Puedes añadir un pie de sidebar aquí si quieres */}
        </aside>
    );
}