// src/app/(admin)/valuation-types/[valuationTypeId]/builder/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react'; // useCallback añadido
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import axios from 'axios'; // Para isAxiosError
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card"; // Asegúrate que Card esté importado si lo usas para las secciones
import { Loader2, ArrowLeft, PlusCircle, Edit, Trash2, FileText } from 'lucide-react';

// Importa el modal de sección y sus tipos
import SectionFormModal, { 
    SectionFormValues as ModalSectionFormValues,
    ExistingSectionData as ModalExistingSectionData 
} from '@/components/admin/forms/SectionFormModal'; // Ajusta la ruta si es diferente

// Importa el modal de campo y sus tipos (cuando lo crees)
import FieldFormModal, { 
    FieldFormValues as ModalFieldFormValues 
} from '@/components/admin/forms/FieldFormModal'; // Ajusta la ruta si es diferente

// Interfaces para la estructura de datos principal
export interface FormFieldData { // Exportar para posible uso en FieldFormModal
    id: string;
    label: string;
    fieldType: string;
    sectionId: string;
    options?: Array<{ value: string; label: string }>;
    validationRules?: ValidationRuleValues; // Usaremos ValidationRuleValues de abajo
    orderIndex: number;
    placeholder?: string | null;
    helpText?: string | null;
    defaultValue?: string | null;
    // ... otros campos que necesites del backend
}

// Interfaz para las reglas de validación (reemplaza Record<string, any>)
export interface ValidationRuleValues {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    customMessage?: string;
}

export interface FormSectionData { // Exportar para posible uso en FieldFormModal
    id: string;
    title: string;
    description?: string | null;
    orderIndex: number;
    fields: FormFieldData[];
    // ... otros campos que necesites del backend
}

export interface ValuationTypeWithStructure { // Exportar para posible uso en otros lugares
    id: string;
    name: string;
    description?: string | null;
    systemPrompt: string; // Asegúrate que esto viene del backend
    isActive: boolean; // Asegúrate que esto viene del backend
    sections: FormSectionData[];
    // ... otros campos que necesites del backend
}

