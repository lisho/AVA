// src/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./models'); // Asegúrate de que index.js en models exporte sequelize
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');   // Importa las rutas de admin.routes.js

const app = express();

// Middlewares
app.use(cors()); // Configurar CORS adecuadamente para producción más adelante
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: 'API del Asistente Social funcionando!' });
});


app.use('/api/auth', authRoutes);   // Usa las rutas de auth.routes.js
app.use('/api/admin', adminRoutes); // Usa las rutas de admin.routes.js
// Aquí puedes agregar más rutas según sea necesario



// Sincronización con la BD (para desarrollo, luego usar migraciones)
// db.sequelize.sync({ force: true }).then(() => { // force: true borra y recrea tablas
//db.sequelize.sync(
   // { force: true }
//.then(() => {
//    console.log('Base de datos sincronizada.');
//}).catch(err => {
//    console.error('Error al sincronizar la base de datos:', err);
//});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}.`);
});