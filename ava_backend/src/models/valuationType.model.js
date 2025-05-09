// src/models/valuationType.model.js
module.exports = (sequelize, DataTypes) => {
    const ValuationType = sequelize.define('ValuationType', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        systemPrompt: { // El prompt de sistema para la IA
            type: DataTypes.TEXT,
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        }
    }, {
        tableName: 'valuation_types',
        timestamps: true,
    });
    return ValuationType;
};