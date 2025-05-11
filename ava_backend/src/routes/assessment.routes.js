// src/routes/assessment.routes.js
const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessment.controller');
const valuationTypeController = require('../controllers/valuationType.controller'); // Para obtener estructura y activos
const { verifyToken, isTrabajadorSocial, isAdmin } = require('../middleware/auth.middleware'); // isAdmin puede ser necesario para algunos endpoints de admin

// Rutas para el trabajador social (o admin)
router.get(
    '/valuation-types/active', 
    [verifyToken, isTrabajadorSocial], // Solo trabajadores sociales o admins pueden ver los tipos activos
    valuationTypeController.findAllActive // Necesitaremos añadir este método al valuationType.controller
);

router.get(
    '/forms/:valuationTypeId/structure', 
    [verifyToken, isTrabajadorSocial], 
    valuationTypeController.findStructureById // Necesitaremos añadir este método
);

router.post(
    '/assessments', 
    [verifyToken, isTrabajadorSocial], 
    assessmentController.createAssessmentAndGenerateReport
);

router.get(
    '/assessments/:assessmentId/pdf', 
    [verifyToken, isTrabajadorSocial], 
    assessmentController.downloadAssessmentPDF
);

// Opcional: Listar valoraciones del usuario logueado
router.get(
    '/assessments',
    [verifyToken, isTrabajadorSocial],
    assessmentController.findUserAssessments
);


module.exports = router;