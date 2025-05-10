// src/controllers/auth.controller.js
const db = require('../models');
const User = db.User;
const Role = db.Role; // Para obtener el nombre del rol
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
        }

        const user = await User.findOne({
            where: { email },
            include: [{ model: Role, attributes: ['name'] }] // Incluir el nombre del rol
        });

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' }); // Usuario no encontrado
        }

        const isValid = await user.isValidPassword(password);
        if (!isValid) {
            return res.status(401).json({ message: 'Credenciales inválidas.' }); // Contraseña incorrecta
        }

        const token = jwt.sign(
            { userId: user.id, role: user.Role.name }, // Incluye el nombre del rol
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // O '1d', '7d', etc.
        );

        res.status(200).json({
            message: 'Login exitoso.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.Role.name
            }
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.getCurrentUser = async (req, res) => {
    // req.userId y req.userRole son establecidos por el middleware verifyToken
    if (!req.userId) {
        return res.status(401).json({ message: "No autenticado." });
    }

    try {
        const user = await User.findByPk(req.userId, {
            attributes: ['id', 'name', 'email', 'createdAt', 'updatedAt'], // No enviar passwordHash
            include: [{
                model: Role,
                attributes: ['name']
            }]
        });

        if (!user) {
            // Esto sería raro si el token es válido y el userId existe,
            // pero es una buena comprobación.
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        // Formatear el usuario como lo espera el frontend (si es necesario)
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.Role ? user.Role.name : null, // Manejar si el rol no está por alguna razón
            // puedes añadir más campos si los necesitas en el frontend
        };

        res.status(200).json({ user: userData });
    } catch (error) {
        console.error("Error en getCurrentUser:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener datos del usuario." });
    }
};