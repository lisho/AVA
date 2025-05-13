// src/routes/assessment.routes.js
const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessment.controller');
const valuationTypeController = require('../controllers/valuationType.controller'); // Para obtener estructura y activos
const { verifyToken, isTrabajadorSocial, isAdmin } = require('../middleware/auth.middleware'); // isAdmin puede ser necesario para algunos endpoints de admin

// Rutas para el trabajador social (o admin)

// Rutas para el trabajador social (o admin)
router.get('/valuation-types/active', [verifyToken, isTrabajadorSocial], (req, res, next) => {
    console.log('BACKEND: Accediendo a /api/app/valuation-types/active');
    next();
}, valuationTypeController.findAllActive);

router.get(
    '/forms/:valuationTypeId/structure', // <--- RUTA RELATIVA
    [verifyToken, isTrabajadorSocial], 
    valuationTypeController.findStructureById // Método en valuationType.controller
);

router.post( // <--- ASEGÚRATE DE QUE ESTA LÍNEA EXISTE Y ES 'POST'
    '/assessments', 
    [verifyToken, isTrabajadorSocial], 
    assessmentController.createAssessmentAndGenerateReport // <--- Y APUNTA AL MÉTODO CORRECTO
);

router.get('/assessments', [verifyToken, isTrabajadorSocial], (req, res, next) => {
    console.log('BACKEND: Accediendo a /api/app/assessments');
    next();
}, assessmentController.findUserAssessments);

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

// Listar valoraciones del usuario logueado
router.get(
    '/assessments',
    [verifyToken, isTrabajadorSocial],
    assessmentController.findUserAssessments
);

// GET: Obtener una valoración específica por su ID
router.get(
    '/assessments/:assessmentId',
    [verifyToken, isTrabajadorSocial],
    assessmentController.findOneAssessment
);

// PUT: Actualizar una valoración específica (ej. el texto del informe si se permite editar)
router.put(
    '/assessments/:assessmentId',
    [verifyToken, isTrabajadorSocial],
    assessmentController.updateAssessment
);

// DELETE: Eliminar una valoración específica
router.delete(
    '/assessments/:assessmentId',
    [verifyToken, isTrabajadorSocial],
    assessmentController.deleteAssessment
);

module.exports = router;