// src/components/app/AssessmentList.tsx
'use client';

import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FilePlus2 } from 'lucide-react';
import AssessmentRow from './AssessmentRow';
import { UserAssessment } from '@/types/assessment'; // Ajusta la ruta

interface AssessmentListProps {
    assessments: UserAssessment[];
    isLoading: boolean;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    };
    onPageChange: (page: number) => void;
    onDownloadPdf: (assessmentId: string, assessmentName?: string) => void;
    onOpenDeleteDialog: (assessment: UserAssessment) => void;
}


export default function AssessmentList({
    assessments,
    isLoading,
    pagination,
    onPageChange,
    onDownloadPdf,
    onOpenDeleteDialog,
}: AssessmentListProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 py-10">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Cargando tus valoraciones...</span>
            </div>
        );
    }

    if (assessments.length === 0) {
        return (
            <Card className="text-center py-12 border-dashed mt-6">
                <CardContent className="flex flex-col items-center">
                    <FilePlus2 className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-5" />
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Aún no has realizado ninguna valoración.</p>
                    <p className="text-md text-gray-500 dark:text-gray-500">Empieza seleccionando un tipo de valoración arriba para crear una nueva.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg mt-6">
            <Table>
                <TableCaption className="py-4">
                    {pagination.totalItems > 0 
                        ? `Mostrando valoraciones del ${(pagination.currentPage - 1) * 5 + 1} al ${Math.min(pagination.currentPage * 5, pagination.totalItems)} de ${pagination.totalItems} totales.`
                        : "No hay valoraciones para mostrar."}
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[25%]">Nombre</TableHead>
                        <TableHead className="w-[25%]">Tipo de Valoración</TableHead>
                        <TableHead className="w-[20%]">Creada</TableHead>
                        <TableHead className="w-[20%]">Actualizada</TableHead>
                        <TableHead className="text-right w-[auto]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assessments.map((assessment) => (
                        <AssessmentRow
                            key={assessment.id}
                            assessment={assessment}
                            onEdit={() => {}} // Placeholder para editar
                            // Puedes implementar la función de edición más tarde
                            onDownloadPdf={onDownloadPdf}
                            onOpenDeleteDialog={onOpenDeleteDialog}
                        />
                    ))}
                </TableBody>
            </Table>
            {/* Paginación */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4 px-6 border-t dark:border-gray-700">
                    <div className="text-sm text-muted-foreground">
                        Página {pagination.currentPage} de {pagination.totalPages}
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}