// src/models/index.js
const { Sequelize, DataTypes } = require('sequelize');
// La siguiente línea es para asegurar que .env se carga correctamente desde cualquier ubicación del script
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

let sequelize;

if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Esto puede ser necesario dependiendo de la configuración de Neon y tu entorno.
                                        // Para producción, investiga bien las implicaciones de rejectUnauthorized.
                                        // Neon recomienda 'pg-hstore' para algunas funcionalidades, pero Sequelize debería manejarlo.
            }
        },
        logging: console.log, // Muestra logs SQL, cambia a false en producción o para menos verbosidad
        // define: {
        //     // Opciones globales para todos los modelos, si las necesitas
        //     // underscored: true, // si quieres usar snake_case para las columnas generadas automáticamente
        // }
    });
} else {
    // Configuración para base de datos local (si aún quieres mantenerla como fallback o para desarrollo local sin Neon)
    console.warn("DATABASE_URL no encontrada en .env, intentando configuración local (si existe).");
    sequelize = new Sequelize(
        process.env.DB_NAME || 'asistente_social_db',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'password',
        {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            dialect: 'postgres',
            logging: console.log,
        }
    );
}

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Cargar modelos
db.Role = require('./role.model.js')(sequelize, DataTypes);
db.User = require('./user.model.js')(sequelize, DataTypes);
// ... aquí irán los demás modelos cuando los creemos (ValuationType, FormSection, FormField)

// Definir asociaciones
db.Role.hasMany(db.User, { foreignKey: 'roleId' });
db.User.belongsTo(db.Role, { foreignKey: 'roleId' });
db.ValuationType = require('./valuationType.model.js')(sequelize, DataTypes); 
db.FormSection = require('./formSection.model.js')(sequelize, DataTypes); 
db.FormField = require('./formField.model.js')(sequelize, DataTypes); 
// ... y las demás asociaciones
// User - Role
db.Role.hasMany(db.User, { foreignKey: 'roleId' });
db.User.belongsTo(db.Role, { foreignKey: 'roleId' });

// ValuationType - FormSection
db.ValuationType.hasMany(db.FormSection, {
    foreignKey: 'valuationTypeId',
    as: 'sections', // Alias para acceder a las secciones desde un ValuationType
    onDelete: 'CASCADE', // Si se borra un ValuationType, se borran sus secciones
});
db.FormSection.belongsTo(db.ValuationType, {
    foreignKey: 'valuationTypeId',
    as: 'valuationType',
});

// FormSection - FormField
db.FormSection.hasMany(db.FormField, {
    foreignKey: 'sectionId',
    as: 'fields', // Alias para acceder a los campos desde una FormSection
    onDelete: 'CASCADE', // Si se borra una FormSection, se borran sus campos
});
db.FormField.belongsTo(db.FormSection, {
    foreignKey: 'sectionId',
    as: 'section',
});


module.exports = db;

// Función para probar la conexión
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos (Neon) establecida exitosamente.');
    } catch (error) {
        console.error('No se pudo conectar a la base de datos (Neon):', error);
    }
}

testConnection(); // Llama a la función para probar al iniciar la app