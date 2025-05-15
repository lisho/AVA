// src/types/index.ts (o assessment.ts)

// Interfaz de referencia, no usada directamente por Zod para inferir FieldFormValues
export interface ValidationRuleValues {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    customMessage?: string;
}

export type FieldTypeUnion = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'checkbox-group' | 'date' | 'number' | 'email' | 'tel';

export interface FormFieldData { // Este es el tipo para `editingField`
    id: string;
    label: string;
    fieldType: FieldTypeUnion;
    sectionId: string;
    options?: Array<{ value: string; label: string }>;
    validationRules?: ValidationRuleValues; // Esta es la interfaz, puede ser undefined
    orderIndex: number;
    placeholder?: string | null;
    helpText?: string | null;
    defaultValue?: string | null;
}

export interface ActiveValuationType {
    id: string;
    name: string;
    description?: string | null;
}

export interface UserForAssessmentDetails { // Un tipo para el usuario anidado
    id: string;
    name: string | null;
    email: string;
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
        description?: string | null; // Añadido si el backend lo envía
    };
    user?: UserForAssessmentDetails; 
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
/*
export interface ValidationRuleValues {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    customMessage?: string;
}
*/


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

export interface FormStructureWithSections {
    id: string;
    name: string;
    description?: string | null;
    sections: FormSectionData[];
}

export interface ValuationTypeWithStructure {
    id: string;
    name: string;
    description?: string | null;
    systemPrompt: string;
    isActive: boolean;
    sections: FormSectionData[]; // Usa la FormSectionData definida arriba
}