// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;
const Role = db.Role;

const verifyToken = (req, res, next) => {
    let token = req.headers['authorization']; // 'Authorization: Bearer TOKEN'

    if (!token) {
        return res.status(403).json({ message: 'No se proporcionó token.' });
    }

    if (token.startsWith('Bearer ')) {
        // Remover "Bearer " para obtener solo el token
        token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("Error al verificar token:", err.name, err.message);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expirado. Por favor, inicie sesión de nuevo.' });
            }
            return res.status(401).json({ message: 'No autorizado. Token inválido.' });
        }
        req.userId = decoded.userId;
        req.userRole = decoded.role; // Asumimos que el rol está en el payload del token
        next();
    });
};

const isAdmin = async (req, res, next) => {
    // Este middleware debe usarse DESPUÉS de verifyToken
    if (!req.userId) { // Si verifyToken falló o no se usó antes
         return res.status(403).json({ message: "Se requiere autenticación." });
    }

    if (req.userRole && req.userRole === 'admin') {
        next();
        return;
    }

    // Alternativa si no confías solo en el rol del token (más seguro, pero más queries):
    // try {
    //     const user = await User.findByPk(req.userId, {
    //         include: [{ model: Role, attributes: ['name'] }]
    //     });
    //     if (user && user.Role && user.Role.name === 'admin') {
    //         next();
    //     } else {
    //         res.status(403).json({ message: 'Requiere rol de Administrador.' });
    //     }
    // } catch (error) {
    //     console.error("Error en isAdmin middleware:", error);
    //     res.status(500).json({ message: 'Error al verificar rol de usuario.' });
    // }
    res.status(403).json({ message: 'Requiere rol de Administrador.' });
};

const isTrabajadorSocial = async (req, res, next) => {
    if (!req.userId) {
         return res.status(403).json({ message: "Se requiere autenticación." });
    }
    if (req.userRole && (req.userRole === 'trabajador_social' || req.userRole === 'admin')) { // Admin puede hacer lo que un trabajador social
        next();
        return;
    }
    res.status(403).json({ message: 'Requiere rol de Trabajador Social o Administrador.' });
};


module.exports = {
    verifyToken,
    isAdmin,
    isTrabajadorSocial
};