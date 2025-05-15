'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // El nombre del tipo ENUM es algo como "enum_form_fields_fieldType".
    // Verifica el nombre exacto en tu base de datos (psql: \dT enum_form_fields_fieldType)
    const enumName = 'enum_form_fields_fieldType'; // <<< REEMPLAZA ESTO SI ES DIFERENTE

    // En PostgreSQL, añadir un valor a un ENUM existente.
    // IF NOT EXISTS previene errores si la migración se corre múltiples veces por error.
    await queryInterface.sequelize.query(`ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS 'checkbox-group';`);
  },

  async down(queryInterface, Sequelize) {
    // Revertir esto es complicado y riesgoso si el valor ya está en uso.
    // La opción más segura es no hacer nada o comentar la operación.
    // Si necesitas eliminarlo, tendrías que asegurarte de que ningún campo lo usa.
    // await queryInterface.sequelize.query(`
    //   -- Comando para eliminar un valor de un ENUM (complejo y depende de la versión de PG)
    //   -- ESTO ES UN EJEMPLO, NO EJECUTAR SIN ENTENDER LAS IMPLICACIONES
    //   -- ALTER TYPE "enum_form_fields_fieldType" RENAME TO "enum_form_fields_fieldType_old";
    //   -- CREATE TYPE "enum_form_fields_fieldType" AS ENUM('text', 'textarea', ... /* todos los valores MENOS checkbox-group */);
    //   -- ALTER TABLE "form_fields" ALTER COLUMN "fieldType" TYPE "enum_form_fields_fieldType" USING "fieldType"::text::"enum_form_fields_fieldType";
    //   -- DROP TYPE "enum_form_fields_fieldType_old";
    // `);
    console.log("Revertir la adición de 'checkbox-group' al ENUM fieldType requiere intervención manual o una estrategia de migración más compleja si el valor está en uso.");
  }
};