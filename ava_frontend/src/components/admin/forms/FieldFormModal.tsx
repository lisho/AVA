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
//import { Checkbox } from '@/components/ui/checkbox'; // Si la necesitas para validationRules UI
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { ValidationRuleValues, FormFieldData as ExistingFieldData } from '@/app/(admin)/valuation-types/[valuationTypeId]/builder/page'; // Importa tipos de la página builder

// Esquema Zod para el formulario de Campo
// Este esquema necesita ser flexible para options y validationRules
const fieldOptionSchema = z.object({
    value: z.string().min(1, "El valor de la opción es requerido."),
    label: z.string().min(1, "La etiqueta de la opción es requerida."),
});

export const fieldFormSchema = z.object({
    label: z.string().min(1, { message: "La etiqueta del campo es requerida." }),
    fieldType: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'number', 'email', 'tel'], {
        required_error: "Debe seleccionar un tipo de campo.",
    }),
    placeholder: z.string().optional().or(z.literal('')),
    helpText: z.string().optional().or(z.literal('')),
    defaultValue: z.string().optional().or(z.literal('')),
    orderIndex: z.coerce.number().int().min(0, { message: "El orden debe ser un número positivo." }),
    options: z.array(fieldOptionSchema).optional(), // Array de {value: string, label: string}
    validationRules: z.custom<ValidationRuleValues>((data) => { // Permite un objeto JSON, pero valida con la interfaz
        // Aquí podrías añadir validación más específica si es necesario,
        // o confiar en que el objeto se ajusta a ValidationRuleValues
        return typeof data === 'object' || data === undefined;
    }).optional(),
});

export type FieldFormValues = z.infer<typeof fieldFormSchema>;

