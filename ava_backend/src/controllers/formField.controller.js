// src/controllers/formField.controller.js
const db = require('../models');
const FormField = db.FormField;
const FormSection = db.FormSection; // Para verificar que la FormSection existe

// Crear y Guardar un nuevo FormField para una FormSection específica

exports.create = async (req, res) => {
    const { sectionId } = req.params; // ID de la sección a la que pertenece el campo
    
    // Desestructurar todos los campos esperados del body
    const { 
        label, 
        fieldType, 
        options,         // Puede ser undefined/null
        validationRules, // Puede ser undefined/null
        orderIndex, 
        placeholder, 
        helpText, 
        defaultValue 
    } = req.body;

    // Log inicial para ver qué llega al backend
    console.log(`[BACKEND FORMFIELD CTRL CREATE] /sections/${sectionId}/fields. Recibido Body:`, JSON.stringify(req.body, null, 2));

    // --- VALIDACIONES DEL PAYLOAD ---

    // 1. Validar campos básicos requeridos
    if (!label || label.trim() === '') {
        console.error("[BACKEND FORMFIELD CTRL CREATE] Error: 'label' es requerido y no puede estar vacío.");
        return res.status(400).json({ message: "La etiqueta (label) del campo es requerida y no puede estar vacía." });
    }
    if (!fieldType) {
        console.error("[BACKEND FORMFIELD CTRL CREATE] Error: 'fieldType' es requerido.");
        return res.status(400).json({ message: "El tipo de campo (fieldType) es requerido." });
    }

    // 2. Validar que fieldType sea uno de los valores permitidos
    // Esta lista debe coincidir con tu ENUM en el modelo/DB y el schema Zod del frontend
    const validFieldTypes = ['text', 'textarea', 'select', 'radio', 'checkbox', 'checkbox-group', 'date', 'number', 'email', 'tel'];
    if (!validFieldTypes.includes(fieldType)) {
        console.error(`[BACKEND FORMFIELD CTRL CREATE] Error: Tipo de campo (fieldType) inválido: ${fieldType}`);
        return res.status(400).json({ message: `Tipo de campo inválido: '${fieldType}'. Valores permitidos: ${validFieldTypes.join(', ')}`});
    }

    // 3. Validar 'options' si el fieldType las requiere
    let processedOptions = options; // Variable para las opciones que se guardarán
    if (['select', 'radio', 'checkbox-group'].includes(fieldType)) {
        if (!options || !Array.isArray(options) || options.length === 0) {
            console.error(`[BACKEND FORMFIELD CTRL CREATE] Error: Para tipo '${fieldType}', 'options' es requerido como un array no vacío. Recibido:`, options);
            return res.status(400).json({ message: `Para el tipo de campo '${fieldType}', se requiere un array de 'options' con al menos un elemento.` });
        }
        for (const opt of options) {
            if (typeof opt.value !== 'string' || opt.value.trim() === '' || 
                typeof opt.label !== 'string' || opt.label.trim() === '') {
                console.error(`[BACKEND FORMFIELD CTRL CREATE] Error: Opción inválida en 'options'. 'value' y 'label' deben ser strings no vacíos. Recibido:`, opt);
                return res.status(400).json({ message: "Cada opción dentro de 'options' debe tener propiedades 'value' y 'label' que sean strings no vacíos." });
            }
        }
        // Si pasa la validación, processedOptions ya tiene el valor correcto de 'options'
    } else {
        // Si el tipo de campo NO requiere opciones, nos aseguramos de que 'options' se guarde como null
        // o no se guarde si la columna no lo permite (JSONB en PostgreSQL permite null).
        if (options !== undefined && options !== null) { // Si se enviaron opciones incorrectamente
            console.warn(`[BACKEND FORMFIELD CTRL CREATE] Tipo '${fieldType}' no usa opciones, pero se recibieron. Se establecerán a null.`);
        }
        processedOptions = null; 
    }
    
    // 4. Validar 'orderIndex'
    // Zod en el frontend ya hace coerce.number().int().min(0), aquí una comprobación de existencia y tipo.
    if (orderIndex === undefined || typeof orderIndex !== 'number' || orderIndex < 0 || !Number.isInteger(orderIndex)) {
        console.error(`[BACKEND FORMFIELD CTRL CREATE] Error: orderIndex inválido: ${orderIndex}. Debe ser un entero no negativo.`);
        return res.status(400).json({ message: "El campo 'orderIndex' debe ser un número entero no negativo." });
    }
    
    // 5. Validar 'validationRules' (opcional, pero si se envía, debería ser un objeto o null)
    let processedValidationRules = validationRules;
    if (validationRules !== undefined && validationRules !== null && typeof validationRules !== 'object') {
        console.error(`[BACKEND FORMFIELD CTRL CREATE] Error: 'validationRules' debe ser un objeto o null. Recibido:`, validationRules);
        return res.status(400).json({ message: "'validationRules' debe ser un objeto o null."});
    }
    if (validationRules === undefined) { // Si no se envía, guardamos null (o lo que prefiera tu DB)
        processedValidationRules = null;
    }
    // Aquí podrías añadir validaciones más profundas para el contenido de validationRules si es necesario.

    // --- LÓGICA DE CREACIÓN ---
    try {
        // Verificar que la sección padre exista
        const section = await FormSection.findByPk(sectionId);
        if (!section) {
            console.error(`[BACKEND FORMFIELD CTRL CREATE] Error: Sección con id=${sectionId} no encontrada.`);
            return res.status(404).json({ message: `La sección padre con id=${sectionId} no fue encontrada.` });
        }

        // Preparar datos para la creación del FormField
        const newFieldData = {
            label,
            fieldType,
            options: processedOptions,
            validationRules: processedValidationRules,
            orderIndex,
            placeholder: placeholder || null, // Guardar null si es string vacío o undefined
            helpText: helpText || null,
            defaultValue: defaultValue || null,
            sectionId, // Asociar con la sección
        };
        
        console.log('[BACKEND FORMFIELD CTRL CREATE] Datos finales para FormField.create:', newFieldData);

        const formField = await FormField.create(newFieldData);
        console.log('[BACKEND FORMFIELD CTRL CREATE] Campo creado exitosamente, ID:', formField.id);
        res.status(201).json(formField);

    } catch (error) {
        console.error("[BACKEND FORMFIELD CTRL CREATE] Error CRÍTICO al intentar crear el campo en la BD:", error);
        console.error("[BACKEND FORMFIELD CTRL CREATE] Error stack:", error.stack);

        if (error.name === 'SequelizeValidationError') {
            const errorMessages = error.errors.map(e => `${e.path}: ${e.message}`).join('; ');
            console.error("[BACKEND FORMFIELD CTRL CREATE] Detalle Sequelize Validation Error:", errorMessages);
            return res.status(400).json({ message: "Error de validación de datos: " + errorMessages });
        } else if (error.name === 'SequelizeDatabaseError') { 
             // Esto podría capturar errores de ENUM inválido, entre otros errores de BD
             console.error("[BACKEND FORMFIELD CTRL CREATE] Error de base de datos:", error.original?.message || error.message);
             // Intenta dar un mensaje más útil si es un error de ENUM conocido
             if (error.original?.message && error.original.message.includes(`invalid input value for enum enum_form_fields_fieldType`)) {
                 return res.status(400).json({ message: `Valor inválido para el tipo de campo: '${fieldType}'. Asegúrese de que esté permitido y que la base de datos esté actualizada.` });
             }
             return res.status(400).json({ message: `Error de base de datos: ${error.original?.message || error.message}` });
        } else if (error.name === 'SequelizeForeignKeyConstraintError') {
            console.error("[BACKEND FORMFIELD CTRL CREATE] Detalle FK Error:", error.fields, error.index);
            return res.status(400).json({ message: `Error de referencia: La sección con ID '${sectionId}' podría no existir o hay un problema de integridad.` });
        }
        // Error genérico del servidor si no es uno de los anteriores
        res.status(500).json({ message: "Error interno del servidor al crear el campo del formulario.", errorDetails: error.message });
    }
};
// Obtener todos los FormFields de una FormSection específica
exports.findAllBySection = async (req, res) => {
    const { sectionId } = req.params;
    try {
        const section = await FormSection.findByPk(sectionId);
        if (!section) {
            return res.status(404).json({ message: `Sección con id=${sectionId} no encontrada.` });
        }

        const formFields = await FormField.findAll({
            where: { sectionId },
            order: [['orderIndex', 'ASC']],
        });
        res.status(200).json(formFields);
    } catch (error) {
        console.error(`Error al obtener FormFields para Section id=${sectionId}:`, error);
        res.status(500).json({ message: "Error interno al obtener los campos del formulario." });
    }
};

