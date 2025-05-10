// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
// router.post('/register', authController.register); // Para más adelante

// NUEVA RUTA para obtener datos del usuario actual (protegida)
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;