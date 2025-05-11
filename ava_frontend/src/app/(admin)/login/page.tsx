// app/(admin)/login/page.tsx
'use client'; // Necesario para hooks de React y manejo de eventos

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
//import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // Shadcn form
import { useAuthStore } from '@/store/auth.store';
import { toast } from "sonner"; // O el que uses (ej. react-hot-toast)
import axios from 'axios'; // Asegúrate de importar axios si lo usas para definir el tipo de error
import { Loader2 } from 'lucide-react'; // Icono de carga


const loginSchema = z.object({
    email: z.string().email({ message: 'Email inválido.' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading: authOperationLoading, user, isVerifying } = useAuthStore();
    const [submitError, setSubmitError] = useState<string | null>(null); 

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

       // Función para redirigir basada en rol
    const redirectToDashboard = useCallback((role: string | undefined | null) => {
        if (role === 'admin') {
            console.log("LoginPage redirectToDashboard: Redirigiendo admin a /admin-dashboard");
            router.push('/admin_dashboard');
        } else if (role === 'trabajador_social') {
            console.log("LoginPage redirectToDashboard: Redirigiendo trabajador_social a /dashboard");
            router.push('/dashboard');
        } else {
            console.log("LoginPage redirectToDashboard: Rol no reconocido o sin rol, redirigiendo a /");
            router.push('/');
        }
    }, [router]);

   // useEffect para redirigir si ya está autenticado al cargar la página
    useEffect(() => {
        console.log("LoginPage useEffect [auth state change]: isVerifying:", isVerifying, "isAuthenticated:", isAuthenticated, "user role:", user?.role);
        if (isVerifying) {
            console.log("LoginPage useEffect: Aún verificando, no hacer nada.");
            return; 
        }

        if (isAuthenticated && user) {
            console.log("LoginPage useEffect: Autenticado, llamando a redirectToDashboard con rol:", user.role);
            redirectToDashboard(user.role);
        } else {
            console.log("[LoginPage] useEffect: No autenticado o sin datos de usuario (después de verificación). Permanece en login.");
            // No es necesario hacer nada aquí, ya que el usuario debe ver el formulario de login
        }
    }, [isAuthenticated, router, user, isVerifying, redirectToDashboard]);


       const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
            setSubmitError(null);
            try {
                console.log("LoginPage onSubmit: Intentando login...");
                await login(data.email, data.password); // login actualiza 'user' en el store
                toast.success("Login exitoso!");
                
                // Obtener el usuario actualizado del store DESPUÉS de que login haya completado
                //const updatedUser = useAuthStore.getState().user;
                console.log("LoginPage onSubmit: login() completado, useEffect manejará la redirección.");
                //redirectToDashboard(updatedUser?.role);
            } catch (err) { // err es 'unknown' por defecto o 'any' si tu config es más laxa
                let errorMessage = 'Error al iniciar sesión. Verifique sus credenciales.';
                if (axios.isAxiosError(err)) {
                    errorMessage = err.response?.data?.message || err.message || errorMessage;
                } else if (err instanceof Error) {
                    errorMessage = err.message;
                }
                setSubmitError(errorMessage);
                toast.error(errorMessage);
                console.error('Login failed:', err);
            }
        };

        // --- Lógica de Renderizado ---
    // 1. Si se está verificando el token inicial (desde el store)

   if (isVerifying) {
        console.log("[LoginPage] Render: Loader (isVerifying)");
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-gray-700">Verificando sesión...</p>
            </div>
        );
    }

    // 2. Si está autenticado y hay datos de usuario (el useEffect debería estar redirigiendo)
    // Este loader es para el breve momento ANTES de que la redirección del useEffect ocurra.
    if (isAuthenticated && user) {
        console.log("[LoginPage] Render: Loader (Autenticado, esperando redirección de useEffect)");
         return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-gray-700">Redirigiendo a tu panel...</p>
            </div>
        );
    }
    
// 3. Si NO está autenticado (y la verificación ha terminado), Y no hay una operación de login en curso:
    // Muestra el formulario de login.
    // 'authOperationLoading' es el 'isLoading' del store que se activa durante la llamada a login().
    console.log("[LoginPage] Render: Formulario de Login (authOperationLoading:", 
        authOperationLoading, ")");

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión - Admin</CardTitle>
                    <CardDescription className="text-center">
                        Accede al panel de administración.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="admin@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                           {submitError && <p className="text-sm text-red-600 mt-2 text-center">{submitError}</p>}
                            <Button type="submit" className="w-full" disabled={authOperationLoading}> {/* Usa authOperationLoading */}
                                {authOperationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {authOperationLoading ? 'Ingresando...' : 'Ingresar'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
             {/* Necesitas añadir <Toaster /> de sonner o react-hot-toast en tu layout raíz o aquí */}
        </div>
    );
}
