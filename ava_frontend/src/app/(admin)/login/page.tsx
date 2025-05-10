// app/(admin)/login/page.tsx
'use client'; // Necesario para hooks de React y manejo de eventos

import { useEffect, useState } from 'react';
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

const loginSchema = z.object({
    email: z.string().email({ message: 'Email inválido.' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading, user } = useAuthStore();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            router.push('/dashboard'); // Redirigir si ya está autenticado como admin
        }
    }, [isAuthenticated, user, router]);

       const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
            setError(null);
            try {
                await login(data.email, data.password);
                toast.success("Login exitoso!");
                router.push('/dashboard');
            } catch (err) { // err es 'unknown' por defecto o 'any' si tu config es más laxa
                let errorMessage = 'Error al iniciar sesión. Verifique sus credenciales.';

                if (axios.isAxiosError(err)) { // Comprobación específica si usas Axios
                    // err.response?.data puede ser un objeto con 'message' o una cadena directamente
                    if (err.response?.data && typeof err.response.data.message === 'string') {
                        errorMessage = err.response.data.message;
                    } else if (err.response?.data && typeof err.response.data === 'string') {
                        // A veces el backend puede devolver solo un string de error en data
                        errorMessage = err.response.data;
                    } else if (err.message) {
                        errorMessage = err.message;
                    }
                } else if (err instanceof Error) { // Error genérico de JavaScript
                    errorMessage = err.message;
                }
                // Si no es ninguno de los anteriores, se queda el mensaje por defecto

                setError(errorMessage);
                toast.error(errorMessage);
                console.error('Login failed:', err);
            }
        };

    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            router.push('/dashboard'); 
        }
    }, [isAuthenticated, user, router]);


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
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Ingresando...' : 'Ingresar'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
             {/* Necesitas añadir <Toaster /> de sonner o react-hot-toast en tu layout raíz o aquí */}
        </div>
    );
}