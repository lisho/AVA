// src/controllers/formField.controller.js
const db = require('../models');
const FormField = db.FormField;
const FormSection = db.FormSection; // Para verificar que la FormSection existe

// Crear y Guardar un nuevo FormField para una FormSection específica
exports.create = async (req, res) => {
    const { sectionId } = req.params;
    const { label, fieldType, options, validationRules, orderIndex, placeholder, helpText, defaultValue } = req.body;

    if (!label || !fieldType) {
        return res.status(400).json({ message: "La etiqueta y el tipo de campo son requeridos." });
    }

    // Validar fieldType (básico, puedes hacerlo más robusto)
    const validFieldTypes = ['text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'number', 'email', 'tel'];
    if (!validFieldTypes.includes(fieldType)) {
        return res.status(400).json({ message: `Tipo de campo inválido: ${fieldType}`});
    }

    // Validar options si es select, radio, checkbox
    if (['select', 'radio', 'checkbox'].includes(fieldType) && (!options || !Array.isArray(options) || options.some(opt => typeof opt.value === 'undefined' || typeof opt.label === 'undefined'))) {
        return res.status(400).json({ message: "Para los tipos select, radio o checkbox, se requiere un array de 'options' con 'value' y 'label'." });
    }


    try {
        const section = await FormSection.findByPk(sectionId);
        if (!section) {
            return res.status(404).json({ message: `Sección con id=${sectionId} no encontrada.` });
        }

        let finalOrderIndex = orderIndex;
        if (orderIndex === undefined || orderIndex === null) {
            const lastField = await FormField.findOne({
                where: { sectionId },
                order: [['orderIndex', 'DESC']]
            });
            finalOrderIndex = lastField ? lastField.orderIndex + 1 : 0;
        }

        const formField = await FormField.create({
            label,
            fieldType,
            options: ['select', 'radio', 'checkbox'].includes(fieldType) ? options : null,
            validationRules,
            orderIndex: finalOrderIndex,
            placeholder,
            helpText,
            defaultValue,
            sectionId, // Asociar con la FormSection
        });
        res.status(201).json(formField);
    } catch (error) {
        console.error("Error al crear FormField:", error);
        res.status(500).json({ message: "Error interno al crear el campo del formulario." });
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
exports.update = async (req, res) => {
    const { fieldId } = req.params;
    // No permitimos cambiar sectionId o fieldType fácilmente,
    // si se necesita, es mejor borrar y crear.
    const { label, options, validationRules, orderIndex, placeholder, helpText, defaultValue } = req.body;

    try {
        const formField = await FormField.findByPk(fieldId);
        if (!formField) {
            return res.status(404).json({ message: `No se encontró el campo con id=${fieldId} para actualizar.` });
        }
        
        // Validar options si el campo es de tipo select, radio, checkbox
        if (['select', 'radio', 'checkbox'].includes(formField.fieldType) && options !== undefined) {
             if (!Array.isArray(options) || options.some(opt => typeof opt.value === 'undefined' || typeof opt.label === 'undefined')) {
                return res.status(400).json({ message: "Para los tipos select, radio o checkbox, se requiere un array de 'options' con 'value' y 'label' válidos." });
            }
        }


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
    } catch (error) {
        console.error(`Error al actualizar FormField con id=${fieldId}:`, error);
        res.status(500).json({ message: "Error interno al actualizar el campo del formulario." });
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