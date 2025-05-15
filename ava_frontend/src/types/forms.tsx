// src/types/forms.ts
import * as z from 'zod';

// Interfaz de referencia, no usada directamente por Zod para inferir FieldFormValues
/*
export interface ValidationRuleValues {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    customMessage?: string;


const fieldOptionSchema = z.object({
    value: z.string().min(1, "El valor de la opción es requerido."),
    label: z.string().min(1, "La etiqueta de la opción es requerida."),
});

export const fieldFormSchema = z.object({
    label: z.string().min(1, { message: "La etiqueta del campo es requerida." }),
    fieldType: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox', 'checkbox-group', 'date', 'number', 'email', 'tel'], {
        required_error: "Debe seleccionar un tipo de campo.",
    }),
    placeholder: z.string().trim().optional().or(z.literal('')), // trim() para evitar problemas con espacios
    helpText: z.string().trim().optional().or(z.literal('')),
    defaultValue: z.string().trim().optional().or(z.literal('')),
    orderIndex: z.coerce.number().int().min(0, { message: "El orden debe ser un número positivo." }),
    options: z.array(fieldOptionSchema).optional(),
    validationRules: z.object({
        required: z.boolean(), // NO .default(false) aquí
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
        pattern: z.string().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        customMessage: z.string().optional(),
    }).default({ required: false }), // El default se aplica al objeto entero
});
*/
export const fieldFormSchema = z.object({
    label: z.string(),
    fieldType: z.enum(["number", "date", "text", "textarea", "select", "radio", "checkbox", "checkbox-group", "email", "tel"]),
    orderIndex: z.number(),
    options: z.array(z.object({
        label: z.string(),
        value: z.string(),
    })).optional(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    defaultValue: z.string().optional(),
    validationRules: z.object({
        required: z.boolean(),
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
        pattern: z.string().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        customMessage: z.string().optional(),
    }).default({ required: false }), // Ensure default matches expected type
});

export type FieldFormValues = z.infer<typeof fieldFormSchema>;
// FieldFormValues['validationRules'] será { required: boolean; minLength?: number ... }

// Otros tipos que puedas necesitar para los formularios