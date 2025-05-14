// src/app/(app)/valoraciones/ver/[assessmentId]/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { 
    Card, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardContent, 
    //CardFooter 
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea'; // Para editar el informe
import { Label } from '@/components/ui/label';
import { 
    Loader2, 
    ArrowLeft, 
    Download, 
    Edit, 
    RefreshCw, 
    Save 
} from 'lucide-react'; // Nuevos iconos
import { toast } from 'sonner';
import { UserAssessment, FormStructure  } from '@/types/assessment'; // Asumiendo que están en src/types

// Interfaz para la respuesta de /generate-report
interface GenerateReportResponse {
    assessmentId: string;
    generatedReportText: string;
    message?: string;
}

export default function ViewAssessmentPage() {
    const params = useParams();
    const router = useRouter();
    const assessmentId = params.assessmentId as string;

    const [assessment, setAssessment] = useState<UserAssessment | null>(null);
    const [editableReportText, setEditableReportText] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isSavingReport, setIsSavingReport] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    
    // Para mostrar los formData de forma legible
    const [formStructure, setFormStructure] = useState<FormStructure | null>(null);

    const fetchAssessmentDetails = useCallback(async () => {
        if (!assessmentId) return;
        setIsLoading(true);
        try {
            const response = await apiClient.get<UserAssessment>(`/app/assessments/${assessmentId}`);
            setAssessment(response.data);
            setEditableReportText(response.data.generatedReportText || '');

            // Cargar estructura del formulario para mostrar formData de forma legible
            if (response.data.valuationTypeId) {
                try {
                    const structureRes = await apiClient.get<FormStructure>(
                        `/app/forms/${response.data.valuationTypeId}/structure`
                    );
                    setFormStructure(structureRes.data); 
                } catch (structError) {
                    console.error("Error cargando estructura del formulario para visualización:", structError);
                    // No es crítico si falla, solo no podremos mostrar los formData con etiquetas
                }
            }

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
    
    const handleGenerateReport = async () => {
        if (!assessment?.id) return;
        setIsGeneratingReport(true);
        toast.info("Generando informe con IA, por favor espera...");
        try {
            const response = await apiClient.post<GenerateReportResponse>(`/app/assessments/${assessment.id}/generate-report`);
            setEditableReportText(response.data.generatedReportText || '');
            // Actualizar el estado del assessment local si es necesario
            if (assessment) {
                setAssessment(prev => prev ? { ...prev, generatedReportText: response.data.generatedReportText } : null);
            }
            toast.success(response.data.message || "Informe generado/regenerado exitosamente.");
        } catch (error) {
            console.error("Error al generar informe IA:", error);
            toast.error("No se pudo generar el informe con la IA.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const renderFormDataBySections = () => {
        if (!assessment?.formData || !formStructure?.sections || formStructure.sections.length === 0) {
            return <p className="italic text-sm text-gray-500 dark:text-gray-400">No hay datos de formulario para mostrar o la estructura del formulario no está disponible.</p>;
        }

        return formStructure.sections
            .sort((a, b) => a.orderIndex - b.orderIndex) // Ordenar secciones
            .map(section => (
                <div key={section.id} className="mb-6 pb-4 border-b dark:border-gray-700 last:border-b-0 last:pb-0 last:mb-0">
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-3">{section.title}</h4>
                    {section.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{section.description}</p>}
                    <div className="space-y-2 text-sm pl-2">
                        {section.fields
                            .sort((a, b) => a.orderIndex - b.orderIndex) // Ordenar campos dentro de la sección
                            .map(field => {
                                const value = assessment.formData![field.id]; // Usamos '!' porque ya verificamos assessment.formData
                                let displayValue: string | React.ReactNode = String(value); // Inicializamos como string

                                if (value === undefined || value === null || value === '') {
                                    displayValue = <span className="italic text-gray-500">No proporcionado</span>; // any para permitir JSX
                                } else if (field.fieldType === 'checkbox') {
                                    displayValue = value ? 'Sí' : 'No';
                                } else if (field.fieldType === 'select' || field.fieldType === 'radio') {
                                    // Si el valor es la clave, buscar la etiqueta en las opciones del campo
                                    const selectedOption = field.options?.find(opt => opt.value === value);
                                    displayValue = selectedOption ? selectedOption.label : String(value);
                                } else if (Array.isArray(value)) {
                                    displayValue = value.join(', ');
                                } else if (typeof value === 'object') {
                                    displayValue = JSON.stringify(value);
                                }
                                
                                return (
                                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 items-start">
                                        <span className="font-medium text-gray-600 dark:text-gray-400 sm:col-span-1">{field.label}:</span>
                                        <span className="text-gray-800 dark:text-gray-200 sm:col-span-2 break-words">{displayValue}</span>
                                    </div>
                                );
                            })}
                         {section.fields.length === 0 && <p className="italic text-xs text-gray-400">Esta sección no tiene campos con datos.</p>}
                    </div>
                </div>
            ));
    };

    const handleSaveEditedReport = async () => {
        if (!assessment?.id) return;
        setIsSavingReport(true);
        try {
            await apiClient.put(`/app/assessments/${assessment.id}`, {
                generatedReportText: editableReportText,
            });
            toast.success("Informe editado guardado correctamente.");
            if (assessment) { // Actualizar el estado local
                 setAssessment(prev => prev ? { ...prev, generatedReportText: editableReportText } : null);
            }
        } catch (error) {
            console.error("Error al guardar informe editado:", error);
            toast.error("No se pudo guardar el informe editado.");
        } finally {
            setIsSavingReport(false);
        }
    };

    const handleDownloadPdf = useCallback(async () => {
        if (!assessment?.id) {
            toast.error("No se puede descargar el PDF: ID de valoración no disponible.");
            return;
        }

        setIsDownloadingPdf(true); // <--- LLAMAR A SETTER AQUÍ
        toast.info("Preparando descarga del PDF...");

        try {
            const response = await apiClient.get(`/app/assessments/${assessment.id}/pdf`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            
            const assessmentName = assessment.valuationType?.name || 'Valoracion';
            const date = new Date(assessment.createdAt).toISOString().split('T')[0];
            const fileName = `Informe_${assessmentName.replace(/\s+/g, '_')}_${date}_${assessment.id.substring(0,8)}.pdf`;
            
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("PDF descargado exitosamente.");

        } catch (error) {
            console.error("Error al descargar PDF:", error);
            let errorMsg = "No se pudo descargar el PDF.";
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.data instanceof Blob && error.response.data.type === 'application/json') {
                    try {
                        const errorJsonText = await error.response.data.text();
                        const errorJson = JSON.parse(errorJsonText);
                        if (errorJson.message) {
                            errorMsg = errorJson.message;
                        }
                    } catch (e) {
                        console.error("Error al parsear error blob JSON:", e);
                    }
                } else if (error.response.status === 400) {
                     errorMsg = "El informe para esta valoración no está disponible o no se pudo generar.";
                } else if (error.response.status === 404) {
                     errorMsg = "Valoración no encontrada para generar el PDF.";
                }
            }
            toast.error(errorMsg);
        } finally {
            setIsDownloadingPdf(false); // <--- Y LLAMAR A SETTER AQUÍ
        }
    }, [assessment]); 


    // Función para mostrar los formData de forma legible
    /*
    const renderFormData = () => {
        if (!assessment?.formData || !formStructure?.sections) {
            return <p className="italic text-sm">Datos del formulario no disponibles o estructura no cargada.</p>;
        }
        
        const fieldMap = new Map<string, FormFieldData>();
        formStructure.sections.forEach(section => {
            section.fields.forEach(field => {
                fieldMap.set(field.id, field);
            });
        });

        return (
            <div className="space-y-3 text-sm">
                {Object.entries(assessment.formData).map(([fieldId, value]) => {
                    const fieldDetails = fieldMap.get(fieldId);
                    let displayValue = String(value);
                    if (fieldDetails?.fieldType === 'checkbox') {
                        displayValue = value ? 'Sí' : 'No';
                    } else if (Array.isArray(value)) { // Para opciones múltiples si alguna vez se implementa
                        displayValue = value.join(', ');
                    } else if (typeof value === 'object' && value !== null) {
                        displayValue = JSON.stringify(value);
                    }
                    return (
                        <div key={fieldId} className="grid grid-cols-3 gap-2 items-start">
                            <span className="font-medium text-gray-600 dark:text-gray-400 col-span-1">{fieldDetails?.label || fieldId}:</span>
                            <span className="text-gray-800 dark:text-gray-200 col-span-2 break-words">{displayValue || <span className="italic text-gray-500">No proporcionado</span>}</span>
                        </div>
                    );
                })}
            </div>
        );
    };
    */

    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Cargando detalles de valoración...</p></div>;
    if (!assessment) return <div className="text-center py-10"><p>Valoración no encontrada.</p><Button variant="outline" onClick={() => router.back()}>Volver</Button></div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto py-6 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                   
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
                        Detalle de Valoración
                    </h1>
                    
                </div>
             
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')} className="mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
                </Button>
            </div>

            {/* Información Básica de la Valoración */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl">
                        {assessment?.valuationType?.name || 'Cargando...'}
                    </CardTitle>
                    <CardDescription>
                        ID: <span className="font-mono text-xs">{assessment?.id}</span> | 
                        Creada: {assessment && new Date(assessment.createdAt).toLocaleString('es-ES')} | 
                        Por: {assessment?.user?.name || assessment?.user?.email || 'Desconocido'}
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Datos del Formulario Ingresados (AHORA POR SECCIONES) */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div> Datos del Formulario Ingresados</div>
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={() => router.push(`/valoraciones/editar-datos/${assessment?.id}`)}
                                disabled={!assessment}
                                className="mb-2"

                            >
                                <Edit className="mr-2 h-4 w-4" /> Editar Datos
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : renderFormDataBySections()}
                </CardContent>
            </Card>
            {/* Sección del Informe IA */}
            <Card className="shadow-md">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <CardTitle className="text-lg">Informe Generado por IA</CardTitle>
                        <Button onClick={handleGenerateReport} disabled={isGeneratingReport || isSavingReport} size="sm" variant="secondary">
                            {isGeneratingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            {assessment.generatedReportText ? 'Regenerar Informe' : 'Generar Informe'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Label htmlFor="iaReportText" className="sr-only">Texto del Informe</Label> {/* sr-only para accesibilidad */}
                    <Textarea
                        id="iaReportText"
                        value={editableReportText}
                        onChange={(e) => setEditableReportText(e.target.value)}
                        className="min-h-[250px] md:min-h-[350px] text-sm leading-relaxed font-sans bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-md p-3"
                        placeholder={isGeneratingReport ? "Generando informe..." : "El informe de la IA aparecerá aquí..."}
                        readOnly={isGeneratingReport} // No editable mientras se genera
                    />
                    <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                        <Button onClick={handleSaveEditedReport} disabled={isSavingReport || isGeneratingReport || editableReportText === (assessment.generatedReportText || '')}>
                            {isSavingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" /> Guardar Informe Editado
                        </Button>
                        {editableReportText && ( // Solo mostrar si hay texto de informe
                            <Button onClick={handleDownloadPdf} disabled={isDownloadingPdf || isGeneratingReport}>
                                {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                {isDownloadingPdf ? 'Descargando...' : 'Descargar PDF'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}