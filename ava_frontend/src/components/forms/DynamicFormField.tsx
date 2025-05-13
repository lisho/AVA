// src/components/forms/DynamicFormField.tsx
'use client';

import { Control, Controller, FieldValues, Path, RegisterOptions, UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FormFieldData, ValidationRuleValues } from '@/types/assessment'; // Asumiendo que están en src/types/index.ts

// Tipo para las reglas que react-hook-form espera
type RHFBaseValidationRules = Pick<
    RegisterOptions<FieldValues, Path<FieldValues>>, // Usar FieldValues y Path para generalizar
    'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'validate'
>;

type RHFNumberValidationRules = Pick<
    RegisterOptions<FieldValues, Path<FieldValues>>,
    'required' | 'min' | 'max' | 'validate' // Solo reglas válidas para números
>;

interface DynamicFormFieldProps {
    field: FormFieldData;
    control: Control<FieldValues>; // Control de RHF
    register: UseFormRegister<FieldValues>; // Register de RHF
    //errors: any; // Errores de RHF (puedes tiparlo más estrictamente si tienes un tipo global para errores)
}

export default function DynamicFormField({ 
    field, 
    control, 
    register, 
    //errors 
}: DynamicFormFieldProps) {
    const fieldName = field.id as Path<FieldValues>; // Usar el ID del campo como nombre
    const inputValidationRules = field.validationRules || {} as ValidationRuleValues; // Reglas de tu estructura

    let rulesForRHF: RegisterOptions<FieldValues, Path<FieldValues>> = {};

if (field.fieldType === 'number') {
        const numericRules: RHFNumberValidationRules = {};
        if (inputValidationRules.required) numericRules.required = inputValidationRules.customMessage || "Este campo es obligatorio.";
        if (inputValidationRules.min !== undefined) numericRules.min = { value: inputValidationRules.min, message: inputValidationRules.customMessage || `El valor mínimo es ${inputValidationRules.min}.` };
        if (inputValidationRules.max !== undefined) numericRules.max = { value: inputValidationRules.max, message: inputValidationRules.customMessage || `El valor máximo es ${inputValidationRules.max}.` };
        rulesForRHF = { ...numericRules, valueAsNumber: true };
    } else {
        // Para otros tipos, construir reglas más generales (RHFBaseValidationRules)
        const generalRules: RHFBaseValidationRules = {};
        if (inputValidationRules.required) generalRules.required = inputValidationRules.customMessage || "Este campo es obligatorio.";
        if (inputValidationRules.minLength !== undefined) generalRules.minLength = { value: inputValidationRules.minLength, message: inputValidationRules.customMessage || `Mínimo ${inputValidationRules.minLength} caracteres.` };
        if (inputValidationRules.maxLength !== undefined) generalRules.maxLength = { value: inputValidationRules.maxLength, message: inputValidationRules.customMessage || `Máximo ${inputValidationRules.maxLength} caracteres.` };
        if (inputValidationRules.pattern) {
            try {
                generalRules.pattern = { value: new RegExp(inputValidationRules.pattern), message: inputValidationRules.customMessage || "Formato inválido." };
            } catch (e) { console.warn(`Patrón Regex inválido: ${inputValidationRules.pattern}`, e); }
        }
        // min/max pueden aplicar a la longitud de un string también si se quiere,
        // pero son más comunes para números. Si los quieres para string, añádelos a generalRules.
        // if (inputValidationRules.min !== undefined) generalRules.min = { value: inputValidationRules.min, message: ... };
        // if (inputValidationRules.max !== undefined) generalRules.max = { value: inputValidationRules.max, message: ... };
        rulesForRHF = generalRules;
    }

/*

    // Construir reglas base (solo 'required' por ahora)
    const baseRules: RHFNumberValidationRules = {}; // Podríamos usar RHFNumberValidationRules como base si solo 'required', 'min', 'max' se aplican
    if (inputValidationRules.required) {
        baseRules.required = inputValidationRules.customMessage || "Este campo es obligatorio.";
    }

    // Construir reglas para RHF
    const rhfRules: RHFValidationRules = {};
    if (inputValidationRules.required) {
        rhfRules.required = inputValidationRules.customMessage || "Este campo es obligatorio.";
    }
    // ... (resto de la lógica para construir rhfRules: minLength, maxLength, pattern, min, max)
    if (inputValidationRules.minLength !== undefined) {
        rhfRules.minLength = { value: inputValidationRules.minLength, message: inputValidationRules.customMessage || `Mínimo ${inputValidationRules.minLength} caracteres.` };
    }
    if (inputValidationRules.maxLength !== undefined) {
        rhfRules.maxLength = { value: inputValidationRules.maxLength, message: inputValidationRules.customMessage || `Máximo ${inputValidationRules.maxLength} caracteres.` };
    }
    if (inputValidationRules.pattern) {
        try {
            rhfRules.pattern = { value: new RegExp(inputValidationRules.pattern), message: inputValidationRules.customMessage || "Formato inválido." };
        } catch (e) { console.warn(`Patrón Regex inválido: ${inputValidationRules.pattern}`, e); }
    }
    if (inputValidationRules.min !== undefined) {
        rhfRules.min = { value: inputValidationRules.min, message: inputValidationRules.customMessage || `El valor mínimo es ${inputValidationRules.min}.` };
    }
    if (inputValidationRules.max !== undefined) {
        rhfRules.max = { value: inputValidationRules.max, message: inputValidationRules.customMessage || `El valor máximo es ${inputValidationRules.max}.` };
    }

    
    // Reglas específicas para diferentes tipos de campos
    const stringAndTextAreaRules: RHFValidationRules = {...rhfRules}; // Incluye pattern, minLength, maxLength
    const numberSpecificRules: RHFValidationRules = { // Solo required, min, max
        ...(rhfRules.required && {required: rhfRules.required}),
        ...(rhfRules.min && {min: rhfRules.min}),
        ...(rhfRules.max && {max: rhfRules.max}),
    };
*/

    switch (field.fieldType) {
        case 'text':
        case 'email':
        case 'tel':
            //return <Input id={fieldName} type={field.fieldType} {...register(fieldName, stringAndTextAreaRules)} placeholder={field.placeholder || ''} />;
         case 'date': // Date no usa valueAsNumber, usa las reglas generales
            return <Input id={fieldName} type={field.fieldType} {...register(fieldName, rulesForRHF)} placeholder={field.placeholder || ''} />;
        case 'number':
            // rulesForRHF ya incluye valueAsNumber: true para este caso
            return <Input id={fieldName} type="number" {...register(fieldName, rulesForRHF)} placeholder={field.placeholder || ''} />;
        case 'textarea':
            return <Textarea id={fieldName} {...register(fieldName, rulesForRHF)} placeholder={field.placeholder || ''} className="min-h-[100px]" />;
        case 'select':
            return (
                <Controller
                    name={fieldName}
                    control={control}
                    rules={rulesForRHF} // 'required' es la más común aquí
                    render={({ field: controllerField }) => (
                        <Select 
                            onValueChange={controllerField.onChange} 
                            value={controllerField.value || ""} // Asegurar que value no sea null/undefined para Select
                            defaultValue={controllerField.value || ""}
                        >
                            <SelectTrigger id={fieldName}><SelectValue placeholder={field.placeholder || "Seleccione una opción"} /></SelectTrigger>
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
                    rules={rulesForRHF} // 'required'
                    render={({ field: controllerField }) => (
                        <RadioGroup 
                            onValueChange={controllerField.onChange} 
                            value={controllerField.value || ""}
                            className="flex flex-col space-y-1 mt-1"
                        >
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
        case 'checkbox':
             return (
                <Controller
                    name={fieldName}
                    control={control}
                    rules={inputValidationRules.required ? { required: inputValidationRules.customMessage || "Debe marcar esta opción." } : {}}
                    render={({ field: controllerField }) => (
                        <div className="flex items-center space-x-2 pt-1">
                            <Checkbox
                                id={fieldName}
                                checked={!!controllerField.value} // Asegurar que es boolean
                                onCheckedChange={controllerField.onChange} // onChange espera boolean
                            />
                            {/* El Label principal se renderiza fuera de este componente */}
                        </div>
                    )}
                />
            );
        default:
            return <p className="text-sm text-red-600">Tipo de campo no soportado: {field.fieldType}</p>;
    }
}