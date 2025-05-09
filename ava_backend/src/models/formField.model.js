// src/models/formField.model.js
module.exports = (sequelize, DataTypes) => {
    const FormField = sequelize.define('FormField', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        // sectionId será añadido por la asociación
        label: { // La etiqueta que ve el usuario
            type: DataTypes.STRING,
            allowNull: false,
        },
        fieldType: {
            type: DataTypes.ENUM('text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'number', 'email', 'tel'),
            allowNull: false,
        },
        // Para 'select', 'radio', 'checkbox', guardaremos un array de objetos: [{value: 'val1', label: 'Label 1'}, ...]
        options: {
            type: DataTypes.JSONB, // PostgreSQL JSONB es eficiente
            allowNull: true, // Solo requerido para tipos de campo que usan opciones
        },
        // Para reglas de validación: ej. {"required": true, "minLength": 5, "pattern": "^[A-Za-z]+$"}
        validationRules: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        orderIndex: { // Para ordenar los campos dentro de una sección
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        placeholder: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        helpText: { // Texto de ayuda adicional para el campo
            type: DataTypes.TEXT,
            allowNull: true,
        },
        defaultValue: { // Un valor por defecto para el campo
            type: DataTypes.STRING, // O podría ser JSONB si el valor es complejo (ej. para checkboxes)
            allowNull: true,
        }
    }, {
        tableName: 'form_fields',
        timestamps: true,
    });
    return FormField;
};