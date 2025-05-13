// src/app/(app)/valoraciones/editar-datos/[assessmentId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import axios from 'axios'; // Para isAxiosError
import { 
    useForm, 
    SubmitHandler, 
    FieldValues, 
    //Path 
} from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { 
    FormStructure, 
    UserAssessment, 
    //FormFieldData 
} from '@/types/assessment'; // Importa desde tu archivo de tipos
import DynamicFormField from '@/components/forms/DynamicFormField'; // Importa el nuevo componente

export default function EditAssessmentDataPage() {
    const params = useParams();
    const router = useRouter();
    const assessmentId = params.assessmentId as string;

    const [formStructure, setFormStructure] = useState<FormStructure | null>(null);
    const [currentAssessment, setCurrentAssessment] = useState<UserAssessment | null>(null); // Para el nombre, etc.
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { 
        control, 
        handleSubmit, 
        formState: { errors }, 
        register, 
        reset 
    } = useForm<FieldValues>({
        defaultValues: {},
    });

    const fetchData = useCallback(async () => {
        if (!assessmentId) return;
        setIsLoading(true);
        try {
            const assessmentRes = await apiClient.get<UserAssessment>(`/app/assessments/${assessmentId}`);
            const assessmentData = assessmentRes.data;
            setCurrentAssessment(assessmentData);

            if (assessmentData.valuationTypeId) {
                const structureRes = await apiClient.get<FormStructure>(`/app/forms/${assessmentData.valuationTypeId}/structure`);
                setFormStructure(structureRes.data);
                reset(assessmentData.formData || {});
                console.log("Datos cargados para edición:", { structure: structureRes.data, formData: assessmentData.formData });
            } else {
                throw new Error("ValuationType ID no encontrado en el assessment.");
            }
        } catch (error) {
            console.error("Error al cargar datos para edición:", error);
            toast.error("No se pudieron cargar los datos para la edición.");
            router.back();
        } finally {
            setIsLoading(false);
        }
    }, [assessmentId, router, reset]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onSaveDataChanges: SubmitHandler<FieldValues> = async (formDataFromHook) => {
        if (!assessmentId) return;
        setIsSaving(true);
        console.log("Guardando datos actualizados del formulario:", formDataFromHook);
        try {
            const response = await apiClient.put(`/app/assessments/${assessmentId}`, {
                formData: formDataFromHook,
            });
            toast.success(response.data.message || "Datos de la valoración actualizados.");
            if (response.data.reportNeedsRegeneration) {
                toast.info("El informe previo ha sido borrado. Por favor, genere uno nuevo desde la vista de detalles.");
            }
            router.push(`/valoraciones/ver/${assessmentId}`);
        } catch (error) {
            console.error("Error al guardar cambios:", error);
            let errorMsg = "No se pudieron guardar los cambios.";
             if (axios.isAxiosError(error) && error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }
            toast.error(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };
    
    const getSubjectDisplayName = () => {
        if (!currentAssessment?.formData) return 'N/A';
        // Reutiliza la lógica de extracción o accede a campos conocidos si el backend los envía
        // Por ahora, una heurística simple si no tienes extractedSubjectName en UserAssessment de esta llamada
        return currentAssessment.extractedSubjectName || 
               currentAssessment.formData?.nombre as string || // Asumiendo clave 'nombre'
               Object.values(currentAssessment.formData).find(v => typeof v === 'string' && v.length > 2) as string || 
               'Sujeto';
    };


    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Cargando datos de valoración...</p></div>;
    }

    if (!formStructure || !currentAssessment) {
        return <div className="text-center py-10"><p>No se pudo cargar la información para editar.</p><Button variant="outline" onClick={() => router.back()}>Volver</Button></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
                    Editar Datos: <span className="text-primary">{formStructure.name}</span>
                </h1>
                <Button variant="outline" size="sm" onClick={() => router.push(`/valoraciones/ver/${assessmentId}`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar y Volver
                </Button>
            </div>
            <p className="text-sm text-muted-foreground">
                Sujeto: <span className="font-medium">{getSubjectDisplayName()}</span> | ID Valoración: <span className="font-mono text-xs">{assessmentId}</span>
            </p>

            <form onSubmit={handleSubmit(onSaveDataChanges)} className="space-y-8">
                {formStructure.sections.sort((a,b)=>a.orderIndex - b.orderIndex).map(section => (
                    <Card key={section.id} className="shadow-lg overflow-hidden">
                        <CardHeader className="bg-slate-50 dark:bg-slate-800">
                            <CardTitle className="text-xl font-semibold text-slate-700 dark:text-slate-200">{section.title}</CardTitle>
                            {section.description && <CardDescription className="text-sm text-slate-600 dark:text-slate-400">{section.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {section.fields.sort((a,b)=>a.orderIndex - b.orderIndex).map(field => (
                                <div key={field.id}>
                                    <Label htmlFor={field.id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {field.label}
                                        {field.validationRules?.required && <span className="text-destructive ml-1">*</span>}
                                    </Label>
                                    <DynamicFormField
                                        field={field}
                                        control={control}
                                        register={register}
                                        //errors={errors}
                                    />
                                    {field.helpText && <p className="text-xs text-muted-foreground mt-1.5">{field.helpText}</p>}
                                    {errors[field.id] && <p className="text-sm text-destructive mt-1.5">{errors[field.id]?.message as string}</p>}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
                <div className="pt-6 border-t dark:border-gray-700 flex justify-end">
                    <Button type="submit" disabled={isSaving} className="text-base py-3 px-6">
                        {isSaving && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        <Save className="mr-2 h-5 w-5" /> Guardar Cambios
                    </Button>
                </div>
            </form>
        </div>
    );
}