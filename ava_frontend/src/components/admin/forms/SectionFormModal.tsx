// src/components/admin/forms/SectionFormModal.tsx
'use client';

import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, /*DialogClose*/
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

// Esquema Zod (puede ser el mismo que tenías en FormBuilderPage o importado de un archivo de esquemas)
export const sectionFormSchema = z.object({
    title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres." }),
    description: z.string().optional().or(z.literal('')),
    orderIndex: z.coerce.number().int().min(0, { message: "El orden debe ser un número positivo." }),
});
export type SectionFormValues = z.infer<typeof sectionFormSchema>;

// Datos de una sección existente (para edición)
export interface ExistingSectionData {
    id: string;
    title: string;
    description?: string | null;
    orderIndex: number;
}

interface SectionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SectionFormValues, editingSectionId?: string) => Promise<void>; // onSubmit ahora puede recibir el ID
    editingSection: ExistingSectionData | null; // Null si es para crear
    isSubmitting: boolean;
    defaultOrderIndex?: number; // Para sugerir el orden al crear
}

export default function SectionFormModal({
    isOpen,
    onClose,
    onSubmit,
    editingSection,
    isSubmitting,
    defaultOrderIndex = 0
}: SectionFormModalProps) {
    const form = useForm<SectionFormValues>({
        resolver: zodResolver(sectionFormSchema),
        defaultValues: editingSection 
            ? { 
                title: editingSection.title, 
                description: editingSection.description || '', 
                orderIndex: editingSection.orderIndex 
              }
            : { title: '', description: '', orderIndex: defaultOrderIndex },
    });

    // Resetear el formulario cuando cambia `editingSection` o `defaultOrderIndex` (para creación)
    useEffect(() => {
        if (isOpen) { // Solo resetear si el modal está abierto o a punto de abrirse
            if (editingSection) {
                form.reset({
                    title: editingSection.title,
                    description: editingSection.description || '',
                    orderIndex: editingSection.orderIndex,
                });
            } else {
                form.reset({
                    title: '',
                    description: '',
                    orderIndex: defaultOrderIndex,
                });
            }
        }
    }, [editingSection, defaultOrderIndex, form, isOpen]);

    const handleFormSubmit: SubmitHandler<SectionFormValues> = (data) => {
        onSubmit(data, editingSection?.id); // Pasa el ID si se está editando
    };

    // Si el modal no está abierto, no renderizar nada o un fragmento vacío
    if (!isOpen) {
        return null; 
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}> {/* onClose se llama cuando el diálogo intenta cerrarse */}
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editingSection ? "Editar Sección" : "Añadir Nueva Sección"}</DialogTitle>
                    {editingSection && (
                         <DialogDescription>Editando: {editingSection.title}</DialogDescription>
                    )}
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="sectionTitleModal">Título de la Sección</Label>
                        <Input id="sectionTitleModal" {...form.register('title')} className="mt-1" />
                        {form.formState.errors.title && (
                            <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="sectionDescriptionModal">Descripción (Opcional)</Label>
                        <Textarea id="sectionDescriptionModal" {...form.register('description')} className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="sectionOrderIndexModal">Orden</Label>
                        <Input id="sectionOrderIndexModal" type="number" {...form.register('orderIndex')} className="mt-1" />
                         {form.formState.errors.orderIndex && (
                            <p className="text-sm text-red-600 mt-1">{form.formState.errors.orderIndex.message}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingSection ? "Guardar Cambios" : "Crear Sección"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}