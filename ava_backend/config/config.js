// config/config.js
require('dotenv').config(); // Asegura que .env se carga

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: "postgres",
    dialectOptions: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require') ? { // Lógica para SSL si está en DATABASE_URL o variables separadas
      ssl: {
        require: true,
        rejectUnauthorized: false, // CUIDADO en producción
      },
    } : undefined,
  },
  // ... test y production environments ...
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // AJUSTA ESTO PARA PRODUCCIÓN
      },
    },
  },
};