// Obtener un solo FormField por su id
exports.findOne = async (req, res) => {
    const { fieldId } = req.params;
    try {
        const formField = await FormField.findByPk(fieldId);
        if (formField) {
            res.status(200).json(formField);
        } else {
            res.status(404).json({ message: `No se encontró el campo con id=${fieldId}.` });
        }
    } catch (error) {
        console.error(`Error al obtener FormField con id=${fieldId}:`, error);
        res.status(500).json({ message: "Error interno al obtener el campo del formulario." });
    }
};

// Actualizar un FormField por su id
/*
exports.update = async (req, res) => {
    const { fieldId } = req.params;
    // No permitimos cambiar sectionId o fieldType fácilmente,
    // si se necesita, es mejor borrar y crear.
    const { label, options, validationRules, orderIndex, placeholder, helpText, defaultValue, fieldType: fieldTypeFromBody } = req.body;

     console.log(`[FORMFIELD CTRL PUT /fields/${fieldId}] Intentando actualizar. Body:`, req.body);

    try {
        const formField = await FormField.findByPk(fieldId);
        if (!formField) {
            return res.status(404).json({ message: `No se encontró el campo con id=${fieldId} para actualizar.` });
        }
        
        const typeToCheckOptions = fieldTypeFromBody || formField.fieldType;

        if (['select', 'radio', 'checkbox-group'].includes(typeToCheckOptions)) {
            if (!options || !Array.isArray(options) || options.length === 0) { // Opciones son requeridas
                return res.status(400).json({ message: `Para el tipo de campo '${fieldType}', se requiere un array de 'options' no vacío.` });
            }
            // Validar cada opción
            for (const opt of options) {
                if (typeof opt.value !== 'string' || opt.value.trim() === '' || 
                    typeof opt.label !== 'string' || opt.label.trim() === '') {
                    return res.status(400).json({ message: "Cada opción debe tener propiedades 'value' y 'label' de tipo string no vacías." });
                }
            }
        } else {


        const updatedFormField = await formField.update({
            label: label === undefined ? formField.label : label,
            options: options === undefined ? formField.options : (['select', 'radio', 'checkbox'].includes(formField.fieldType) ? options : formField.options),
            validationRules: validationRules === undefined ? formField.validationRules : validationRules,
            orderIndex: orderIndex === undefined ? formField.orderIndex : orderIndex,
            placeholder: placeholder === undefined ? formField.placeholder : placeholder,
            helpText: helpText === undefined ? formField.helpText : helpText,
            defaultValue: defaultValue === undefined ? formField.defaultValue : defaultValue,
        });
        res.status(200).json(updatedFormField);
        }
    } catch (error) {
        console.error(`Error al actualizar FormField con id=${fieldId}:`, error);
        res.status(500).json({ message: "Error interno al actualizar el campo del formulario." });
    }
}; */

