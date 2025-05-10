// app/(admin)/dashboard/page.tsx
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function AdminDashboardPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard de Administración</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Bienvenido</CardTitle>
                    <CardDescription>Este es el panel principal de administración.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Desde aquí podrás gestionar los tipos de valoración, usuarios y otras configuraciones de la aplicación.</p>
                    <p className="mt-4">Selecciona una opción del menú lateral para comenzar.</p>
                </CardContent>
            </Card>
        </div>
    );
}