export default function FormBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const valuationTypeId = params.valuationTypeId as string;

    const [valuationTypeData, setValuationTypeData] = useState<ValuationTypeWithStructure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Estados para el modal de Sección
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<ModalExistingSectionData | null>(null);
    const [isSubmittingSection, setIsSubmittingSection] = useState(false);
    const [nextSectionOrderIndex, setNextSectionOrderIndex] = useState(0);

    // Estados para el diálogo de confirmación de borrado de sección
    const [sectionToDelete, setSectionToDelete] = useState<FormSectionData | null>(null);
    const [isDeleteSectionConfirmOpen, setIsDeleteSectionConfirmOpen] = useState(false);

    // Estados para el modal de Campo (a implementar después)
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<FormFieldData | null>(null); // Usa tu tipo FormFieldData aquí
    const [currentSectionIdForField, setCurrentSectionIdForField] = useState<string | null>(null);
    const [isSubmittingField, setIsSubmittingField] = useState(false);
    const [nextFieldOrderIndex, setNextFieldOrderIndex] = useState(0);

    // Función para cargar/recargar la estructura del tipo de valoración
    const fetchValuationTypeStructure = useCallback(async () => {
        if (!valuationTypeId) {
            console.log("fetchValuationTypeStructure: valuationTypeId es nulo, no se carga.");
            setIsLoading(false); // Detener carga si no hay ID
            return;
        }
        console.log("fetchValuationTypeStructure: Iniciando carga para ID:", valuationTypeId);
        setIsLoading(true);
        try {
            const response = await apiClient.get<ValuationTypeWithStructure>(`/admin/valuation-types/${valuationTypeId}`);
            setValuationTypeData(response.data);
            const sections = response.data.sections;
            const nextOrder = sections && sections.length > 0
                ? Math.max(...sections.map(s => s.orderIndex)) + 1
                : 0;
            setNextSectionOrderIndex(nextOrder);
            // toast.success(`Estructura para "${response.data.name}" cargada.`); // Puede ser mucho toast
            console.log(`Estructura para "${response.data.name}" cargada.`);
        } catch (error) {
            console.error("Error al cargar la estructura del tipo de valoración:", error);
            toast.error("No se pudo cargar la estructura del formulario.");
            // Considera redirigir si no se encuentra
            // router.push('/valuation-types'); 
        } finally {
            setIsLoading(false);
            console.log("fetchValuationTypeStructure: Carga finalizada para ID:", valuationTypeId);
        }
    }, [valuationTypeId]); // Dependencias de useCallback: apiClient y toast son estables

    useEffect(() => {
        fetchValuationTypeStructure();
    }, [fetchValuationTypeStructure]); // useEffect depende de la función memoizada

    // --- MANEJADORES PARA SECCIONES ---
    const handleOpenAddSectionModal = () => {
        setEditingSection(null);
        setIsSectionModalOpen(true);
        // defaultOrderIndex se pasa a SectionFormModal
    };

    const handleEditSection = (section: FormSectionData) => {
        setEditingSection({ // Mapea los datos de FormSectionData a ModalExistingSectionData
            id: section.id,
            title: section.title,
            description: section.description,
            orderIndex: section.orderIndex,
        });
        setIsSectionModalOpen(true);
    };

    const handleSaveSection = async (data: ModalSectionFormValues, editingSectionId?: string) => {
        if (!valuationTypeId) {
            toast.error("ID del tipo de valoración no encontrado.");
            return;
        }
        setIsSubmittingSection(true);
        try {
            if (editingSectionId) {
                await apiClient.put(`/admin/sections/${editingSectionId}`, data);
                toast.success(`Sección "${data.title}" actualizada.`);
            } else {
                await apiClient.post(`/admin/valuation-types/${valuationTypeId}/sections`, data);
                toast.success(`Sección "${data.title}" creada.`);
            }
            setIsSectionModalOpen(false);
            await fetchValuationTypeStructure(); // Recargar
        } catch (error) {
            let errorMessage = editingSectionId ? "Error al actualizar la sección" : "Error al crear la sección";
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || error.message || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
            console.error("Error al guardar la sección:", error);
        } finally {
            setIsSubmittingSection(false);
        }
    };
    
    const openDeleteSectionConfirm = (section: FormSectionData) => {
        setSectionToDelete(section);
        setIsDeleteSectionConfirmOpen(true);
    };
    
    const handleDeleteSection = async () => {
        if (!sectionToDelete) return;
        setIsSubmittingSection(true); // Reutiliza el estado de submitting
        try {
            await apiClient.delete(`/admin/sections/${sectionToDelete.id}`);
            toast.success(`Sección "${sectionToDelete.title}" eliminada.`);
            await fetchValuationTypeStructure(); // Recargar
        } catch (error) {
            let errorMessage = "Error al eliminar la sección.";
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || error.message || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
            console.error("Error al eliminar sección:", error);
        } finally {
            setIsSubmittingSection(false);
            setIsDeleteSectionConfirmOpen(false);
            setSectionToDelete(null);
        }
    };

        // --- MANEJADORES PARA CAMPOS ---
    const handleOpenAddFieldModal = (sectionId: string) => {
        const section = valuationTypeData?.sections.find(s => s.id === sectionId);
        const nextOrder = section && section.fields.length > 0
            ? Math.max(...section.fields.map(f => f.orderIndex)) + 1
            : 0;
        setNextFieldOrderIndex(nextOrder);
        setEditingField(null);
        setCurrentSectionIdForField(sectionId);
        setIsFieldModalOpen(true);
    };

    const handleEditField = (field: FormFieldData, sectionId: string) => {
        setEditingField(field);
        setCurrentSectionIdForField(sectionId); // Aunque el ID del campo es único, saber la sección puede ser útil
        setIsFieldModalOpen(true);
        // El useEffect en FieldFormModal se encargará de resetear el form con los datos de editingField
    };

    const handleSaveField = async (data: ModalFieldFormValues, editingFieldId?: string, sectionIdContext?: string) => {
        const sectionIdForApi = editingField ? editingField.sectionId : sectionIdContext; // Determina sectionId para la API
        
        if (!sectionIdForApi) {
            toast.error("No se pudo determinar la sección para el campo.");
            return;
        }
        setIsSubmittingField(true);
        try {
            if (editingFieldId) {
                // Actualizar Campo
                await apiClient.put(`/admin/fields/${editingFieldId}`, data);
                toast.success(`Campo "${data.label}" actualizado.`);
            } else {
                // Crear Nuevo Campo
                await apiClient.post(`/admin/sections/${sectionIdForApi}/fields`, data);
                toast.success(`Campo "${data.label}" creado.`);
            }
            setIsFieldModalOpen(false);
            await fetchValuationTypeStructure(); // Recargar toda la estructura
        } catch (error) {
            let errorMessage = editingFieldId ? "Error al actualizar el campo" : "Error al crear el campo";
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || error.message || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
            console.error("Error al guardar el campo:", error);
        } finally {
            setIsSubmittingField(false);
        }
    };
    
    // Estado y manejador para confirmación de borrado de campo
    const [fieldToDelete, setFieldToDelete] = useState<FormFieldData | null>(null);
    const [isDeleteFieldConfirmOpen, setIsDeleteFieldConfirmOpen] = useState(false);

    const openDeleteFieldConfirm = (field: FormFieldData) => {
        setFieldToDelete(field);
        setIsDeleteFieldConfirmOpen(true);
    };

    const handleDeleteField = async () => {
        if (!fieldToDelete) return;
        setIsSubmittingField(true);
        try {
            await apiClient.delete(`/admin/fields/${fieldToDelete.id}`);
            toast.success(`Campo "${fieldToDelete.label}" eliminado.`);
            await fetchValuationTypeStructure(); // Recargar
        } catch (error) {
            toast.error("Un error genérico ocurrió.");
            console.error("Detalles del error:", error); // Ahora 'error' se usa
        }finally {
            setIsSubmittingField(false);
            setIsDeleteFieldConfirmOpen(false);
            setFieldToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-lg">Cargando constructor de formulario...</p>
            </div>
        );
    }

    if (!valuationTypeData) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-red-600 mb-4">No se pudo cargar la información del tipo de valoración.</p>
                <Button variant="outline" onClick={() => router.push('/valuation-types')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Tipos de Valoración
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/valuation-types')} className="mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        Constructor: <span className="text-primary">{valuationTypeData.name}</span>
                    </h1>
                    {valuationTypeData.description && (
                        <p className="text-sm md:text-md text-gray-600 dark:text-gray-400 mt-1">{valuationTypeData.description}</p>
                    )}
                </div>
                <Button onClick={handleOpenAddSectionModal} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Sección
                </Button>
            </div>

            {/* Listado de Secciones */}
            <div className="space-y-6">
                {valuationTypeData.sections.length === 0 && (
                    <Card className="text-center text-gray-500 dark:text-gray-400 py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                        <h3 className="text-lg font-medium">Este formulario aún no tiene secciones.</h3>
                        <p className="text-sm">¡Añade una sección para empezar a construir tu formulario!</p>
                    </Card>
                )}
                {valuationTypeData.sections
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((section) => (
                    <Card key={section.id} className="overflow-hidden"> {/* Usando Card para cada sección */}
                        <div className="p-4 sm:p-6 bg-white dark:bg-gray-800">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                                <div className="mb-2 sm:mb-0">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{section.title}</h2>
                                    {section.description && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{section.description}</p>}
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEditSection(section)}>
                                        <Edit className="mr-1 h-4 w-4" /> Editar
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => openDeleteSectionConfirm(section)}>
                                        <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                                    </Button>
                                </div>
                            </div>
                        
                            {/* Listado de Campos para esta sección */}
                            <div className="space-y-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {section.fields.length === 0 && (
                                     <p className="text-sm text-center text-gray-400 dark:text-gray-500 py-4">Esta sección no tiene campos.</p>
                                )}
                                {section.fields
                                    .sort((a,b) => a.orderIndex - b.orderIndex)
                                    .map((field) => (
                                    <div key={field.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-700 dark:text-gray-200">{field.label}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Tipo: {field.fieldType} | Orden: {field.orderIndex}
                                                {field.placeholder && ` | Placeholder: ${field.placeholder}`}
                                            </p>
                                        </div>
                                        <div className="flex space-x-1">

                                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar Campo" onClick={() => handleEditField(field, section.id)} >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" title="Eliminar Campo" onClick={() => openDeleteFieldConfirm(field)} >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <div className="mt-4">
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => handleOpenAddFieldModal(section.id)} >
                                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir Campo a &quot;{section.title}&quot;
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* MODAL PARA CREAR/EDITAR SECCIÓN (componente externo) */}
            <SectionFormModal
                isOpen={isSectionModalOpen}
                onClose={() => setIsSectionModalOpen(false)}
                onSubmit={handleSaveSection}
                editingSection={editingSection}
                isSubmitting={isSubmittingSection}
                defaultOrderIndex={nextSectionOrderIndex}
            />

            {/* MODAL DE CONFIRMACIÓN DE BORRADO DE SECCIÓN */}
            <Dialog open={isDeleteSectionConfirmOpen} onOpenChange={setIsDeleteSectionConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Eliminación de Sección</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar la sección &quot;{sectionToDelete?.title}&quot;? 
                            Todos sus campos también serán eliminados. Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setIsDeleteSectionConfirmOpen(false)} disabled={isSubmittingSection}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteSection} disabled={isSubmittingSection}>
                            {isSubmittingSection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar Sección
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* RENDERIZA EL MODAL DE CAMPO */}
            <FieldFormModal
                isOpen={isFieldModalOpen}
                onClose={() => setIsFieldModalOpen(false)}
                onSubmit={handleSaveField}
                editingField={editingField}
                currentSectionId={currentSectionIdForField}
                isSubmitting={isSubmittingField}
                defaultOrderIndex={nextFieldOrderIndex}
            />

            {/* MODAL DE CONFIRMACIÓN DE BORRADO DE CAMPO */}
            <Dialog open={isDeleteFieldConfirmOpen} onOpenChange={setIsDeleteFieldConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Confirmar Eliminación de Campo</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar el campo &quot;{fieldToDelete?.label}&quot;? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteFieldConfirmOpen(false)} disabled={isSubmittingField}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDeleteField} disabled={isSubmittingField}>
                            {isSubmittingField && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Eliminar Campo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}