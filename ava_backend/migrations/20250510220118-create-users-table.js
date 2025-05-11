'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      passwordHash: { // Renombrado de password_hash a passwordHash para camelCase
        type: Sequelize.STRING,
        allowNull: false,
      },
      roleId: { // Renombrado de role_id a roleId
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles', // Nombre de la tabla a la que referencia
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // O 'CASCADE' o 'RESTRICT' según tu lógica
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};