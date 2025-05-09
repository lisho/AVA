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