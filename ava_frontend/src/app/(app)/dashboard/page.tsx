// src/app/(app)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, FilePlus2, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

interface ActiveValuationType {
    id: string;
    name: string;
    description?: string | null;
}

interface UserAssessment {
    id: string;
    valuationTypeId: string; // Para referencia
    createdAt: string; // O Date si lo transformas
    // Podríamos querer el nombre del tipo de valoración directamente aquí
    valuationType?: { // Esta estructura anidada debe coincidir con lo que devuelve tu endpoint
        id: string;
        name: string;
    };
    // Podrías añadir un snippet del informe o un estado si lo necesitas para la UI
    // generatedReportTextSnippet?: string;
    // status?: string;
}

export default function AppDashboardPage() {
    const router = useRouter();
    const [activeTypes, setActiveTypes] = useState<ActiveValuationType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userAssessments, setUserAssessments] = useState<UserAssessment[]>([]); 
    const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);


    const fetchActiveValuationTypes = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/app/valuation-types/active');
            setActiveTypes(response.data);
        } catch (error) {
            console.error("Error al cargar tipos de valoración activos:", error);
            toast.error("No se pudieron cargar los tipos de valoración disponibles.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchUserAssessments = async () => {
        setIsLoadingAssessments(true);
        try {
            const response = await apiClient.get('/app/assessments'); // Asume este endpoint
            setUserAssessments(response.data);
        } catch (error) {
            console.error("Error al cargar valoraciones del usuario:", error);
            // No mostrar toast aquí para no ser molesto, la UI indicará que no hay datos
        } finally {
            setIsLoadingAssessments(false);
        }
    };


    useEffect(() => {
        fetchActiveValuationTypes();
        fetchUserAssessments();
    }, []);

    const handleStartValuation = (typeId: string) => {
        router.push(`/valoraciones/iniciar/${typeId}`); // Ruta para el formulario dinámico
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Cargando opciones de valoración...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <section>
                <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Iniciar Nueva Valoración</h1>
                {activeTypes.length === 0 ? (
                    <Card className="text-center py-8">
                        <CardContent>
                            <ListChecks className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No hay tipos de valoración activos disponibles en este momento.</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">Por favor, contacte con un administrador.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeTypes.map((type) => (
                            <Card key={type.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-xl">{type.name}</CardTitle>
                                    {type.description && (
                                        <CardDescription className="text-sm min-h-[40px]">{type.description}</CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    {/* Puedes añadir más info aquí si quieres */}
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => handleStartValuation(type.id)}>
                                        <FilePlus2 className="mr-2 h-4 w-4" /> Iniciar Valoración
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
            
            <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Mis Valoraciones Recientes</h2>
                {/* Aquí listarías las valoraciones del usuario, si implementas esa funcionalidad */}
                 {isLoadingAssessments ? (
                    <p>Cargando valoraciones...</p>
                ) : userAssessments.length > 0 ? (
                    <ul className="space-y-3">
                        {userAssessments.slice(0, 5).map((assessment) => ( // Muestra las últimas 5
                            <li key={assessment.id} className="p-3 bg-white dark:bg-gray-800 rounded-md shadow text-sm">
                                Valoración tipo: {assessment.valuationType?.name || 'N/A'} - Fecha: {new Date(assessment.createdAt).toLocaleDateString()}
                                {/* Botón para ver/descargar PDF */}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">Aún no has realizado ninguna valoración.</p>
                )}
            </section>
        </div>
    );
}