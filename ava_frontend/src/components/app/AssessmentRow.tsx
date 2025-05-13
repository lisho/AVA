// src/components/app/AssessmentRow.tsx
'use client';

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Download, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserAssessment } from '@/types/assessment'; // Asumiendo que UserAssessment está exportada desde ahí
                                                          // o muévela a un archivo de tipos compartido.

interface AssessmentRowProps {
    assessment: UserAssessment;
    onDownloadPdf: (assessmentId: string, assessmentName?: string) => void;
    onOpenDeleteDialog: (assessment: UserAssessment) => void;
    onEdit: (assessment: UserAssessment) => void; // Para el futuro
}

export default function AssessmentRow({
    assessment,
    onDownloadPdf,
    onOpenDeleteDialog,
    onEdit,
}: AssessmentRowProps) {
    
    const router = useRouter();
    const subjectFullName = [assessment.extractedSubjectName, assessment.extractedSubjectLastName]
                        .filter(Boolean) // Filtra nulos o strings vacíos
                        .join(' ');

    return (
           
        <TableRow>
            <TableCell>
                {subjectFullName || <span className="italic text-gray-500">Sujeto no identificado</span>}
            </TableCell>
            <TableCell className="font-medium">{assessment.valuationType?.name || 'Desconocido'}</TableCell>
            <TableCell>{new Date(assessment.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
            <TableCell>{new Date(assessment.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
            <TableCell className="text-right space-x-1 sm:space-x-2">
                <Button 
                    variant="outline" 
                    size="icon" // Más pequeño si solo es icono
                    onClick={() => router.push(`/valoraciones/ver/${assessment.id}`)}
                    title="Ver detalles"
                    className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3" // Responsive
                >
                    <Eye className="h-4 w-4" />
                    
                </Button>
                <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => onDownloadPdf(assessment.id, assessment.valuationType?.name)}
                    disabled={!assessment.generatedReportText}
                    title={assessment.generatedReportText ? "Descargar PDF" : "Informe no disponible"}
                    className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
                >
                    <Download className="h-4 w-4" />
                     
                </Button>
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => onEdit(assessment)} // Placeholder para editar
                    title="Editar Valoración (Futuro)"
                    disabled // Deshabilitado por ahora
                    className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
                >
                    <Edit className="h-4 w-4" />
                     
                </Button> 
                <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={() => onOpenDeleteDialog(assessment)}
                    title="Eliminar valoración"
                    className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
                >
                    <Trash2 className="h-4 w-4" />
                    
                </Button>
            </TableCell>
        </TableRow>
    );
}