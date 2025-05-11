// src/components/admin/forms/FieldFormModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { 
    ValidationRuleValues,
    FormFieldData as ExistingFieldData
} from '@/app/(admin)/valuation-types/[valuationTypeId]/builder/page'; // Ajusta la ruta
import { toast } from 'sonner';

// Esquema Zod para las opciones de select/radio/checkbox
const fieldOptionSchema = z.object({
    value: z.string().min(1, "El valor de la opción es requerido."),
    label: z.string().min(1, "La etiqueta de la opción es requerida."),
});

// Esquema Zod principal para el formulario de Campo
export const fieldFormSchema = z.object({
    label: z.string().min(1, { message: "La etiqueta del campo es requerida." }),
    fieldType: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'number', 'email', 'tel'], {
        required_error: "Debe seleccionar un tipo de campo.",
    }),
    placeholder: z.string().optional().or(z.literal('')),
    helpText: z.string().optional().or(z.literal('')),
    defaultValue: z.string().optional().or(z.literal('')),
    orderIndex: z.coerce.number().int().min(0, { message: "El orden debe ser un número positivo." }),
    options: z.array(fieldOptionSchema).optional(),
    validationRules: z.object({ // La estructura interna del objeto validationRules
        required: z.boolean().default(false), // 'required' tiene un default aquí
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
        pattern: z.string().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        customMessage: z.string().optional(),
    }).optional(), // <--- TODO el objeto validationRules es opcional
});
export type FieldFormValues = z.infer<typeof fieldFormSchema>;
// Ahora FieldFormValues['validationRules'] es:
// { required: boolean; minLength?: number; ... } | undefined

interface FieldFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FieldFormValues, editingFieldId?: string, sectionId?: string) => Promise<void>;
    editingField: ExistingFieldData | null;
    currentSectionId: string | null;
    isSubmitting: boolean;
    defaultOrderIndex?: number;
}

