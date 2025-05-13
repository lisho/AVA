export interface ActiveValuationType {
    id: string;
    name: string;
    description?: string | null;
}

export interface UserAssessment {
    id: string;
    valuationTypeId: string;
    userId: string;
    name: string;
    apellido: string;
    createdAt: string;
    updatedAt: string;
    valuationType?: {
        id: string;
        name: string;
    };
    generatedReportText?: string | null;
    
    formData: Record<string, unknown>; // <--- AÑADE ESTO para recibir los datos del formulario
    // Campos opcionales que intentaremos poblar en el frontend
    extractedSubjectName?: string; 
    extractedSubjectLastName?: string;
}

export interface PaginatedAssessmentsResponse {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    assessments: UserAssessment[];
}