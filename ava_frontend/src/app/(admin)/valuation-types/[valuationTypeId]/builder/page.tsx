// src/app/(admin)/valuation-types/[valuationTypeId]/builder/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import axios from 'axios'; // Para isAxiosError
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft, PlusCircle } from 'lucide-react'; // Edit, Trash2, FileText se usarán en FormStructureDisplay

// Importa tipos desde tu archivo centralizado
import { 
    FormFieldData, 
    FormSectionData, 
    ValuationTypeWithStructure 
} from '@/types/assessment'; // Ajusta la ruta si es necesario

// Importa modales y sus tipos/esquemas de valor de formulario
import SectionFormModal, { 
    SectionFormValues as ModalSectionFormValues, // Este es el tipo de datos del formulario de sección
    ExistingSectionData as ModalExistingSectionData // Este es para la prop editingSection del modal
} from '@/components/admin/forms/SectionFormModal';

import FieldFormModal from '@/components/admin/forms/FieldFormModal'; 

import { 
    FieldFormValues as ModalFieldFormValues // Este es el tipo de datos del formulario de campo
} from '@/types/forms'; // FormFieldData se usa para editingField

// Importa el nuevo componente de display
import FormStructureDisplay from '@/components/admin/builder/FormStructureDisplay';

export default function FormBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const valuationTypeId = params.valuationTypeId as string;

    const [valuationTypeData, setValuationTypeData] = useState<ValuationTypeWithStructure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // --- Estados para Modal de Sección ---
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [editingSectionData, setEditingSectionData] = useState<ModalExistingSectionData | null>(null); // Para pasar al modal
    const [isSubmittingSection, setIsSubmittingSection] = useState(false);
    const [nextSectionOrderIndex, setNextSectionOrderIndex] = useState(0);
    
    // --- Estados para Diálogo de Confirmación Borrado Sección ---
    const [sectionToDelete, setSectionToDelete] = useState<FormSectionData | null>(null);
    const [isDeleteSectionConfirmOpen, setIsDeleteSectionConfirmOpen] = useState(false);

    // --- Estados para Modal de Campo ---
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [editingFieldData, setEditingFieldData] = useState<FormFieldData | null>(null); // Para pasar al modal
    const [currentSectionIdForFieldModal, setCurrentSectionIdForFieldModal] = useState<string | null>(null);
    const [isSubmittingField, setIsSubmittingField] = useState(false);
    const [nextFieldOrderIndex, setNextFieldOrderIndex] = useState(0);

    // --- Estados para Diálogo de Confirmación Borrado Campo ---
    const [fieldToDelete, setFieldToDelete] = useState<FormFieldData | null>(null);
    const [isDeleteFieldConfirmOpen, setIsDeleteFieldConfirmOpen] = useState(false);


    // --- Carga de Datos Inicial ---
    const fetchValuationTypeStructure = useCallback(async () => {
        if (!valuationTypeId) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const response = await apiClient.get<ValuationTypeWithStructure>(`/admin/valuation-types/${valuationTypeId}`);
            setValuationTypeData(response.data);
            const sections = response.data.sections;
            const nextOrder = sections && sections.length > 0 ? Math.max(...sections.map(s => s.orderIndex)) + 1 : 0;
            setNextSectionOrderIndex(nextOrder);
        } catch (error) {
            console.error("Error al cargar la estructura del tipo de valoración:", error);
            toast.error("No se pudo cargar la estructura del formulario.");
        } finally {
            setIsLoading(false);
        }
    }, [valuationTypeId]);

    useEffect(() => {
        fetchValuationTypeStructure();
    }, [fetchValuationTypeStructure]);


    // --- MANEJADORES DE ACCIONES PARA SECCIONES (pasados a FormStructureDisplay o usados por modales) ---
    const handleTriggerAddSection = useCallback(() => {
        setEditingSectionData(null); // No estamos editando
        // nextSectionOrderIndex se pasa al modal
        setIsSectionModalOpen(true);
    }, []);

    const handleTriggerEditSection = useCallback((section: FormSectionData) => {
        setEditingSectionData({ // Mapea al tipo que espera el SectionFormModal
            id: section.id,
            title: section.title,
            description: section.description,
            orderIndex: section.orderIndex,
        });
        setIsSectionModalOpen(true);
    }, []);

    const handleTriggerDeleteSection = useCallback((section: FormSectionData) => {
        setSectionToDelete(section);
        setIsDeleteSectionConfirmOpen(true);
    }, []);

    const executeSaveSection = useCallback(async (data: ModalSectionFormValues, editingSectionId?: string) => {
        if (!valuationTypeId) return; // Debería estar siempre presente
        setIsSubmittingSection(true);
        try {
            if (editingSectionId) {
                // Si editingSectionId está definido, significa que estamos editando una sección existente
                console.log(`[FormBuilderPage executeSaveSection] PUT a /admin/sections/${editingSectionId}. Payload:`, JSON.stringify(data, null, 2));
                await apiClient.put(`/admin/sections/${editingSectionId}`, data);
                toast.success(`Sección "${data.title}" actualizada.`);
            } else {
                await apiClient.post(`/admin/valuation-types/${valuationTypeId}/sections`, data);
                toast.success(`Sección "${data.title}" creada.`);
            }
            setIsSectionModalOpen(false);
            await fetchValuationTypeStructure();
        } catch (error) { 
             let errorMessage = "Error al eliminar el campo."; // Mensaje genérico
    if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    toast.error(errorMessage);
    console.error("Error eliminando campo:", error);
        }
        finally { setIsSubmittingSection(false); }
    }, [valuationTypeId, fetchValuationTypeStructure]);
    
    const executeDeleteSection = useCallback(async () => {
        if (!sectionToDelete) return;
        setIsSubmittingSection(true); // Reusar para el spinner del diálogo
        try {
            await apiClient.delete(`/admin/sections/${sectionToDelete.id}`);
            toast.success(`Sección "${sectionToDelete.title}" eliminada.`);
            await fetchValuationTypeStructure();
        } catch (error) { 
             let errorMessage = "Error al eliminar el campo."; // Mensaje genérico
    if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    toast.error(errorMessage);
    console.error("Error eliminando campo:", error);
        }
        finally {
            setIsSubmittingSection(false);
            setIsDeleteSectionConfirmOpen(false);
            setSectionToDelete(null);
        }
    }, [sectionToDelete, fetchValuationTypeStructure]);


    // --- MANEJADORES DE ACCIONES PARA CAMPOS (pasados a FormStructureDisplay o usados por modales) ---
    const handleTriggerAddField = useCallback((sectionId: string) => {
        const section = valuationTypeData?.sections.find(s => s.id === sectionId);
        const nextOrder = section && section.fields.length > 0 ? Math.max(...section.fields.map(f => f.orderIndex)) + 1 : 0;
        setNextFieldOrderIndex(nextOrder);
        setEditingFieldData(null); // No estamos editando
        setCurrentSectionIdForFieldModal(sectionId); // ID de la sección para el nuevo campo
        setIsFieldModalOpen(true);
    }, [valuationTypeData]);

    const handleTriggerEditField = useCallback((field: FormFieldData) => {
        setEditingFieldData(field); // field ya es del tipo FormFieldData
        setCurrentSectionIdForFieldModal(field.sectionId); // Para el modal, aunque el ID del campo es lo principal para editar
        setIsFieldModalOpen(true);
    }, []);

    const handleTriggerDeleteField = useCallback((field: FormFieldData) => {
        setFieldToDelete(field);
        setIsDeleteFieldConfirmOpen(true);
    }, []);

    const executeSaveField = useCallback(async (
        data: ModalFieldFormValues, 
        editingFieldId?: string, 
        sectionIdForCreation?: string 
    ) => {        
        const isEditingCurrentField = !!editingFieldId;
        // Si estamos editando, el sectionId ya está asociado al campo y la API PUT no lo necesita en el body.
        // Si estamos creando, sectionIdForCreation (que es currentSectionIdForFieldModal) es el ID de la sección padre.
        const targetSectionId = isEditingCurrentField ? editingFieldData?.sectionId : sectionIdForCreation;

        if (!isEditingCurrentField && !targetSectionId) {
            toast.error("Error: No se pudo determinar la sección para crear el campo.");
            setIsSubmittingField(false); return;
        }
        setIsSubmittingField(true);
        try {
            if (isEditingCurrentField && editingFieldId) { // Doble check para editingFieldId
                console.log(`[FormBuilderPage executeSaveField] PUT a /admin/fields/${editingFieldId}. Payload:`, JSON.stringify(data, null, 2));
                await apiClient.put(`/admin/fields/${editingFieldId}`, data);
                toast.success(`Campo "${data.label}" actualizado.`);
            } else if (targetSectionId) {
                await apiClient.post(`/admin/sections/${targetSectionId}/fields`, data);
                toast.success(`Campo "${data.label}" creado.`);
            }
            setIsFieldModalOpen(false);
            await fetchValuationTypeStructure();
        } catch (error) { 
             let errorMessage = "Error al eliminar el campo."; // Mensaje genérico
    if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    toast.error(errorMessage);
    console.error("Error eliminando campo:", error);
        }
        finally { setIsSubmittingField(false); }
    }, [fetchValuationTypeStructure, editingFieldData]); // editingFieldData como dependencia

    const executeDeleteField = useCallback(async () => {
        if (!fieldToDelete) return;
        setIsSubmittingField(true); // Reusar
        try {
            await apiClient.delete(`/admin/fields/${fieldToDelete.id}`);
            toast.success(`Campo "${fieldToDelete.label}" eliminado.`);
            await fetchValuationTypeStructure();
        } catch (error) { 
             let errorMessage = "Error al eliminar el campo."; // Mensaje genérico
    if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    toast.error(errorMessage);
    console.error("Error eliminando campo:", error);
        }
        finally {
            setIsSubmittingField(false);
            setIsDeleteFieldConfirmOpen(false);
            setFieldToDelete(null);
        }
    }, [fieldToDelete, fetchValuationTypeStructure]);


    // --- Renderizado ---
    if (isLoading) {
        return <div className="flex justify-center items-center h-[calc(100vh-150px)]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }
    if (!valuationTypeData) {
        return (
            <div className="text-center py-20">
                <p className="text-xl text-destructive mb-4">No se pudo cargar la estructura del tipo de valoración.</p>
                <Button variant="outline" onClick={() => router.push('/valuation-types')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Tipos de Valoración
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 md:p-6 max-w-5xl mx-auto"> {/* Contenedor principal */}
            {/* Encabezado de la Página del Builder */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 mb-8 pb-4 border-b dark:border-gray-700">
                <div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/valuation-types')} className="mb-3">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Tipos
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
                        Constructor: <span className="text-primary">{valuationTypeData.name}</span>
                    </h1>
                    {valuationTypeData.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">{valuationTypeData.description}</p>
                    )}
                </div>
                <Button onClick={handleTriggerAddSection} className="whitespace-nowrap mt-3 sm:mt-0">
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Sección
                </Button>
            </header>

            {/* Componente para Mostrar y Gestionar Secciones y Campos */}
            <FormStructureDisplay
                sections={valuationTypeData.sections}
                onEditSection={handleTriggerEditSection}
                onDeleteSection={handleTriggerDeleteSection} // Renombrado para claridad
                onOpenAddFieldModal={handleTriggerAddField} // Renombrado para claridad
                onEditField={handleTriggerEditField}       // Renombrado para claridad
                onDeleteField={handleTriggerDeleteField}     // Renombrado para claridad
            />

            {/* Modales */}
            <SectionFormModal
                isOpen={isSectionModalOpen}
                onClose={() => { setIsSectionModalOpen(false); setEditingSectionData(null); }}
                onSubmit={executeSaveSection} // Pasa la función que llama a la API
                editingSection={editingSectionData}
                isSubmitting={isSubmittingSection}
                defaultOrderIndex={nextSectionOrderIndex}
            />
            <Dialog open={isDeleteSectionConfirmOpen} onOpenChange={setIsDeleteSectionConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Confirmar Eliminación de Sección</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar la sección &quot;{sectionToDelete?.title}&quot; y todos sus campos asociados? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteSectionConfirmOpen(false)} disabled={isSubmittingSection}>Cancelar</Button>
                        <Button variant="destructive" onClick={executeDeleteSection} disabled={isSubmittingSection}>
                            {isSubmittingSection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar Sección
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Renderiza FieldFormModal solo si está abierto Y currentSectionIdForFieldModal tiene un valor */}
            {isFieldModalOpen && currentSectionIdForFieldModal && (
                 <FieldFormModal
                    isOpen={isFieldModalOpen} // Siempre true si esta parte del JSX se renderiza
                    onClose={() => { 
                        setIsFieldModalOpen(false); 
                        setEditingFieldData(null); 
                        setCurrentSectionIdForFieldModal(null); 
                    }}
                    onSubmitBackend={executeSaveField} // Pasa la función que llama a la API
                    editingField={editingFieldData}
                    currentSectionId={currentSectionIdForFieldModal} // Ahora es string aquí
                    isSubmitting={isSubmittingField}
                    defaultOrderIndex={nextFieldOrderIndex}
                />
            )}
            <Dialog open={isDeleteFieldConfirmOpen} onOpenChange={setIsDeleteFieldConfirmOpen}>
                 <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Confirmar Eliminación de Campo</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar el campo &quot;{fieldToDelete?.label}&quot;? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteFieldConfirmOpen(false)} disabled={isSubmittingField}>Cancelar</Button>
                        <Button variant="destructive" onClick={executeDeleteField} disabled={isSubmittingField}>
                            {isSubmittingField && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar Campo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}