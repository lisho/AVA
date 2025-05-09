// src/models/role.model.js
module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isIn: [['admin', 'trabajador_social']], // Asegura que solo estos valores son permitidos
            }
        }
    }, {
        tableName: 'roles', // Opcional: especifica el nombre de la tabla
        timestamps: true // Sequelize añade createdAt y updatedAt por defecto
    });
    return Role;
};