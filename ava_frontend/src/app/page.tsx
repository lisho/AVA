// src/app/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react'; // O tu spinner preferido

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, isVerifying } = useAuthStore();

  useEffect(() => {
    if (isVerifying) {
      console.log("HomePage: Verificando autenticación...");
      return; // Esperar a que la verificación termine
    }

    console.log("HomePage: Verificación completada. Autenticado:", isAuthenticated, "User:", user);

    if (isAuthenticated) {
      if (user?.role === 'admin') {
        console.log("HomePage: Redirigiendo a /admin_dashboard");
        router.replace('/admin_dashboard'); // O la ruta de tu admin dashboard
      } else if (user?.role === 'trabajador_social') {
        console.log("HomePage: Redirigiendo a /dashboard");
        router.replace('/dashboard'); // La ruta del dashboard de (app)
      } else {
        // Rol desconocido o sin dashboard asignado, redirigir a login o página de error
        console.log("HomePage: Rol desconocido o sin dashboard, redirigiendo a /login");
        router.replace('/login'); // Ajusta según sea necesario
      }
    } else {
      // Si no está autenticado, redirigir a la página de login
      console.log("HomePage: No autenticado, redirigiendo a /login");
      router.replace('/login'); // Ruta de tu página de login principal
    }
  }, [isAuthenticated, user, router, isVerifying]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-gray-700">Cargando y redirigiendo...</p>
    </div>
  );
}