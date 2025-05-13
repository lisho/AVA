// src/app/(app)/valoraciones/ver/[assessmentId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
    Loader2, 
    ArrowLeft, 
    Download, 
    //Edit 
} from 'lucide-react';

import { toast } from 'sonner';
import { UserAssessment } from '@/types/assessment'; // Reutiliza la interfaz

export default function ViewAssessmentPage() {
    const params = useParams();
    const router = useRouter();
    const assessmentId = params.assessmentId as string;
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const [assessment, setAssessment] = useState<UserAssessment | null>(null); // Usa tu tipo UserAssessment más completo
    const [isLoading, setIsLoading] = useState(true);

    const fetchAssessmentDetails = useCallback(async () => {
        if (!assessmentId) return;
        setIsLoading(true);
        try {
            // Asume que UserAssessment incluye todos los campos necesarios, incluido generatedReportText
            const response = await apiClient.get<UserAssessment>(`/app/assessments/${assessmentId}`);
            setAssessment(response.data);
        } catch (error) {
            console.error("Error al cargar detalles de la valoración:", error);
            toast.error("No se pudieron cargar los detalles de la valoración.");
            router.back();
        } finally {
            setIsLoading(false);
        }
    }, [assessmentId, router]);

    useEffect(() => {
        fetchAssessmentDetails();
    }, [fetchAssessmentDetails]);
    
        // --- FUNCIÓN handleDownloadPdf ---
    const handleDownloadPdf = useCallback(async () => {
        if (!assessment?.id) {
            toast.error("No se puede descargar el PDF: ID de valoración no disponible.");
            return;
        }

        setIsDownloadingPdf(true); // Activar spinner
        toast.info("Preparando descarga del PDF...");

        try {
            const response = await apiClient.get(`/app/assessments/${assessment.id}/pdf`, {
                responseType: 'blob', // Importante para que Axios maneje la respuesta como un archivo binario
            });

            // Crear URL para el blob y simular clic para descargar
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            
            // Crear un nombre de archivo descriptivo
            const assessmentName = assessment.valuationType?.name || 'Valoracion';
            const date = new Date(assessment.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
            const fileName = `Informe_${assessmentName.replace(/\s+/g, '_')}_${date}_${assessment.id.substring(0,8)}.pdf`;
            
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // Limpiar
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("PDF descargado exitosamente.");

        } catch (error) {
            console.error("Error al descargar PDF:", error);
            let errorMsg = "No se pudo descargar el PDF.";
            if (axios.isAxiosError(error) && error.response) {
                // Si el backend envía un error JSON en el blob (por ejemplo, informe no listo)
                if (error.response.data instanceof Blob && error.response.data.type === 'application/json') {
                    try {
                        const errorJsonText = await error.response.data.text();
                        const errorJson = JSON.parse(errorJsonText);
                        if (errorJson.message) {
                            errorMsg = errorJson.message;
                        }
                    } catch (e) {
                        console.error("Error al parsear error blob JSON:", e);
                        // Mantener errorMsg por defecto
                    }
                } else if (error.response.status === 400) {
                     errorMsg = "El informe para esta valoración no está disponible o no se pudo generar.";
                } else if (error.response.status === 404) {
                     errorMsg = "Valoración no encontrada para generar el PDF.";
                }
            }
            toast.error(errorMsg);
        } finally {
            setIsDownloadingPdf(false); // Desactivar spinner
        }
    }, [assessment]); // Depende del 'assessment' actual para obtener su ID y nombre

    // --- RENDERIZADO ---
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Cargando detalles...</p></div>;
    if (!assessment) return <div className="text-center py-10"><p>Valoración no encontrada.</p><Button variant="outline" onClick={() => router.back()}>Volver</Button></div>;

    return (
         <div className="space-y-6">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
            </Button>
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        Detalle de Valoración: {assessment.valuationType?.name || 'Cargando...'}
                    </CardTitle>
                    <CardDescription>
                        ID: {assessment.id} <br />
                        Realizada el: {new Date(assessment.createdAt).toLocaleString('es-ES')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <h3 className="text-lg font-semibold">Informe Generado:</h3>
                    {assessment.generatedReportText ? (
                        <div className="prose dark:prose-invert max-w-none bg-slate-100 dark:bg-slate-800 p-4 rounded-md border dark:border-slate-700">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                {assessment.generatedReportText}
                            </pre>
                        </div>
                    ) : (
                        <p className="italic text-gray-500 dark:text-gray-400">
                            El informe para esta valoración no está disponible o no se pudo generar.
                        </p>
                    )}
                    <div className="flex space-x-3 pt-4">
                        {assessment.generatedReportText && ( // Solo mostrar si hay informe para descargar
                            <Button onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
                                {isDownloadingPdf ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                {isDownloadingPdf ? 'Descargando...' : 'Descargar PDF'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}