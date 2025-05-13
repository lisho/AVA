// src/app/(app)/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react'; // useCallback añadido
import apiClient from '@/lib/axios';
import axios from 'axios'; // Para isAxiosError
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
//import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Para la lista
import { Loader2, FilePlus2, ListChecks, /*Eye, Download, Trash2*/ } from 'lucide-react'; // Nuevos iconos
import { toast } from 'sonner';
import AssessmentList from '@/components/app/AssessmentList'; // Adjust the path based on your project structure
//import Link from 'next/link'; // Para enlaces
import { PaginatedAssessmentsResponse, UserAssessment, ActiveValuationType } from '@/types/assessment'; // Asegúrate de que la ruta es correcta
import DeleteAssessmentDialog from '@/components/app/DeleteAssessmentDialog'; // Adjust the path based on your project structure

// Para esta versión, vamos a asumir que el frontend NO CONOCE las etiquetas exactas,
// y simplemente mostraremos el primer o segundo valor de texto no vacío como placeholder.
// ESTO ES MUY SIMPLIFCADO Y DEBERÍA MEJORARSE.

// --- Helper para extraer info del sujeto ---
// Esta función intenta extraer el nombre y apellido del objeto formData.
function extractSubjectInfoFromFormData(formData: Record<string, unknown>): { name?: string, lastName?: string } {
    let extractedName: string | undefined;
    let extractedLastName: string | undefined;

    // Intento 1: Buscar por claves comunes (asumiendo que las claves podrían ser las etiquetas)
    // Esto es menos probable si las claves son IDs de campo.
    for (const key in formData) {
        const value = formData[key];
        if (typeof value === 'string' && value.trim() !== '') {
            const lowerKey = key.toLowerCase();
            if ((lowerKey.includes('nombre') && !lowerKey.includes('apellidos') && !lowerKey.includes('apellido')) && !extractedName) {
                extractedName = value;
            }
            if ((lowerKey.includes('apellidos') || lowerKey.includes('apellido')) && !extractedLastName) {
                extractedLastName = value;
            }
        }
    }

    // Intento 2: Si no se encontraron por clave, usar los primeros valores de string como heurística
    // Esta parte es muy dependiente de cómo se estructuran tus formularios.
    if (!extractedName || !extractedLastName) {
        const stringValues = Object.values(formData).filter((v): v is string => typeof v === 'string' && v.trim() !== '');
        
        if (!extractedName && stringValues.length > 0) {
            extractedName = stringValues[0];
        }
        // Si solo encontramos nombre por clave, intentamos que el apellido sea el siguiente string
        if (extractedName && !extractedLastName && stringValues.length > 1) {
            if (stringValues[0] === extractedName && stringValues[1] !== extractedName) {
                extractedLastName = stringValues[1];
            } else if (stringValues[0] !== extractedName) { // Si el primer string no fue el nombre (raro si ya se asignó)
                extractedLastName = stringValues[0] 
            }
        } 
        // Si no encontramos nada por clave y hay al menos dos strings
        else if (!extractedName && !extractedLastName && stringValues.length > 1) {
            extractedName = stringValues[0];
            extractedLastName = stringValues[1];
        }
    }
    
    // Evitar que nombre y apellido sean idénticos si provienen de la heurística de orden
    if (extractedName && extractedLastName && extractedName === extractedLastName) {
        const stringValues = Object.values(formData).filter((v): v is string => typeof v === 'string' && v.trim() !== '');
        if (stringValues.length > 1 && stringValues[0] === extractedName) {
            extractedLastName = stringValues[1];
        } else if (stringValues.length === 1 && extractedName) {
            // Si solo hay un valor de string y se usó para el nombre, el apellido queda undefined
            extractedLastName = undefined;
        }
    }


    return { name: extractedName, lastName: extractedLastName };
}

// --- Fin del Helper ---



