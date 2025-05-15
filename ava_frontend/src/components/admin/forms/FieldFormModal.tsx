// src/components/admin/forms/FieldFormModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { FormFieldData as ExistingFieldData } from '@/types/assessment'; // Usa FormFieldData directamente

import { 
    fieldFormSchema, 
    FieldFormValues, 
    //ValidationRuleValues 
} from '@/types/forms';
import FieldEditorForm from './FieldEditorForm';

interface FieldFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitBackend: (data: FieldFormValues, editingFieldId?: string, sectionIdToSubmit?: string) => Promise<void>;
    editingField: ExistingFieldData | null; // Usa FormFieldData (alias ExistingFieldData)
    currentSectionId: string;
    isSubmitting: boolean;
    defaultOrderIndex?: number;
}

export default function FieldFormModal({
    isOpen,
    onClose,
    onSubmitBackend,
    editingField,
    currentSectionId,
    isSubmitting,
    defaultOrderIndex = 0
}: FieldFormModalProps) {
    
    const formMethods = useForm<FieldFormValues>({
        resolver: zodResolver(fieldFormSchema),
        defaultValues: { // Establecer defaults explícitos que coincidan con el schema
            label: '',
            fieldType: undefined, // o un valor enum por defecto
            placeholder: '',
            helpText: '',
            defaultValue: '',
            orderIndex: 0, // Se sobrescribirá en useEffect
            options: [],
            validationRules: { required: false }, // Coincide con el .default({required: false}) del schema
        },
    });

    const [initialOtherRulesStringForEditor, setInitialOtherRulesStringForEditor] = useState('{}');

    useEffect(() => {
        if (isOpen) {
            const baseValidationRulesForForm: FieldFormValues['validationRules'] = {
                 required: false,
                 // otras opcionales son undefined por defecto
            };
            
            let otherRulesForTextareaString = '{}';

            if (editingField) {
                const existingValRulesInField = editingField.validationRules || {}; // Puede ser undefined
                
                const finalValidationRulesForReset: FieldFormValues['validationRules'] = {
                    ...baseValidationRulesForForm, // Inicia con required: false y otras undefined
                    ...existingValRulesInField, // Sobrescribe con lo que tenga el campo
                    required: existingValRulesInField.required ?? false, // Asegura que required sea boolean
                };

                formMethods.reset({
                    label: editingField.label || '',
                    fieldType: editingField.fieldType as FieldFormValues['fieldType'], // Cast si es necesario
                    placeholder: editingField.placeholder || '',
                    helpText: editingField.helpText || '',
                    defaultValue: editingField.defaultValue || '',
                    orderIndex: editingField.orderIndex,
                    options: editingField.options || [],
                    validationRules: finalValidationRulesForReset,
                });

                const otherRules = { ...finalValidationRulesForReset }; // Tomar de las reglas ya fusionadas
                if (Object.keys(otherRules).length > 0) {
                    otherRulesForTextareaString = JSON.stringify(otherRules, null, 2);
                }
            } else {
                // Creando nuevo campo
                formMethods.reset({
                    label: '',
                    fieldType: undefined,
                    placeholder: '',
                    helpText: '',
                    defaultValue: '',
                    orderIndex: defaultOrderIndex,
                    options: [],
                    validationRules: baseValidationRulesForForm,
                });
                otherRulesForTextareaString = '{}'; // Resetear para el textarea
            }
            setInitialOtherRulesStringForEditor(otherRulesForTextareaString);
        }
    }, [editingField, defaultOrderIndex, formMethods, isOpen]);

    // Esta es la función que FieldEditorForm llamará (como 'onSubmit')
    const handleProcessAndRelaySubmit: SubmitHandler<FieldFormValues> = (processedDataFromEditor) => {
        const sectionIdToUse = editingField ? editingField.sectionId : currentSectionId;

        if (!editingField && !sectionIdToUse) {
            toast.error("Error: No se pudo determinar la sección para el nuevo campo.");
            console.error("FieldFormModal: sectionIdToUse es undefined al intentar crear un campo.");
            return;
        }

        console.log("[FieldFormModal] Datos procesados a enviar al backend (onSubmitBackend):", JSON.stringify(processedDataFromEditor, null, 2));
        onSubmitBackend(processedDataFromEditor, editingField?.id, sectionIdToUse);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle>{editingField ? "Editar Campo" : "Añadir Nuevo Campo"}</DialogTitle>
                    {editingField && <DialogDescription>Editando: &quot;{editingField.label}&quot; (Sección ID: {editingField.sectionId})</DialogDescription>}
                    {!editingField && <DialogDescription>Añadiendo campo a la Sección ID: {currentSectionId}</DialogDescription>}
                </DialogHeader>
                <FormProvider {...formMethods}>
                    <FieldEditorForm
                        onSubmit={handleProcessAndRelaySubmit} // Prop 'onSubmit'
                        isSubmitting={isSubmitting}
                        initialOtherValidationRulesString={initialOtherRulesStringForEditor}
                        onClose={onClose}
                        isEditing={!!editingField}
                    />
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}