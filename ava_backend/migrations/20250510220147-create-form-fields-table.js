'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('form_fields', { // Nombre de la tabla
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      sectionId: { // Clave foránea
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'form_sections', // Nombre de la tabla referenciada
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Si se borra una sección, se borran sus campos
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false
      },
      fieldType: {
        type: Sequelize.ENUM('text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'number', 'email', 'tel'),
        allowNull: false
      },
      options: { // Para select, radio, checkbox
        type: Sequelize.JSONB, // JSONB es específico de PostgreSQL, usa JSON para otros
        allowNull: true
      },
      validationRules: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      placeholder: {
        type: Sequelize.STRING,
        allowNull: true
      },
      helpText: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      defaultValue: { // Podría ser STRING o JSONB si el valor por defecto es complejo
        type: Sequelize.STRING, 
        allowNull: true
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
    await queryInterface.dropTable('form_fields');
  }
};