'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // REEMPLAZA 'enum_form_fields_fieldType' CON EL NOMBRE EXACTO DE TU TIPO ENUM
    const enumTypeName = 'enum_form_fields_fieldType'; 

    try {
      // Verificar si el valor ya existe para evitar errores si se corre de nuevo
      const result = await queryInterface.sequelize.query(
        `SELECT unnest(enum_range(NULL::"${enumTypeName}"))::text AS enum_value;`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const existingValues = result.map(row => row.enum_value);

      if (!existingValues.includes('checkbox-group')) {
        // Añadir el valor al tipo ENUM.
        // El comando varía ligeramente si el tipo ya tiene valores o si es el primer valor después de un tipo vacío.
        // 'IF NOT EXISTS' en `ADD VALUE` es para PostgreSQL 12+. Si tienes una versión anterior,
        // podrías necesitar quitar `IF NOT EXISTS`, pero entonces la migración fallará si se ejecuta dos veces.
        await queryInterface.sequelize.query(`ALTER TYPE "${enumTypeName}" ADD VALUE IF NOT EXISTS 'checkbox-group';`);
        console.log(`Valor 'checkbox-group' añadido al ENUM "${enumTypeName}".`);
      } else {
        console.log(`Valor 'checkbox-group' ya existe en el ENUM "${enumTypeName}". No se requiere acción.`);
      }
    } catch (error) {
      console.error(`Error al intentar añadir valor al ENUM "${enumTypeName}":`, error);
      // Si el error es "cannot alter type ... because it is already committed"
      // puede ser porque estás dentro de una transacción manejada por Sequelize CLI.
      // ALTER TYPE ... ADD VALUE no puede correr dentro de una transacción explícita antes de PG12
      // o si el tipo es usado como default.
      // Si esto falla, una opción es ejecutar el ALTER TYPE manualmente en la BD fuera de una transacción,
      // o asegurar que la migración no esté envuelta en una transacción explícita si tu PG es < 12.
      // Sequelize CLI por defecto envuelve las migraciones en transacciones.
      
      // Alternativa si `ADD VALUE IF NOT EXISTS` no es soportado o da problemas con transacciones:
      // Primero, intenta añadirlo. Si falla porque ya existe, captura el error específico.
      // try {
      //   await queryInterface.sequelize.query(`ALTER TYPE "${enumTypeName}" ADD VALUE 'checkbox-group';`);
      // } catch (addError) {
      //   if (addError.message.includes("already exists")) { // Ajusta el mensaje de error específico de tu PG
      //     console.log(`Valor 'checkbox-group' ya existe en ENUM "${enumTypeName}".`);
      //   } else {
      //     throw addError; // Relanzar otros errores
      //   }
      // }
      throw error; // Relanzar el error para que la migración falle si no se puede añadir
    }
  },

  async down(queryInterface, Sequelize) {
    // Revertir la adición de un valor a un ENUM es destructivo si el valor está en uso.
    // Generalmente no se implementa un 'down' para esto o requiere pasos manuales complejos.
    const enumTypeName = 'enum_form_fields_fieldType'; // REEMPLAZA
    console.warn(`Revertir la adición de 'checkbox-group' del ENUM "${enumTypeName}" no se realizará automáticamente. Si es necesario, debe hacerse manualmente y con cuidado para no perder datos.`);
    // Para eliminar un valor (¡PELIGROSO!):
    // 1. Asegurarse que ningún dato usa 'checkbox-group'.
    // 2. Recrear el tipo ENUM sin 'checkbox-group' y migrar los datos.
    // Ejemplo conceptual (NO USAR EN PRODUCCIÓN SIN TESTEO EXHAUSTIVO):
    // await queryInterface.sequelize.query(`DELETE FROM pg_enum WHERE enumlabel = 'checkbox-group' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = '${enumTypeName}');`);
  }
};