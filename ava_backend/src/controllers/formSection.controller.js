// src/controllers/formSection.controller.js
const db = require('../models');
const FormSection = db.FormSection;
const ValuationType = db.ValuationType; // Para verificar que el ValuationType existe
const FormField = db.FormField; // Para incluir campos al obtener una sección

// Crear y Guardar una nueva FormSection para un ValuationType específico
exports.create = async (req, res) => {
    const { valuationTypeId } = req.params;
    const { title, description, orderIndex } = req.body;

    if (!title) {
        return res.status(400).json({ message: "El título de la sección es requerido." });
    }

    try {
        // Verificar que el ValuationType existe
        const valuationType = await ValuationType.findByPk(valuationTypeId);
        if (!valuationType) {
            return res.status(404).json({ message: `ValuationType con id=${valuationTypeId} no encontrado.` });
        }

        // Calcular orderIndex si no se proporciona (o manejarlo como quieras)
        let finalOrderIndex = orderIndex;
        if (orderIndex === undefined || orderIndex === null) {
            const lastSection = await FormSection.findOne({
                where: { valuationTypeId },
                order: [['orderIndex', 'DESC']]
            });
            finalOrderIndex = lastSection ? lastSection.orderIndex + 1 : 0;
        }
        
        const formSection = await FormSection.create({
            title,
            description,
            orderIndex: finalOrderIndex,
            valuationTypeId, // Asociar con el ValuationType
        });
        res.status(201).json(formSection);
    } catch (error) {
        console.error("Error al crear FormSection:", error);
        res.status(500).json({ message: "Error interno al crear la sección del formulario." });
    }
};

// Obtener todas las FormSections de un ValuationType específico
exports.findAllByValuationType = async (req, res) => {
    const { valuationTypeId } = req.params;
    try {
        // Verificar que el ValuationType existe
        const valuationType = await ValuationType.findByPk(valuationTypeId);
        if (!valuationType) {
            return res.status(404).json({ message: `ValuationType con id=${valuationTypeId} no encontrado.` });
        }

        const formSections = await FormSection.findAll({
            where: { valuationTypeId },
            order: [['orderIndex', 'ASC']], // Ordenar por orderIndex
            include: [{ // Opcional: incluir campos si se necesita la estructura completa aquí
                model: FormField,
                as: 'fields',
                order: [['orderIndex', 'ASC']]
            }]
        });
        res.status(200).json(formSections);
    } catch (error) {
        console.error(`Error al obtener FormSections para ValuationType id=${valuationTypeId}:`, error);
        res.status(500).json({ message: "Error interno al obtener las secciones del formulario." });
    }
};

// Obtener una sola FormSection por su id
exports.findOne = async (req, res) => {
    const { sectionId } = req.params;
    try {
        const formSection = await FormSection.findByPk(sectionId, {
            include: [{
                model: FormField,
                as: 'fields',
                order: [['orderIndex', 'ASC']]
            }]
        });
        if (formSection) {
            res.status(200).json(formSection);
        } else {
            res.status(404).json({ message: `No se encontró la sección con id=${sectionId}.` });
        }
    } catch (error) {
        console.error(`Error al obtener FormSection con id=${sectionId}:`, error);
        res.status(500).json({ message: "Error interno al obtener la sección del formulario." });
    }
};

// Actualizar una FormSection por su id
exports.update = async (req, res) => {
    const { sectionId } = req.params;
    const { title, description, orderIndex } = req.body;

    try {
        const formSection = await FormSection.findByPk(sectionId);
        if (!formSection) {
            return res.status(404).json({ message: `No se encontró la sección con id=${sectionId} para actualizar.` });
        }

        const updatedFormSection = await formSection.update({
            title: title === undefined ? formSection.title : title,
            description: description === undefined ? formSection.description : description,
            orderIndex: orderIndex === undefined ? formSection.orderIndex : orderIndex,
        });
        res.status(200).json(updatedFormSection);
    } catch (error) {
        console.error(`Error al actualizar FormSection con id=${sectionId}:`, error);
        res.status(500).json({ message: "Error interno al actualizar la sección del formulario." });
    }
};

// Eliminar una FormSection por su id
exports.delete = async (req, res) => {
    const { sectionId } = req.params;
    try {
        const num = await FormSection.destroy({
            where: { id: sectionId }
        });
        if (num === 1) {
            res.status(200).json({ message: "Sección del formulario eliminada exitosamente." });
        } else {
            res.status(404).json({ message: `No se encontró la sección con id=${sectionId} para eliminar.` });
        }
    } catch (error) {
        console.error(`Error al eliminar FormSection con id=${sectionId}:`, error);
        res.status(500).json({ message: "Error interno al eliminar la sección del formulario." });
    }
};