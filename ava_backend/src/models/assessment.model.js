// src/models/assessment.model.js
module.exports = (sequelize, DataTypes) => {
    const Assessment = sequelize.define('Assessment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: { // Quién hizo la valoración
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' } // Asumiendo que tu tabla de usuarios es 'users'
        },
        valuationTypeId: { // Qué tipo de valoración se usó
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'valuation_types', key: 'id' }
        },
        formData: { // Los datos que el usuario ingresó en el formulario
            type: DataTypes.JSONB,
            allowNull: false,
        },
        generatedReportText: { // El informe generado por la IA
            type: DataTypes.TEXT,
            allowNull: true, // Podría ser null si la IA falla o antes de generarse
        },
        // Puedes añadir más campos: status, error_message_ia, etc.
    }, {
        tableName: 'assessments',
        timestamps: true,
    });

    Assessment.associate = (models) => {
        Assessment.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Assessment.belongsTo(models.ValuationType, { foreignKey: 'valuationTypeId', as: 'valuationType' });
    };

    return Assessment;
};