// src/components/admin/forms/FieldEditorForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useFormContext, Controller, useFieldArray, SubmitHandler, /*FieldValues, Path, RegisterOptions*/ } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
//import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { FieldFormValues} from '@/types/forms';
import { ValidationRuleValues } from '@/types/assessment'; // Asegúrate de que esto esté correcto

interface FieldEditorFormProps {
    onSubmit: SubmitHandler<FieldFormValues>; // CAMBIADO EL NOMBRE DE LA PROP
    isSubmitting: boolean;
    initialOtherValidationRulesString?: string;
    onClose?: () => void;
    isEditing: boolean;
}

export default function FieldEditorForm({
    onSubmit, // CAMBIADO EL NOMBRE DE LA PROP
    isSubmitting,
    initialOtherValidationRulesString = '{}',
    onClose,
    isEditing
}: FieldEditorFormProps) {
    const { 
        register, 
        control, 
        handleSubmit, 
        watch, 
        //setValue, 
        setError, 
        //getValues,
        formState: { errors } 
    } = useFormContext<FieldFormValues>();

    const { fields: optionsFields, append: appendOption, remove: removeOption } = useFieldArray({
        control, name: "options"
    });

    const watchedFieldType = watch('fieldType');
    const showOptionsInput = ['select', 'radio', 'checkbox-group'].includes(watchedFieldType || '');
    const [otherValidationRulesString, setOtherValidationRulesString] = useState(initialOtherValidationRulesString);
    
    useEffect(() => {
        setOtherValidationRulesString(initialOtherValidationRulesString);
    }, [initialOtherValidationRulesString]);

    const handleFormSubmit: SubmitHandler<FieldFormValues> = (data) => {  // Renombrado de handleLocalSubmit
        const dataToProcess = { ...data };

        if (!['select', 'radio', 'checkbox-group'].includes(dataToProcess.fieldType)) {
            dataToProcess.options = undefined;
        }

        try {
            const otherRulesParsed: Partial<ValidationRuleValues> = JSON.parse(otherValidationRulesString || '{}');
            const currentRequiredValue = dataToProcess.validationRules.required;

            let finalValidationRulesObject: ValidationRuleValues | undefined = {
                ...otherRulesParsed,
                required: currentRequiredValue,
            };

            const noOtherRules = Object.keys(otherRulesParsed).length === 0;
            if (noOtherRules && finalValidationRulesObject.required === false) {
                finalValidationRulesObject = undefined;
            } else if (Object.keys(finalValidationRulesObject).length === 0) {
                 finalValidationRulesObject = undefined;
            }
            
            const finalDataToSend = {
                ...dataToProcess,
                validationRules: finalValidationRulesObject // Puede ser undefined
            };
            
            console.log("[FieldEditorForm] Datos finales a enviar al modal (onSubmit):", JSON.stringify(finalDataToSend, null, 2));
            
            onSubmit(finalDataToSend as FieldFormValues); // Llama al onSubmit del padre (FieldFormModal)

        } catch (e) {
            console.error("Error parseando JSON de otras reglas:", e);
            setError("validationRules", {type: "manual", message: "El JSON de 'Otras Reglas de Validación' es inválido."});
            return;
        }
    };

    const handleOtherValidationRulesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setOtherValidationRulesString(e.target.value);
        // Validación temprana opcional del JSON
        try {
            JSON.parse(e.target.value || '{}');
             // Si hay un error manual en validationRules, podrías intentar limpiarlo aquí
             // form.clearErrors('validationRules'); // Si la estructura de error lo permite
        } catch {
            // No es necesario poner setError aquí, el submit lo capturará
        }
    };
    
    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            {/* Label */}
            <div>
                <Label htmlFor="fieldFormEditorLabel">Etiqueta</Label> {/* Cambiado ID */}
                <Input id="fieldFormEditorLabel" {...register('label')} className="mt-1" />
                {errors.label && <p className="text-sm text-red-600 mt-1">{errors.label.message}</p>}
            </div>

            {/* Field Type */}
            <div>
                <Label htmlFor="fieldFormEditorType">Tipo</Label> {/* Cambiado ID */}
                <Controller
                    name="fieldType"
                    control={control}
                    render={({ field }) => (
                        <Select 
                            onValueChange={field.onChange} 
                            value={field.value || ""}
                            defaultValue={field.value}
                        >
                            <SelectTrigger id="fieldFormEditorType" className="mt-1">
                                <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Texto Corto</SelectItem>
                                <SelectItem value="textarea">Texto Largo</SelectItem>
                                <SelectItem value="select">Selección</SelectItem>
                                <SelectItem value="radio">Opciones (Radio)</SelectItem>
                                <SelectItem value="checkbox">Casilla Única (Sí/No)</SelectItem>
                                <SelectItem value="checkbox-group">Grupo de Casillas</SelectItem>
                                <SelectItem value="date">Fecha</SelectItem>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="tel">Teléfono</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.fieldType && <p className="text-sm text-red-600 mt-1">{errors.fieldType.message}</p>}
            </div>

            {/* Options (condicional) */}
            {showOptionsInput && (
                <div className="space-y-3 p-4 border rounded-md bg-gray-50 dark:bg-gray-700/30">
                    <Label className="text-md font-semibold text-gray-700 dark:text-gray-200">Opciones para &quot;{watchedFieldType}&quot;</Label>
                    {optionsFields.map((item, index) => (
                        <div key={item.id} className="flex items-end space-x-2">
                            <div className="flex-1">
                                <Label htmlFor={`optionValue${index}`} className="text-xs">Valor (interno)</Label>
                                <Input id={`optionValue${index}`} {...register(`options.${index}.value` as const)} placeholder="ej: opcion_1" />
                                {errors.options?.[index]?.value && <p className="text-sm text-red-600 mt-1">{errors.options[index]?.value?.message}</p>}
                            </div>
                            <div className="flex-1">
                                <Label htmlFor={`optionLabel${index}`} className="text-xs">Etiqueta (visible)</Label>
                                <Input id={`optionLabel${index}`} {...register(`options.${index}.label` as const)} placeholder="Ej: Opción 1" />
                                {errors.options?.[index]?.label && <p className="text-sm text-red-600 mt-1">{errors.options[index]?.label?.message}</p>}
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-700/50 h-9 w-9">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {errors.options && typeof errors.options.message === 'string' && (<p className="text-sm text-red-600 mt-1">{errors.options.message}</p>)}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendOption({ value: '', label: '' })} className="mt-2">
                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir Opción
                    </Button>
                </div>
            )}

            {/* Placeholder, HelpText, DefaultValue, OrderIndex */}
            <div><Label htmlFor="fieldFormEditorPlaceholder">Placeholder</Label><Input id="fieldFormEditorPlaceholder" {...register('placeholder')} className="mt-1" /></div>
            <div><Label htmlFor="fieldFormEditorHelpText">Texto de Ayuda</Label><Textarea id="fieldFormEditorHelpText" {...register('helpText')} className="mt-1" /></div>
            <div><Label htmlFor="fieldFormEditorDefaultValue">Valor por Defecto</Label><Input id="fieldFormEditorDefaultValue" {...register('defaultValue')} className="mt-1" /></div>
            <div>
                <Label htmlFor="fieldFormEditorOrderIndex">Orden</Label>
                <Input id="fieldFormEditorOrderIndex" type="number" {...register('orderIndex')} className="mt-1" />
                {errors.orderIndex && <p className="text-sm text-red-600 mt-1">{errors.orderIndex.message}</p>}
            </div>
            
            {/* Validation Rules UI */}
            <div className="pt-2 space-y-3 p-4 border rounded-md bg-gray-50 dark:bg-gray-700/30">
                <Label className="text-md font-semibold text-gray-700 dark:text-gray-200">Reglas de Validación</Label>
                <div className="items-top flex space-x-3">
                    <Controller
                        name="validationRules.required" // Accede a la propiedad anidada
                        control={control}
                        render={({ field }) => ( // field.value será boolean aquí
                            <Checkbox
                                id="fieldFormEditorRequired"
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                                onBlur={field.onBlur}
                            />
                        )}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="fieldFormEditorRequired" className="text-sm font-medium">¿Campo Requerido?</Label>
                        <p className="text-xs text-muted-foreground">Marcar si este campo es obligatorio.</p>
                    </div>
                </div>
                {errors.validationRules?.required && (
                    <p className="text-sm text-red-600 mt-1">{errors.validationRules.required.message}</p>
                )}

                <div>
                    <Label htmlFor="fieldFormEditorOtherValidationRules">Otras Reglas (JSON)</Label>
                    <Textarea
                        id="fieldFormEditorOtherValidationRules"
                        value={otherValidationRulesString}
                        onChange={handleOtherValidationRulesChange}
                        className="mt-1 min-h-[80px] font-mono text-sm"
                        placeholder='Ej: { "minLength": 5 }'
                    />
                     {errors.validationRules && typeof errors.validationRules.message === 'string' && !errors.validationRules.required && ( // Solo muestra si es un error general de validationRules
                        <p className="text-sm text-red-600 mt-1">{errors.validationRules.message}</p>
                    )}
                </div>
            </div>

            <DialogFooter className="pt-4">
                {onClose && <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Guardar Cambios" : "Crear Campo"}
                </Button>
            </DialogFooter>
        </form>
    );
}