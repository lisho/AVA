// src/components/admin/builder/FormStructureDisplay.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle as ShadcnCardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { FormSectionData, FormFieldData } from '@/types/assessment'; // Ajusta la ruta a tus tipos

interface FormStructureDisplayProps {
    sections: FormSectionData[];
    onEditSection: (section: FormSectionData) => void;
    onDeleteSection: (section: FormSectionData) => void; // Pasa el objeto sección para el diálogo
    onOpenAddFieldModal: (sectionId: string) => void;
    onEditField: (field: FormFieldData) => void; // Ya no necesita sectionId aquí si está en field
    onDeleteField: (field: FormFieldData) => void; // Pasa el objeto campo para el diálogo
}

export default function FormStructureDisplay({
    sections,
    onEditSection,
    onDeleteSection,
    onOpenAddFieldModal,
    onEditField,
    onDeleteField,
}: FormStructureDisplayProps) {
    if (sections.length === 0) {
        return (
            <Card className="text-center text-gray-500 dark:text-gray-400 py-12 border-dashed">
                <CardContent className="flex flex-col items-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium">Este formulario aún no tiene secciones.</h3>
                    <p className="text-sm">¡Añade una sección para empezar a construir tu formulario!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {sections
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((section) => (
                <Card key={section.id} className="overflow-hidden shadow-lg">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <ShadcnCardTitle className="text-xl font-semibold text-slate-700 dark:text-slate-200">{section.title}</ShadcnCardTitle>
                            <div className="flex space-x-2 mt-2 sm:mt-0">
                                <Button variant="outline" size="sm" onClick={() => onEditSection(section)}>
                                    <Edit className="mr-1 h-4 w-4" /> Editar
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => onDeleteSection(section)}>
                                    <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                                </Button>
                            </div>
                        </div>
                        {section.description && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">{section.description}</p>}
                    </CardHeader>
                    
                    <CardContent className="p-4 sm:p-6 space-y-4">
                        {section.fields.length === 0 && (
                             <p className="text-sm text-center text-gray-400 dark:text-gray-500 py-4">Esta sección no tiene campos.</p>
                        )}
                        {section.fields
                            .sort((a,b) => a.orderIndex - b.orderIndex)
                            .map((field) => (
                            <div key={field.id} className="p-3 bg-white dark:bg-gray-700/60 rounded-md shadow-sm border dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-100">{field.label}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Tipo: {field.fieldType} | Orden: {field.orderIndex}
                                        {field.placeholder && ` | Placeholder: ${field.placeholder}`}
                                    </p>
                                </div>
                                <div className="flex space-x-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar Campo" onClick={() => onEditField(field)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" title="Eliminar Campo" onClick={() => onDeleteField(field)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <div className="mt-4 pt-4 border-t dark:border-gray-600">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => onOpenAddFieldModal(section.id)} >
                                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Campo a &quot;{section.title}&quot;
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}