interface FieldFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FieldFormValues, editingFieldId?: string, sectionId?: string) => Promise<void>;
    editingField: ExistingFieldData | null; // Null si es para crear
    currentSectionId: string | null; // Necesario para crear un nuevo campo en la sección correcta
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
        defaultValues: { // Se establecerán en useEffect
            label: '',
            fieldType: undefined, // Para que el Select placeholder funcione
            placeholder: '',
            helpText: '',
            defaultValue: '',
            orderIndex: defaultOrderIndex,
            options: [],
            validationRules: {},
        },
    });

    const { fields: optionsFields, append: appendOption, remove: removeOption } = useFieldArray({
        control: form.control,
        name: "options"
    });

    const watchedFieldType = form.watch('fieldType');
    const showOptionsInput = ['select', 'radio', 'checkbox'].includes(watchedFieldType || '');

    useEffect(() => {
        if (isOpen) {
            if (editingField) {
                form.reset({
                    label: editingField.label,
                    fieldType: editingField.fieldType as FieldFormValues['fieldType'], // Cast si es necesario
                    placeholder: editingField.placeholder || '',
                    helpText: editingField.helpText || '',
                    defaultValue: editingField.defaultValue || '',
                    orderIndex: editingField.orderIndex,
                    options: editingField.options || [],
                    validationRules: editingField.validationRules || {},
                });
            } else {
                form.reset({
                    label: '',
                    fieldType: undefined,
                    placeholder: '',
                    helpText: '',
                    defaultValue: '',
                    orderIndex: defaultOrderIndex,
                    options: [],
                    validationRules: {},
                });
            }
        }
    }, [editingField, defaultOrderIndex, form, isOpen]);

    const handleFormSubmitInternal: SubmitHandler<FieldFormValues> = (data) => {
        // Limpiar options si el tipo de campo no los usa
        const dataToSubmit = { ...data };
        if (!['select', 'radio', 'checkbox'].includes(dataToSubmit.fieldType)) {
            dataToSubmit.options = undefined;
        }
        onSubmit(dataToSubmit, editingField?.id, currentSectionId || undefined);
    };
    
    // Para validationRules, convertiremos el objeto a JSON string para el Textarea
    // y al cargar, de JSON string a objeto. (Si usas Textarea para JSON)
    // Si construyes una UI para validationRules, este manejo cambia.
    const [validationRulesString, setValidationRulesString] = useState('');

    useEffect(() => {
        if (editingField?.validationRules) {
            setValidationRulesString(JSON.stringify(editingField.validationRules, null, 2));
        } else {
            setValidationRulesString('{}');
        }
    }, [editingField, isOpen]); // Recalcular cuando el modal se abre o cambia el campo a editar

    const handleValidationRulesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValidationRulesString(e.target.value);
        try {
            const parsedRules = JSON.parse(e.target.value);
            form.setValue('validationRules', parsedRules as ValidationRuleValues, { shouldValidate: true });
        } catch (err) {
            // Podrías mostrar un error si el JSON es inválido, o esperar a la validación de Zod
            form.setError('validationRules', { type: 'manual', message: 'JSON de reglas inválido.' });
            console.error("Detalles del error:", err); // Ahora 'error' se usa

        }
    };


    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingField ? "Editar Campo" : "Añadir Nuevo Campo"}</DialogTitle>
                    {editingField && <DialogDescription>Editando: {editingField.label}</DialogDescription>}
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleFormSubmitInternal)} className="space-y-4 py-4">
                    {/* Label */}
                    <div>
                        <Label htmlFor="fieldLabel">Etiqueta del Campo</Label>
                        <Input id="fieldLabel" {...form.register('label')} className="mt-1" />
                        {form.formState.errors.label && <p className="text-sm text-red-600 mt-1">{form.formState.errors.label.message}</p>}
                    </div>

                    {/* Field Type */}
                    <div>
                        <Label htmlFor="fieldType">Tipo de Campo</Label>
                        <Controller
                            name="fieldType"
                            control={form.control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                    <SelectTrigger id="fieldType" className="mt-1">
                                        <SelectValue placeholder="Selecciona un tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Texto Corto (Input)</SelectItem>
                                        <SelectItem value="textarea">Texto Largo (Textarea)</SelectItem>
                                        <SelectItem value="select">Selección (Dropdown)</SelectItem>
                                        <SelectItem value="radio">Opciones (Radio)</SelectItem>
                                        <SelectItem value="checkbox">Casilla Única (Checkbox)</SelectItem> {/* O Múltiples Checkboxes como grupo? */}
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
                        <div className="space-y-3 p-3 border rounded-md">
                            <Label className="text-base font-medium">Opciones para &quot;{watchedFieldType}&quot;</Label>
                            {optionsFields.map((item, index) => (
                                <div key={item.id} className="flex items-center space-x-2">
                                    <Input {...form.register(`options.${index}.value` as const)} placeholder="Valor (interno)" className="flex-1" />
                                    <Input {...form.register(`options.${index}.label` as const)} placeholder="Etiqueta (visible)" className="flex-1" />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} className="text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {/* Mostrar errores para el array de opciones o sus items si es necesario */}
                            {form.formState.errors.options?.root && <p className="text-sm text-red-600 mt-1">{form.formState.errors.options.root.message}</p>}
                            {optionsFields.map((_, index) => (
                                form.formState.errors.options?.[index]?.value && <p key={`err-val-${index}`} className="text-sm text-red-600">{form.formState.errors.options[index]?.value?.message}</p>
                            ))}
                             {optionsFields.map((_, index) => (
                                form.formState.errors.options?.[index]?.label && <p key={`err-lab-${index}`} className="text-sm text-red-600">{form.formState.errors.options[index]?.label?.message}</p>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendOption({ value: '', label: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Opción
                            </Button>
                        </div>
                    )}

                    {/* Placeholder, HelpText, DefaultValue */}
                    <div><Label htmlFor="fieldPlaceholder">Texto de Ejemplo (Placeholder)</Label><Input id="fieldPlaceholder" {...form.register('placeholder')} className="mt-1" /></div>
                    <div><Label htmlFor="fieldHelpText">Texto de Ayuda</Label><Textarea id="fieldHelpText" {...form.register('helpText')} className="mt-1" /></div>
                    <div><Label htmlFor="fieldDefaultValue">Valor por Defecto</Label><Input id="fieldDefaultValue" {...form.register('defaultValue')} className="mt-1" /></div>
                    
                    {/* Order Index */}
                    <div>
                        <Label htmlFor="fieldOrderIndex">Orden del Campo</Label>
                        <Input id="fieldOrderIndex" type="number" {...form.register('orderIndex')} className="mt-1" />
                        {form.formState.errors.orderIndex && <p className="text-sm text-red-600 mt-1">{form.formState.errors.orderIndex.message}</p>}
                    </div>

                    {/* Validation Rules (como Textarea para JSON) */}
                    <div>
                        <Label htmlFor="fieldValidationRules">Reglas de Validación (JSON)</Label>
                        <Textarea
                            id="fieldValidationRules"
                            value={validationRulesString}
                            onChange={handleValidationRulesChange}
                            className="mt-1 min-h-[100px] font-mono text-sm"
                            placeholder='Ej: { "required": true, "minLength": 5 }'
                        />
                        {form.formState.errors.validationRules && <p className="text-sm text-red-600 mt-1">{form.formState.errors.validationRules.message}</p>}
                    </div>

                    <DialogFooter>
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