// src/app/(app)/valoraciones/iniciar/[valuationTypeId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import { useForm, Controller, SubmitHandler, FieldValues } from 'react-hook-form'; // FieldValues para data genérica
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox"; // Para campos tipo checkbox
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Send, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { FormFieldData, /*FormSectionData,*/ ValuationTypeWithStructure } from '@/app/(admin)/valuation-types/[valuationTypeId]/builder/page'; // Reutiliza interfaces

// Interfaz para el informe de la IA
interface IaReport {
    id: string; // ID de la valoración (Assessment)
    generatedReportText: string;
}

interface RHFValidationRules {
    required?: string | boolean; // react-hook-form puede tomar un string de mensaje o un booleano
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    min?: { value: number; message: string };
    max?: { value: number; message: string };
    // ... otras reglas que react-hook-form soporte
}

export default function DynamicFormPage() {
    const params = useParams();
    const router = useRouter();
    const valuationTypeId = params.valuationTypeId as string;

    const [formStructure, setFormStructure] = useState<ValuationTypeWithStructure | null>(null);
    const [isLoadingStructure, setIsLoadingStructure] = useState(true);
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [generatedIaReport, setGeneratedIaReport] = useState<IaReport | null>(null);

    const { control, handleSubmit, formState: { errors }, register, /*watch, setValue*/ } = useForm<FieldValues>({ // FieldValues para un objeto genérico
        defaultValues: {}, // Se poblarán dinámicamente
    });

    useEffect(() => {
        if (!valuationTypeId) return;

        const fetchFormStructure = async () => {
            setIsLoadingStructure(true);
            try {
                const response = await apiClient.get<ValuationTypeWithStructure>(`/app/forms/${valuationTypeId}/structure`);
                setFormStructure(response.data);
                // Inicializar defaultValues para react-hook-form
                const defaultVals: FieldValues = {};
                response.data.sections.forEach(section => {
                    section.fields.forEach(field => {
                        // Usar field.id como clave para el formulario
                        defaultVals[field.id] = field.defaultValue || ''; 
                        // Para checkboxes, el valor por defecto podría ser booleano
                        if (field.fieldType === 'checkbox') {
                            defaultVals[field.id] = field.defaultValue === 'true' || field.defaultValue === 'on' || false;
                        }
                    });
                });
                // No es necesario form.reset(defaultVals) si se usa en defaultValues de useForm,
                // pero si cargas después, sí. Por ahora, RHF manejará los campos registrados.
            } catch (error) {
                console.error("Error al cargar estructura del formulario:", error);
                toast.error("No se pudo cargar el formulario de valoración.");
                router.back(); // Volver si falla la carga
            } finally {
                setIsLoadingStructure(false);
            }
        };
        fetchFormStructure();
    }, [valuationTypeId, router]);

    const renderField = (field: FormFieldData) => {
        const fieldName = field.id; // Usar el ID del campo como nombre para RHF
        const rules = field.validationRules || {};
        const fieldRules: RHFValidationRules = {};
        if (rules.required) fieldRules.required = "Este campo es obligatorio.";
        if (rules.minLength) fieldRules.minLength = { value: rules.minLength, message: `Mínimo ${rules.minLength} caracteres.` };
        if (rules.maxLength) fieldRules.maxLength = { value: rules.maxLength, message: `Máximo ${rules.maxLength} caracteres.` };
        if (rules.pattern) fieldRules.pattern = { value: new RegExp(rules.pattern), message: rules.customMessage || "Formato inválido." };
        if (rules.min !== undefined) fieldRules.min = { value: rules.min, message: `Valor mínimo: ${rules.min}.`};
        if (rules.max !== undefined) fieldRules.max = { value: rules.max, message: `Valor máximo: ${rules.max}.`};


        switch (field.fieldType) {
            case 'text':
            case 'number':
            case 'email':
            case 'tel':
            case 'date':
                return <Input id={fieldName} type={field.fieldType} {...register(fieldName, fieldRules)} placeholder={field.placeholder || ''} />;
            case 'textarea':
                return <Textarea id={fieldName} {...register(fieldName, fieldRules)} placeholder={field.placeholder || ''} className="min-h-[100px]" />;
            case 'select':
                return (
                    <Controller
                        name={fieldName}
                        control={control}
                        rules={fieldRules}
                        render={({ field: controllerField }) => (
                            <Select onValueChange={controllerField.onChange} value={controllerField.value} defaultValue={controllerField.value}>
                                <SelectTrigger><SelectValue placeholder={field.placeholder || "Seleccione una opción"} /></SelectTrigger>
                                <SelectContent>
                                    {field.options?.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                );
            case 'radio':
                return (
                    <Controller
                        name={fieldName}
                        control={control}
                        rules={fieldRules}
                        render={({ field: controllerField }) => (
                            <RadioGroup onValueChange={controllerField.onChange} value={controllerField.value} className="flex flex-col space-y-1">
                                {field.options?.map(opt => (
                                    <div key={opt.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={opt.value} id={`${fieldName}-${opt.value}`} />
                                        <Label htmlFor={`${fieldName}-${opt.value}`}>{opt.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}
                    />
                );
            case 'checkbox': // Checkbox individual
                 return (
                    <Controller
                        name={fieldName}
                        control={control}
                        rules={fieldRules} // 'required' para checkbox significa que debe estar marcado
                        render={({ field: controllerField }) => (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={fieldName}
                                    checked={controllerField.value}
                                    onCheckedChange={controllerField.onChange}
                                />
                                <Label htmlFor={fieldName} className="font-normal">{field.label}</Label> {/* El label principal va afuera */}
                            </div>
                        )}
                    />
                );
            default:
                return <p className="text-red-500">Tipo de campo no soportado: {field.fieldType}</p>;
        }
    };

    const onSubmitForm: SubmitHandler<FieldValues> = async (data) => {
        setIsSubmittingForm(true);
        setGeneratedIaReport(null); // Limpiar informe previo
        try {
            const response = await apiClient.post('/app/assessments', {
                valuationTypeId,
                formData: data, // Aquí 'data' es el objeto con { fieldId: value }
            });
            toast.success(response.data.message || "Valoración enviada, generando informe...");
            // Asumimos que la respuesta incluye el assessment con el informe o al menos el ID
            if (response.data.assessment?.generatedReportText) {
                setGeneratedIaReport({
                    id: response.data.assessment.id,
                    generatedReportText: response.data.assessment.generatedReportText
                });
            } else if (response.data.assessment?.id) {
                // Si el informe no vino de inmediato, podríamos necesitar otra llamada para obtenerlo
                // o el backend lo generará asíncronamente. Por ahora, mostramos lo que hay.
                 setGeneratedIaReport({
                    id: response.data.assessment.id,
                    generatedReportText: "El informe se está procesando o no se pudo generar. Intente recargar o contacte soporte."
                });
                toast.info("El informe de la IA se está procesando.");
            }

        } catch (error) {
            console.error("Error al enviar valoración:", error);
            toast.error("Error al enviar la valoración. Por favor, inténtelo de nuevo.");
        } finally {
            setIsSubmittingForm(false);
        }
    };
    
    const handleDownloadPdf = async () => {
        if (!generatedIaReport?.id) return;
        try {
            const response = await apiClient.get(`/app/assessments/${generatedIaReport.id}/pdf`, {
                responseType: 'blob', // Importante para descargar archivos
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `informe_valoracion_${generatedIaReport.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("PDF descargado.");
        } catch (error) {
            console.error("Error al descargar PDF:", error);
            toast.error("No se pudo descargar el PDF.");
        }
    };


    if (isLoadingStructure) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Cargando formulario...</p></div>;
    }

    if (!formStructure) {
        return <div className="text-center py-10"><p>No se encontró la estructura del formulario.</p></div>;
    }

    return (
        <div className="space-y-6">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            <h1 className="text-2xl font-bold mb-2">{formStructure.name}</h1>
            {formStructure.description && <p className="text-sm text-muted-foreground mb-6">{formStructure.description}</p>}

            {!generatedIaReport ? (
                <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-8">
                    {formStructure.sections.sort((a,b)=>a.orderIndex - b.orderIndex).map(section => (
                        <Card key={section.id}>
                            <CardHeader>
                                <CardTitle>{section.title}</CardTitle>
                                {section.description && <CardDescription>{section.description}</CardDescription>}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {section.fields.sort((a,b)=>a.orderIndex - b.orderIndex).map(field => (
                                    <div key={field.id}>
                                        {/* Para checkbox, el Label principal está en renderField */}
                                        {field.fieldType !== 'checkbox' && (
                                            <Label htmlFor={field.id} className="mb-1 block text-sm font-medium">
                                                {field.label}
                                                {field.validationRules?.required && <span className="text-destructive ml-1">*</span>}
                                            </Label>
                                        )}
                                        {renderField(field)}
                                        {field.helpText && <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>}
                                        {errors[field.id] && <p className="text-sm text-destructive mt-1">{errors[field.id]?.message as string}</p>}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                    <Button type="submit" disabled={isSubmittingForm} className="w-full sm:w-auto">
                        {isSubmittingForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Send className="mr-2 h-4 w-4" /> Enviar Valoración y Generar Informe
                    </Button>
                </form>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Informe de Valoración Generado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="prose dark:prose-invert max-w-none bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                            <pre className="whitespace-pre-wrap font-sans text-sm">{generatedIaReport.generatedReportText}</pre>
                        </div>
                        <Button onClick={handleDownloadPdf} className="w-full sm:w-auto">
                            <FileDown className="mr-2 h-4 w-4" /> Descargar Informe PDF
                        </Button>
                        <Button variant="outline" onClick={() => setGeneratedIaReport(null)}  className="w-full sm:w-auto">
                            Realizar Nueva Valoración (Mismo Tipo)
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}