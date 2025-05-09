// src/models/formSection.model.js
module.exports = (sequelize, DataTypes) => {
    const FormSection = sequelize.define('FormSection', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        // valuationTypeId será añadido por la asociación
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: { // Descripción opcional de la sección
            type: DataTypes.TEXT,
            allowNull: true,
        },
        orderIndex: { // Para ordenar las secciones dentro de un tipo de valoración
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        }
    }, {
        tableName: 'form_sections',
        timestamps: true,
    });
    return FormSection;
};