// const FormSection = db.FormSection; // No se usa directamente aquí

exports.update = async (req, res) => {
    const { fieldId } = req.params;
    // Campos que se pueden actualizar:
    // Si no envías fieldType desde el frontend para la actualización, no lo desestructures.
    const { label, options, validationRules, orderIndex, placeholder, helpText, defaultValue } = req.body;

    console.log(`[FORMFIELD CTRL PUT /fields/${fieldId}] Intentando actualizar. Body:`, req.body);

    try {
        const formField = await FormField.findByPk(fieldId);
        if (!formField) {
            console.error(`[FORMFIELD CTRL PUT /fields/${fieldId}] Campo con ID ${fieldId} no encontrado.`);
            return res.status(404).json({ message: `No se encontró el campo con id=${fieldId}` });
        }
        
        // Usar el fieldType existente del campo en la BD para la lógica de 'options'
        const currentFieldTypeInDb = formField.fieldType; 

        if (['select', 'radio', 'checkbox-group'].includes(currentFieldTypeInDb)) {
            // Solo validar 'options' si se proporcionan en el body para actualizar
            if (req.body.hasOwnProperty('options')) { // Verifica si 'options' fue enviado
                if (options === null) { // Permitir borrar opciones enviando null
                    // Ok, se establecerá a null
                } else if (!Array.isArray(options) || (options.length > 0 && options.some(opt => 
                    typeof opt.value !== 'string' || opt.value.trim() === '' || 
                    typeof opt.label !== 'string' || opt.label.trim() === ''
                ))) {
                    console.error(`[FORMFIELD CTRL PUT /fields/${fieldId}] Options inválidas para tipo ${currentFieldTypeInDb}:`, options);
                    return res.status(400).json({ message: "Para los tipos select, radio o checkbox-group, si se proporcionan 'options', deben ser un array válido de objetos con 'value' y 'label'." });
                }
            }
        } else {
            // Si el tipo de campo no usa opciones, y se envían opciones, podríamos ignorarlas o advertir
            if (req.body.hasOwnProperty('options') && options !== null && options !== undefined) { // options !== undefined es más seguro que solo options
                 console.warn(`[FORMFIELD CTRL PUT /fields/${fieldId}] Se recibieron 'options' para un tipo '${currentFieldTypeInDb}' que no las usa. Considere enviar options: null para borrarlas si es necesario.`);
                 // Podrías decidir no incluir 'options' en updatePayload si currentFieldTypeInDb no las usa
            }
        }

        // Construir el payload de actualización solo con los campos presentes en req.body
        const updatePayload = {};
        if (req.body.hasOwnProperty('label')) updatePayload.label = label;
        
        // No actualizamos fieldType aquí. Si se quisiera, se necesitaría más lógica y validación.
        // if (req.body.hasOwnProperty('fieldType')) updatePayload.fieldType = fieldType;

        if (req.body.hasOwnProperty('options')) updatePayload.options = options; // Puede ser array o null
        
        if (req.body.hasOwnProperty('validationRules')) { // Permite enviar null para borrar reglas
            updatePayload.validationRules = validationRules;
        }
        if (req.body.hasOwnProperty('orderIndex')) updatePayload.orderIndex = orderIndex;
        if (req.body.hasOwnProperty('placeholder')) updatePayload.placeholder = placeholder;
        if (req.body.hasOwnProperty('helpText')) updatePayload.helpText = helpText;
        if (req.body.hasOwnProperty('defaultValue')) updatePayload.defaultValue = defaultValue;
        
        if (Object.keys(updatePayload).length === 0) {
            console.log(`[FORMFIELD CTRL PUT /fields/${fieldId}] No hay campos válidos para actualizar.`);
            return res.status(200).json(formField); // Devuelve el campo sin cambios
        }

        console.log(`[FORMFIELD CTRL PUT /fields/${fieldId}] Payload de actualización:`, updatePayload);
        
        // await formField.update(updatePayload); // Opción 1: Usar el método de instancia
        // const updatedField = formField;

        // Opción 2: Usar el método estático (como lo tenías)
        const [numberOfAffectedRows, updatedFields] = await FormField.update(updatePayload, {
            where: { id: fieldId },
            returning: true,
        });
        
        if (numberOfAffectedRows > 0 && updatedFields && updatedFields[0]) {
            console.log(`[FORMFIELD CTRL PUT /fields/${fieldId}] Campo actualizado exitosamente.`);
            res.status(200).json(updatedFields[0]);
        } else {
            console.error(`[FORMFIELD CTRL PUT /fields/${fieldId}] No se afectaron filas. El campo podría no haber cambiado o no se encontró (aunque findByPk lo hizo).`);
            // Si findByPk lo encontró, pero update no afectó filas, podría significar que los datos son idénticos
            // o un problema con 'returning: true' si no es PostgreSQL/MSSQL.
            // Devolver el campo original encontrado por findByPk si no hubo error pero no se afectaron filas y no hay updatedFields.
            res.status(200).json(formField); // Devolver el estado actual si no hubo cambios efectivos
        }
    } catch (error) {
        console.error(`[FORMFIELD CTRL PUT /fields/${fieldId}] Error CRÍTICO al actualizar el campo:`, error);
        console.error("[FORMFIELD CTRL PUT] Error stack:", error.stack);
        if (error.name === 'SequelizeValidationError') {
            const errorMessages = error.errors.map(e => `${e.path}: ${e.message}`).join('; ');
            console.error("[FORMFIELD CTRL PUT] Detalle Validation Error:", errorMessages);
            return res.status(400).json({ message: "Error de validación: " + errorMessages });
        }
        res.status(500).json({ message: "Error interno al actualizar el campo.", errorDetails: error.message });
    }
};

// Eliminar un FormField por su id
exports.delete = async (req, res) => {
    const { fieldId } = req.params;
    try {
        const num = await FormField.destroy({
            where: { id: fieldId }
        });
        if (num === 1) {
            res.status(200).json({ message: "Campo del formulario eliminado exitosamente." });
        } else {
            res.status(404).json({ message: `No se encontró el campo con id=${fieldId} para eliminar.` });
        }
    } catch (error) {
        console.error(`Error al eliminar FormField con id=${fieldId}:`, error);
        res.status(500).json({ message: "Error interno al eliminar el campo del formulario." });
    }
};