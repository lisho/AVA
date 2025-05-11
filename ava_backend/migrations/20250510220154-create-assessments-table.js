'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assessments', { // Nombre de la tabla
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users', // Nombre de la tabla de usuarios
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // O CASCADE, dependiendo de si quieres borrar valoraciones si se borra el usuario
      },
      valuationTypeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'valuation_types', // Nombre de la tabla de tipos de valoración
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // No permitir borrar un tipo de valoración si tiene valoraciones asociadas
      },
      formData: {
        type: Sequelize.JSONB, // O Sequelize.JSON
        allowNull: false
      },
      generatedReportText: {
        type: Sequelize.TEXT,
        allowNull: true // Puede ser null si la IA falla
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
    await queryInterface.dropTable('assessments');
  }
};