export default function FieldFormModal({
    isOpen,
    onClose,
    onSubmit,
    editingField,
    currentSectionId,
    isSubmitting,
    defaultOrderIndex = 0
}: FieldFormModalProps) {
    const form = useForm<FieldFormValues>({
        resolver: zodResolver(fieldFormSchema),
        defaultValues: { // Los valores por defecto deben ser compatibles con FieldFormValues
            label: '',
            fieldType: undefined, // Para que el Select placeholder funcione
            placeholder: '',
            helpText: '',
            defaultValue: '',
            orderIndex: defaultOrderIndex,
            options: [],
            // validationRules puede ser undefined aquí si es opcional en el esquema,
            // pero para que el Controller anidado funcione bien, es mejor inicializarlo.
            validationRules: { required: false }, // Inicializa con un objeto base
        },
    });

    const { fields: optionsFields, append: appendOption, remove: removeOption } = useFieldArray({
        control: form.control,
        name: "options"
    });

    const watchedFieldType = form.watch('fieldType');
    const showOptionsInput = ['select', 'radio', 'checkbox'].includes(watchedFieldType || '');

    const [otherValidationRulesString, setOtherValidationRulesString] = useState('{}');

    useEffect(() => {
        if (isOpen) {
            const defaultInnerValidationRules: ValidationRuleValues = { required: false };

            if (editingField) {
                const currentRulesObject = editingField.validationRules || {}; // Puede ser undefined
                const { required = false, ...otherRules } = currentRulesObject;

                form.reset({
                    label: editingField.label,
                    fieldType: editingField.fieldType as FieldFormValues['fieldType'],
                    placeholder: editingField.placeholder || '',
                    helpText: editingField.helpText || '',
                    defaultValue: editingField.defaultValue || '',
                    orderIndex: editingField.orderIndex,
                    options: editingField.options || [],
                    validationRules: { // Siempre un objeto para RHF
                        ...defaultInnerValidationRules, // Incluye todas las claves de ValidationRuleValues como opcionales
                        ...otherRules,                 // Sobrescribe con las otras reglas existentes
                        required: required,            // 'required' específico
                    },
                });
                setOtherValidationRulesString(Object.keys(otherRules).length > 0 ? JSON.stringify(otherRules, null, 2) : '{}');
            } else {
                form.reset({
                    label: '',
                    fieldType: undefined,
                    placeholder: '',
                    helpText: '',
                    defaultValue: '',
                    orderIndex: defaultOrderIndex,
                    options: [],
                    validationRules: defaultInnerValidationRules, // Objeto base para RHF
                });
                setOtherValidationRulesString('{}');
            }
        }
    }, [editingField, defaultOrderIndex, form, isOpen]);

    const handleFormSubmitInternal: SubmitHandler<FieldFormValues> = (data) => {
        const dataToSubmit = { ...data };

        if (!['select', 'radio', 'checkbox'].includes(dataToSubmit.fieldType)) {
            dataToSubmit.options = undefined;
        }

        try {
            const otherRulesParsed: Partial<ValidationRuleValues> = JSON.parse(otherValidationRulesString || '{}');
            const currentRequiredValue = data.validationRules?.required ?? false; // Obtener 'required' de forma segura

            // Empezar construyendo las reglas finales
            const finalRulesObject: ValidationRuleValues = {
                ...otherRulesParsed, // Otras reglas del textarea
                required: currentRequiredValue, // 'required' del checkbox
            };

            // Condición para determinar si el objeto de reglas está efectivamente "vacío"
            // (es decir, solo contiene 'required: false' y no hay otras reglas)
            const noOtherRules = Object.keys(otherRulesParsed).length === 0;
            const onlyRequiredFalseAndNoOtherRules = noOtherRules && finalRulesObject.required === false;

            // Si el objeto de reglas está "vacío" O si después de la fusión no tiene ninguna clave
            // (esto último es una doble comprobación por si acaso), entonces establecemos validationRules a undefined.
            if (onlyRequiredFalseAndNoOtherRules || Object.keys(finalRulesObject).length === 0) {
                dataToSubmit.validationRules = undefined;
            } else {
                // Si hay 'required: false' pero hay otras reglas, debemos eliminar 'required: false'
                // si no queremos enviarlo al backend (esto depende de tu API)
                // Por ahora, si 'required' es false y hay otras reglas, lo mantenemos.
                // Si tu API prefiere no tener 'required: false', descomenta lo siguiente:
                /*
                if (finalRulesObject.required === false) {
                    const { required, ...rulesWithoutRequiredFalse } = finalRulesObject;
                    if (Object.keys(rulesWithoutRequiredFalse).length > 0) {
                        dataToSubmit.validationRules = rulesWithoutRequiredFalse;
                    } else {
                        dataToSubmit.validationRules = undefined; // Si solo quedaba required:false
                    }
                } else {
                    dataToSubmit.validationRules = finalRulesObject;
                }
                */
                // Lógica simplificada por ahora: enviar el objeto tal como está si no está "vacío"
                dataToSubmit.validationRules = finalRulesObject;
            }

        } catch (e) {
            console.error("Error parseando JSON de otras reglas:", e);
            toast.error("El JSON de 'Otras Reglas de Validación' es inválido.");
            return;
        }
        
        onSubmit(dataToSubmit, editingField?.id, currentSectionId || undefined);
    };
    
    const handleOtherValidationRulesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setOtherValidationRulesString(e.target.value);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle>{editingField ? "Editar Campo" : "Añadir Nuevo Campo"}</DialogTitle>
                    {editingField && <DialogDescription>Editando el campo: &quot;{editingField.label}&quot;</DialogDescription>}
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleFormSubmitInternal)} className="space-y-4 mt-4">
                    {/* Label */}
                    <div>
                        <Label htmlFor="fieldLabelModal">Etiqueta del Campo</Label>
                        <Input id="fieldLabelModal" {...form.register('label')} className="mt-1" />
                        {form.formState.errors.label && <p className="text-sm text-red-600 mt-1">{form.formState.errors.label.message}</p>}
                    </div>

                    {/* Field Type */}
                    <div>
                        <Label htmlFor="fieldTypeModal">Tipo de Campo</Label>
                        <Controller
                            name="fieldType"
                            control={form.control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                    <SelectTrigger id="fieldTypeModal" className="mt-1">
                                        <SelectValue placeholder="Selecciona un tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Texto Corto</SelectItem>
                                        <SelectItem value="textarea">Texto Largo</SelectItem>
                                        <SelectItem value="select">Selección</SelectItem>
                                        <SelectItem value="radio">Opciones (Radio)</SelectItem>
                                        <SelectItem value="checkbox">Casilla (Checkbox individual)</SelectItem>
                                        <SelectItem value="date">Fecha</SelectItem>
                                        <SelectItem value="number">Número</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="tel">Teléfono</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {form.formState.errors.fieldType && <p className="text-sm text-red-600 mt-1">{form.formState.errors.fieldType.message}</p>}
                    </div>

                    {/* Options (condicional) */}
                    {showOptionsInput && (
                        <div className="space-y-3 p-4 border rounded-md bg-gray-50 dark:bg-gray-700/30">
                            <Label className="text-md font-semibold text-gray-700 dark:text-gray-200">Opciones para &quot;{watchedFieldType}&quot;</Label>
                            {optionsFields.map((item, index) => (
                                <div key={item.id} className="flex items-end space-x-2">
                                    <div className="flex-1">
                                        <Label htmlFor={`optionValue${index}`} className="text-xs">Valor (interno)</Label>
                                        <Input id={`optionValue${index}`} {...form.register(`options.${index}.value` as const)} placeholder="ej: opcion_1" />
                                    </div>
                                    <div className="flex-1">
                                        <Label htmlFor={`optionLabel${index}`} className="text-xs">Etiqueta (visible)</Label>
                                        <Input id={`optionLabel${index}`} {...form.register(`options.${index}.label` as const)} placeholder="Ej: Opción 1" />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-700/50 h-9 w-9">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {form.formState.errors.options && <p className="text-sm text-red-600 mt-1">Corrija los errores en las opciones.</p>}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendOption({ value: '', label: '' })} className="mt-2">
                                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Opción
                            </Button>
                        </div>
                    )}

                    {/* Placeholder, HelpText, DefaultValue, OrderIndex */}
                    <div><Label htmlFor="fieldPlaceholderModal">Texto de Ejemplo (Placeholder)</Label><Input id="fieldPlaceholderModal" {...form.register('placeholder')} className="mt-1" /></div>
                    <div><Label htmlFor="fieldHelpTextModal">Texto de Ayuda</Label><Textarea id="fieldHelpTextModal" {...form.register('helpText')} className="mt-1" /></div>
                    <div><Label htmlFor="fieldDefaultValueModal">Valor por Defecto</Label><Input id="fieldDefaultValueModal" {...form.register('defaultValue')} className="mt-1" /></div>
                    <div>
                        <Label htmlFor="fieldOrderIndexModal">Orden del Campo</Label>
                        <Input id="fieldOrderIndexModal" type="number" {...form.register('orderIndex')} className="mt-1" />
                        {form.formState.errors.orderIndex && <p className="text-sm text-red-600 mt-1">{form.formState.errors.orderIndex.message}</p>}
                    </div>
                    
                    {/* Validation Rules UI */}
                    <div className="pt-2 space-y-3 p-4 border rounded-md bg-gray-50 dark:bg-gray-700/30">
                        <Label className="text-md font-semibold text-gray-700 dark:text-gray-200">Reglas de Validación</Label>
                        <div className="items-top flex space-x-3">
                            {/* Controller para validationRules.required */}
                            <Controller
                                name="validationRules.required" // Accede a la propiedad anidada
                                control={form.control}
                                // RHF inicializará validationRules como {required: false} basado en defaultValues
                                render={({ field }) => (
                                    <Checkbox
                                        id="fieldRequiredModal"
                                        checked={field.value} // field.value será boolean
                                        onCheckedChange={field.onChange}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="fieldRequiredModal" className="text-sm font-medium">¿Campo Requerido?</Label>
                                <p className="text-xs text-muted-foreground">Marcar si este campo es obligatorio.</p>
                            </div>
                        </div>
                        {form.formState.errors.validationRules?.required && (
                            <p className="text-sm text-red-600 mt-1">{form.formState.errors.validationRules.required.message}</p>
                        )}

                        <div>
                            <Label htmlFor="fieldOtherValidationRulesModal">Otras Reglas (JSON)</Label>
                            <Textarea
                                id="fieldOtherValidationRulesModal"
                                value={otherValidationRulesString}
                                onChange={handleOtherValidationRulesChange}
                                className="mt-1 min-h-[80px] font-mono text-sm"
                                placeholder='Ej: { "minLength": 5 }'
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingField ? "Guardar Cambios" : "Crear Campo"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}