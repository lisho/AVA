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

export interface ValidationRuleValues {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    customMessage?: string;
}

export interface FormFieldData {
    id: string;
    label: string;
    fieldType: string; // Considera usar un tipo string literal union: 'text' | 'textarea' | ...
    sectionId: string; // Importante para cuando editas/guardas un campo
    options?: Array<{ value: string; label: string }>;
    validationRules?: ValidationRuleValues;
    orderIndex: number;
    placeholder?: string | null;
    helpText?: string | null;
    defaultValue?: string | null; // Este es el default configurado en el builder
}

export interface FormSectionData {
    id: string;
    title: string;
    description?: string | null;
    orderIndex: number;
    fields: FormFieldData[];
}

// Interfaz para la estructura que se usa para renderizar/editar el formulario
export interface FormStructure {
    id: string; // ID del ValuationType
    name: string;
    description?: string | null;
    sections: FormSectionData[];
}

// Interfaz para un Assessment existente
export interface UserAssessment {
    id: string;
    valuationTypeId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    valuationType?: { // Para mostrar el nombre del tipo
        id: string;
        name: string;
    };
    generatedReportText?: string | null;
    formData: Record<string, unknown>; // Valores crudos del formulario
    extractedSubjectName?: string; 
    extractedSubjectLastName?: string;
}
