// src/controllers/valuationType.controller.js
const db = require('../models');
const ValuationType = db.ValuationType;
// Podríamos añadir Op de Sequelize para búsquedas más complejas si es necesario
// const Op = db.Sequelize.Op;

// Crear y Guardar un nuevo ValuationType
exports.create = async (req, res) => {
    const { name, description, systemPrompt, isActive } = req.body;

    if (!name || !systemPrompt) {
        return res.status(400).json({ message: "El nombre y el prompt de sistema son requeridos." });
    }

    try {
        const valuationType = await ValuationType.create({
            name,
            description,
            systemPrompt,
            isActive: isActive !== undefined ? isActive : true, // Default a true si no se envía
        });
        res.status(201).json(valuationType);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: "Error: Ya existe un tipo de valoración con ese nombre." });
        }
        console.error("Error al crear ValuationType:", error);
        res.status(500).json({ message: "Error interno al crear el tipo de valoración." });
    }
};

// Obtener todos los ValuationTypes
exports.findAll = async (req, res) => {
    try {
        const valuationTypes = await ValuationType.findAll({
            order: [['name', 'ASC']] // Ordenar por nombre ascendentemente
        });
        res.status(200).json(valuationTypes);
    } catch (error) {
        console.error("Error al obtener ValuationTypes:", error);
        res.status(500).json({ message: "Error interno al obtener los tipos de valoración." });
    }
};

// Obtener un solo ValuationType por id
exports.findOne = async (req, res) => {
    const id = req.params.id;
    try {
        const valuationType = await ValuationType.findByPk(id, {
            include: [{
                model: db.FormSection, // db.FormSection es el modelo
                as: 'sections',       // el alias que definimos en la asociación
                include: [{           // Anidar la inclusión de campos dentro de secciones
                    model: db.FormField,
                    as: 'fields',
                    order: [['orderIndex', 'ASC']] // Asegurar orden de campos
                }],
                order: [['orderIndex', 'ASC']] // Asegurar orden de secciones
            }]
        });

        if (valuationType) {
            res.status(200).json(valuationType);
        } else {
            res.status(404).json({ message: `No se encontró el tipo de valoración con id=${id}.` });
        }
    } catch (error) {
        console.error(`Error al obtener ValuationType con id=${id}:`, error);
        res.status(500).json({ message: "Error interno al obtener el tipo de valoración." });
    }
};

// Actualizar un ValuationType por id
exports.update = async (req, res) => {
    const id = req.params.id;
    const { name, description, systemPrompt, isActive } = req.body;

    try {
        const valuationType = await ValuationType.findByPk(id);
        if (!valuationType) {
            return res.status(404).json({ message: `No se encontró el tipo de valoración con id=${id} para actualizar.` });
        }

        // Actualizar campos. Sequelize solo actualiza los campos proporcionados.
        const updatedValuationType = await valuationType.update({
            name: name === undefined ? valuationType.name : name,
            description: description === undefined ? valuationType.description : description,
            systemPrompt: systemPrompt === undefined ? valuationType.systemPrompt : systemPrompt,
            isActive: isActive === undefined ? valuationType.isActive : isActive,
        });

        res.status(200).json(updatedValuationType);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: "Error: Ya existe otro tipo de valoración con ese nombre." });
        }
        console.error(`Error al actualizar ValuationType con id=${id}:`, error);
        res.status(500).json({ message: "Error interno al actualizar el tipo de valoración." });
    }
};

// Eliminar un ValuationType por id
exports.delete = async (req, res) => {
    const id = req.params.id;
    try {
        const num = await ValuationType.destroy({
            where: { id: id }
        });
        if (num === 1) {
            res.status(200).json({ message: "Tipo de valoración eliminado exitosamente." });
        } else {
            res.status(404).json({ message: `No se encontró el tipo de valoración con id=${id} para eliminar.` });
        }
    } catch (error) {
        console.error(`Error al eliminar ValuationType con id=${id}:`, error);
        res.status(500).json({ message: "Error interno al eliminar el tipo de valoración." });
    }
};