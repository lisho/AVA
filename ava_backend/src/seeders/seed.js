// src/seeders/seed.js
const db = require('../models'); // Asegúrate que la ruta es correcta
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        // Sincronizar (asegura que las tablas existen, útil para el primer run)
        // En producción usar migraciones, no sync con force:true
        await db.sequelize.sync({ force: true }); // CUIDADO: force: true borra datos existentes
        console.log('Base de datos sincronizada y reseteada.');

        // Crear Roles
        const adminRole = await db.Role.create({ name: 'admin' });
        const workerRole = await db.Role.create({ name: 'trabajador_social' });
        console.log('Roles creados.');

        // Crear Usuario Admin
        const adminPassword = 'adminpassword'; // Cambiar en producción
        // const salt = await bcrypt.genSalt(10); // El hook User.beforeCreate ya lo hace
        // const hashedPassword = await bcrypt.hash(adminPassword, salt); // El hook lo hace

        await db.User.create({
            name: 'Administrador Principal',
            email: 'admin@example.com',
            passwordHash: adminPassword, // El hook se encargará del hash
            roleId: adminRole.id
        });
        console.log('Usuario administrador creado.');

        console.log('Sembrado de base de datos completado.');
    } catch (error) {
        console.error('Error sembrando la base de datos:', error);
    } finally {
        await db.sequelize.close();
    }
};

seedDatabase();