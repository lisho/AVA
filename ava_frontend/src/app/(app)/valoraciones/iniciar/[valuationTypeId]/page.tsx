// src/app/(app)/valoraciones/iniciar/[valuationTypeId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react'; // useCallback añadido si es necesario
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import axios from 'axios'; // Para isAxiosError
import { useForm, Controller, SubmitHandler, FieldValues, Path, RegisterOptions, /*PathValue*/ } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Send, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { 
    FormFieldData, 
    /*FormSectionData, */
    ValuationTypeWithStructure 
} from '@/app/(admin)/valuation-types/[valuationTypeId]/builder/page'; // Reutiliza interfaces

// Interfaz para el informe de la IA
interface IaReport {
    id: string; // ID de la valoración (Assessment)
    generatedReportText: string;
}

// Esto es un poco más avanzado, podrías empezar con una interfaz más simple si quieres.
type RHFValidationRules = Pick<
    RegisterOptions,
    'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'validate'
>;

type RHFNumberValidationRules = Pick<
    RegisterOptions,
    'required' | 'min' | 'max' | 'validate' // Solo reglas válidas para números
>;

/*
interface RHFValidationRules {
    required?: string | boolean; // react-hook-form puede tomar un string de mensaje o un booleano
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    min?: { value: number; message: string };
    max?: { value: number; message: string };
    // ... otras reglas que react-hook-form soporte
}
*/

