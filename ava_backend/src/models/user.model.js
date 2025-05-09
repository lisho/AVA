// src/models/user.model.js
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true, // O false si el nombre es siempre requerido
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        // roleId será añadido por la asociación
    }, {
        tableName: 'users',
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.passwordHash) { // Asumiendo que pasamos 'passwordHash' como el password en texto plano temporalmente
                    const salt = await bcrypt.genSalt(10);
                    user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
                }
            },
            beforeUpdate: async (user) => {
                 // Si el password cambia y no es ya un hash (manejar lógica de cambio de password)
                if (user.changed('passwordHash') && user.passwordHash && !user.passwordHash.startsWith('$2a$') && !user.passwordHash.startsWith('$2b$')) {
                    const salt = await bcrypt.genSalt(10);
                    user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
                }
            }
        }
    });

    // Método de instancia para validar contraseña
    User.prototype.isValidPassword = async function(password) {
        return await bcrypt.compare(password, this.passwordHash);
    };

    return User;
};