export default function AppDashboardPage() {
    const router = useRouter();
    const [activeTypes, setActiveTypes] = useState<ActiveValuationType[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);
    const [userAssessments, setUserAssessments] = useState<UserAssessment[]>([]);
    const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);
    const [assessmentToDelete, setAssessmentToDelete] = useState<UserAssessment | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeletingAssessment, setIsDeletingAssessment] = useState(false);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    const ASSESSMENTS_PER_PAGE = 5; // O el límite que uses en el backend
 
    
     const fetchActiveValuationTypes = useCallback(async () => {
        setIsLoadingTypes(true);
        try {
            const response = await apiClient.get('/app/valuation-types/active');
            setActiveTypes(response.data);
        } catch (error) {
            console.error("Error al cargar tipos de valoración activos:", error);
            toast.error("No se pudieron cargar los tipos de valoración disponibles.");
        } finally {
            setIsLoadingTypes(false);
        }
    }, []); // Dependencias vacías si no usa nada del scope del componente que cambie
    
    const fetchUserAssessments = useCallback(async (page = 1) => {
        setIsLoadingAssessments(true);
        try {
            const response = await apiClient.get<PaginatedAssessmentsResponse>(`/app/assessments?page=${page}&limit=${ASSESSMENTS_PER_PAGE}`);
            
            // Procesar cada assessment para extraer info del sujeto
            const processedAssessments = response.data.assessments.map(asmnt => {
                const subjectInfo = extractSubjectInfoFromFormData(asmnt.formData);
                return {
                    ...asmnt,
                    extractedSubjectName: subjectInfo.name,
                    extractedSubjectLastName: subjectInfo.lastName,
                };
            });

            setUserAssessments(processedAssessments);
            setPagination({
                currentPage: response.data.currentPage,
                totalPages: response.data.totalPages,
                totalItems: response.data.totalItems,
            });
            console.log("Valoraciones del usuario cargadas:", response.data);
        } catch (error) {
            console.error("Error al cargar valoraciones del usuario:", error);
            toast.error("No se pudieron cargar tus valoraciones.");
        } finally {
            setIsLoadingAssessments(false);
        }
    }, []); // ASSESSMENTS_PER_PAGE es constante, no necesita ser dependencia si está fuera


    useEffect(() => {
        fetchActiveValuationTypes();
        fetchUserAssessments(1); // Cargar la primera página al montar
    }, [fetchActiveValuationTypes, fetchUserAssessments]);

    // Función para manejar la navegación al formulario de valoración
    const handleStartValuation = (typeId: string) => {
        router.push(`/valoraciones/iniciar/${typeId}`); // Ruta para el formulario dinámico
    };

    const handleDownloadPdf = useCallback(async (assessmentId: string, assessmentName?: string) => {
        try {
            toast.info("Preparando descarga del PDF...");
            const response = await apiClient.get(`/app/assessments/${assessmentId}/pdf`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileName = assessmentName 
                ? `Informe_${assessmentName.replace(/\s+/g, '_')}_${assessmentId.substring(0,8)}.pdf`
                : `informe_valoracion_${assessmentId}.pdf`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("PDF descargado.");
        } catch (error) {
            console.error("Error al descargar PDF:", error);
            let errorMsg = "No se pudo descargar el PDF.";
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                 // Intenta leer el mensaje de error del blob si es JSON
                try {
                    const errorJson = JSON.parse(await (error.response.data as Blob).text());
                    if (errorJson.message) errorMsg = errorJson.message;
                } catch (e) { 
                    console.error("Error al parsear el error JSON:", e);
                    /* No hacer nada si no es JSON */ }
            }
            toast.error(errorMsg);
        }
    }, []);

    const handleOpenDeleteDialog = (assessment: UserAssessment) => {
        setAssessmentToDelete(assessment);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteAssessment = async () => {
        if (!assessmentToDelete) return;
        setIsDeletingAssessment(true);
        try {
            await apiClient.delete(`/app/assessments/${assessmentToDelete.id}`);
            toast.success(`Valoración para "${assessmentToDelete.valuationType?.name || assessmentToDelete.id}" eliminada.`);
            // Volver a cargar la página actual de valoraciones o la primera página
            fetchUserAssessments(pagination.currentPage); 
        } catch (error) {
            console.error("Error al eliminar valoración:", error);
            toast.error("No se pudo eliminar la valoración.");
        } finally {
            setIsDeletingAssessment(false);
            setIsDeleteDialogOpen(false);
            setAssessmentToDelete(null);
        }
    };


    if (isLoadingTypes) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]"> {/* Ajusta altura si es necesario */}
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-gray-700 dark:text-gray-300">Cargando datos del panel...</p>
            </div>
            /*
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Cargando opciones de valoración...</p>
            </div>
            */
        );
    }

    return (

        <div className="space-y-10 md:space-y-12 py-6 md:py-8"> {/* Espaciado general y padding */}
           
           
            <section>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Panel de Trabajador Social</h1>
                    <p className="text-md text-gray-600 dark:text-gray-400 mt-1">Gestiona y crea nuevas valoraciones de exclusión social.</p>
                </div>
                
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100 border-b pb-2 dark:border-gray-700">Iniciar Nueva Valoración</h2>
                {isLoadingTypes ? (
                     <div className="flex items-center text-gray-500 dark:text-gray-400 py-8">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        <span>Cargando tipos de valoración disponibles...</span>
                    </div>
                ) : activeTypes.length === 0 ? (
                    <Card className="text-center py-8 border-dashed dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50">
                        <CardContent className="flex flex-col items-center">
                            <ListChecks className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">No hay tipos de valoración activos.</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Por favor, contacte con un administrador para configurar los tipos de valoración.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {activeTypes.map((type) => (
                            <Card key={type.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300 dark:bg-gray-800">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xl text-gray-800 dark:text-gray-100">{type.name}</CardTitle>
                                    {type.description && (
                                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400 min-h-[40px] line-clamp-2"> 
                                            {/* line-clamp-2 para truncar descripciones largas (necesita plugin de tailwind typography o css manual) */}
                                            {type.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    {/* Puedes añadir más información del tipo de valoración aquí si es relevante */}
                                </CardContent>
                                <CardFooter className="pt-4 border-t dark:border-gray-700">
                                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => handleStartValuation(type.id)}>
                                        <FilePlus2 className="mr-2 h-5 w-5" /> Iniciar Valoración
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
            
            <section className="mt-12"> {/* Más espacio antes de la lista */}
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100 border-b pb-2 dark:border-gray-700">Mis Valoraciones Realizadas</h2>
                <AssessmentList
                    assessments={userAssessments}
                    isLoading={isLoadingAssessments}
                    pagination={pagination}
                    onPageChange={fetchUserAssessments}
                    onDownloadPdf={handleDownloadPdf}
                    onOpenDeleteDialog={handleOpenDeleteDialog}
                />
            </section>

            <DeleteAssessmentDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDeleteAssessment}
                assessmentName={assessmentToDelete?.valuationType?.name || `ID: ${assessmentToDelete?.id.substring(0,8)}...`}
                isDeleting={isDeletingAssessment}
            />
        </div>
    );
}