export default function DynamicFormPage() {
    const params = useParams();
    const router = useRouter();
    const valuationTypeId = params.valuationTypeId as string;

    const [formStructure, setFormStructure] = useState<ValuationTypeWithStructure | null>(null);
    const [isLoadingStructure, setIsLoadingStructure] = useState(true);
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [generatedIaReport, setGeneratedIaReport] = useState<IaReport | null>(null);

    // Usaremos un tipo más específico para los valores del formulario si es posible,
    // pero FieldValues es un buen fallback para formularios completamente dinámicos.
    // Idealmente, las claves serían los IDs de los FormFieldData.
    const { 
        control, 
        handleSubmit, 
        formState: { errors }, 
        register, 
        //watch, // watch puede ser útil para lógica condicional en el formulario
        //setValue, // setValue es útil para campos controlados como Select o RadioGroup
        reset // Para resetear el formulario si es necesario
    } = useForm<FieldValues>({
        defaultValues: {}, // Se poblarán después de cargar la estructura
    });

    // Cargar estructura del formulario
    const fetchFormStructure = useCallback(async () => {
        if (!valuationTypeId) return;
        setIsLoadingStructure(true);
        try {
            const response = await apiClient.get<ValuationTypeWithStructure>(`/app/forms/${valuationTypeId}/structure`);
            setFormStructure(response.data);
            
            // Inicializar defaultValues para react-hook-form DESPUÉS de cargar la estructura
            const defaultVals: FieldValues = {};
            response.data.sections.forEach(section => {
                section.fields.forEach(field => {
                    // Usar field.id como clave para el formulario
                    // Aquí field.defaultValue es el que configuraste en el builder
                    if (field.fieldType === 'checkbox') {
                        defaultVals[field.id] = field.defaultValue === 'true' || field.defaultValue === 'on' || false;
                    } else {
                        defaultVals[field.id] = field.defaultValue || '';
                    }
                });
            });
            reset(defaultVals); // Usar reset para establecer los valores por defecto
            console.log("Estructura de formulario cargada y valores por defecto establecidos:", response.data, defaultVals);

        } catch (error) {
            console.error("Error al cargar estructura del formulario:", error);
            toast.error("No se pudo cargar el formulario de valoración.");
            router.back();
        } finally {
            setIsLoadingStructure(false);
        }
    }, [valuationTypeId, router, reset]); // Añadir reset a las dependencias

    useEffect(() => {
        fetchFormStructure();
    }, [fetchFormStructure]);


        const renderField = (field: FormFieldData) => {
        const fieldName = field.id as Path<FieldValues>;
        const inputValidationRules = field.validationRules || {};
        
        // Construye las reglas base aplicables a la mayoría de los tipos
        const baseRules: RHFValidationRules = {};
        if (inputValidationRules.required) {
            baseRules.required = inputValidationRules.customMessage || "Este campo es obligatorio.";
        }

        // Reglas específicas para strings
        const stringRules: RHFValidationRules = { ...baseRules };
        if (inputValidationRules.minLength !== undefined) {
            stringRules.minLength = { value: inputValidationRules.minLength, message: inputValidationRules.customMessage || `Mínimo ${inputValidationRules.minLength} caracteres.` };
        }
        if (inputValidationRules.maxLength !== undefined) {
            stringRules.maxLength = { value: inputValidationRules.maxLength, message: inputValidationRules.customMessage || `Máximo ${inputValidationRules.maxLength} caracteres.` };
        }
        if (inputValidationRules.pattern) {
            try {
                stringRules.pattern = { value: new RegExp(inputValidationRules.pattern), message: inputValidationRules.customMessage || "Formato inválido." };
            } catch (e) {
                console.warn(`Patrón de regex inválido para el campo ${field.label}: ${inputValidationRules.pattern}`, e);
            }
        }

        // Reglas específicas para números
        const numberRules: RHFNumberValidationRules = {}; // <--- USA EL NUEVO TIPO
        if (inputValidationRules.required) { // 'required' es común
            numberRules.required = inputValidationRules.customMessage || "Este campo es obligatorio.";
        }
        if (inputValidationRules.min !== undefined) {
            numberRules.min = { value: inputValidationRules.min, message: inputValidationRules.customMessage || `El valor mínimo es ${inputValidationRules.min}.` };
        }
        if (inputValidationRules.max !== undefined) {
            numberRules.max = { value: inputValidationRules.max, message: inputValidationRules.customMessage || `El valor máximo es ${inputValidationRules.max}.` };
        }


        switch (field.fieldType) {
            case 'text':
            case 'email':
            case 'tel':
            // case 'date': // 'date' podría no necesitar min/maxLength o pattern, pero sí required
                return <Input id={fieldName} type={field.fieldType} {...register(fieldName, stringRules)} placeholder={field.placeholder || ''} defaultValue={field.defaultValue || ''} />;
            
            case 'date': // Separado por si quieres validaciones específicas de fecha en el futuro
                 return <Input id={fieldName} type="date" {...register(fieldName, baseRules)} placeholder={field.placeholder || ''} defaultValue={field.defaultValue || ''} />;

            case 'number':
                 return <Input 
                            id={fieldName} 
                            type="number" 
                            {...register(fieldName, { ...numberRules, valueAsNumber: true })} // Solo pasar numberRules
                            placeholder={field.placeholder || ''} 
                            defaultValue={field.defaultValue || ''} 
                        />;
            case 'textarea':
                return <Textarea id={fieldName} {...register(fieldName, stringRules)} placeholder={field.placeholder || ''} className="min-h-[100px]" defaultValue={field.defaultValue || ''} />;
            
            case 'select':
                return (
                    <Controller
                        name={fieldName}
                        control={control}
                        rules={baseRules}
                        defaultValue={field.defaultValue || ""} // defaultValue para Controller
                        render={({ field: controllerField }) => (
                            <Select onValueChange={controllerField.onChange} value={controllerField.value}>
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
                        rules={baseRules}
                        defaultValue={field.defaultValue || ""}
                        render={({ field: controllerField }) => (
                            <RadioGroup onValueChange={controllerField.onChange} value={controllerField.value} className="flex flex-col space-y-1 mt-1">
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
                        // 'required' para checkbox significa que debe estar marcado si es true
                        rules={inputValidationRules.required ? { required: "Debe aceptar esta opción." } : {}}
                        defaultValue={field.defaultValue === 'true' || false}
                        render={({ field: controllerField }) => (
                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox
                                    id={fieldName}
                                    checked={controllerField.value}
                                    onCheckedChange={controllerField.onChange}
                                />
                                {/* El Label principal del campo checkbox se muestra fuera, este es para el texto junto al checkbox si es necesario */}
                                {/* <Label htmlFor={fieldName} className="font-normal">{field.label}</Label> */}
                            </div>
                        )}
                    />
                );
            default:
                return <p className="text-red-500">Tipo de campo no soportado: {field.fieldType}</p>;
        }
    };

    const onSubmitForm: SubmitHandler<FieldValues> = async (formDataFromHook) => {
        setIsSubmittingForm(true);
        setGeneratedIaReport(null);
        console.log("Datos del formulario a enviar:", formDataFromHook);
        try {
            const response = await apiClient.post<{ assessment: IaReport, message?: string }>('/app/assessments', { // Ajustar tipo de respuesta
                valuationTypeId,
                formData: formDataFromHook,
            });
            toast.success(response.data.message || "Valoración enviada, generando informe...");
            
            if (response.data.assessment) {
                setGeneratedIaReport({
                    id: response.data.assessment.id,
                    generatedReportText: response.data.assessment.generatedReportText
                });
            } else {
                toast.error("No se recibió la valoración procesada del servidor.");
            }

        } catch (error) {
            console.error("Error al enviar valoración:", error);
            let errorMessage = "Error al enviar la valoración.";
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            toast.error(errorMessage + " Por favor, inténtelo de nuevo.");
        } finally {
            setIsSubmittingForm(false);
        }
    };
    
    const handleDownloadPdf = useCallback(async () => { // useCallback para que no se recree innecesariamente
        if (!generatedIaReport?.id) return;
        try {
            const response = await apiClient.get(`/app/assessments/${generatedIaReport.id}/pdf`, {
                responseType: 'blob',
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
    }, [generatedIaReport]); // Depende de generatedIaReport



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
                    {formStructure?.sections.sort((a,b)=>a.orderIndex - b.orderIndex).map(section => (
                        <Card key={section.id} className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">{section.title}</CardTitle>
                                {section.description && <CardDescription className="text-sm">{section.description}</CardDescription>}
                            </CardHeader>
                            <CardContent className="space-y-6"> {/* Aumentado el espacio */}
                                {section.fields.sort((a,b)=>a.orderIndex - b.orderIndex).map(field => (
                                    <div key={field.id}>
                                        <Label htmlFor={field.id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {field.label}
                                            {field.validationRules?.required && <span className="text-destructive ml-1">*</span>}
                                        </Label>
                                        {renderField(field)}
                                        {field.helpText && <p className="text-xs text-muted-foreground mt-1.5">{field.helpText}</p>}
                                        {errors[field.id] && <p className="text-sm text-destructive mt-1.5">{errors[field.id]?.message as string}</p>}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                    <Button type="submit" disabled={isSubmittingForm || !formStructure} className="w-full sm:w-auto text-base py-3 px-6">
                        {isSubmittingForm && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        <Send className="mr-2 h-5 w-5" /> Enviar y Generar Informe
                    </Button>
                </form>
            ) : (
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl">Informe Generado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="prose dark:prose-invert max-w-none bg-slate-100 dark:bg-slate-800 p-4 rounded-md border dark:border-slate-700">
                            {generatedIaReport.generatedReportText ? (
                                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{generatedIaReport.generatedReportText}</pre>
                            ) : (
                                <p className="text-center text-amber-600 dark:text-amber-400">El informe no pudo ser generado por la IA o está vacío.</p>
                            )}
                        </div>
                        {generatedIaReport.generatedReportText && ( // Solo mostrar botón si hay informe
                             <Button onClick={handleDownloadPdf} className="w-full sm:w-auto">
                                <FileDown className="mr-2 h-4 w-4" /> Descargar PDF
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => { setGeneratedIaReport(null); reset({}); /*fetchFormStructure();*/ } }  className="w-full sm:w-auto">
                            Realizar Nueva Valoración (Mismo Tipo)
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}