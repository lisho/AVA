// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const valuationTypeController = require('../controllers/valuationType.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const formSectionController = require('../controllers/formSection.controller'); // NUEVO
const formFieldController = require('../controllers/formField.controller');

// Proteger todas las rutas de este archivo con verifyToken e isAdmin
router.use(verifyToken, isAdmin);

// Rutas para ValuationTypes
router.post('/valuation-types', valuationTypeController.create);
router.get('/valuation-types', valuationTypeController.findAll);
router.get('/valuation-types/:id', valuationTypeController.findOne);
router.put('/valuation-types/:id', valuationTypeController.update);
router.delete('/valuation-types/:id', valuationTypeController.delete);

// Rutas para FormSections (anidadas bajo un ValuationType)
// Nótese el :valuationTypeId en la ruta para establecer el contexto
router.post('/valuation-types/:valuationTypeId/sections', formSectionController.create);
router.get('/valuation-types/:valuationTypeId/sections', formSectionController.findAllByValuationType);
// Para GET (uno), PUT, DELETE de una sección específica, usamos su propio ID
router.get('/sections/:sectionId', formSectionController.findOne);
router.put('/sections/:sectionId', formSectionController.update);
router.delete('/sections/:sectionId', formSectionController.delete);

// Rutas para FormFields (anidadas bajo una FormSection)
// Nótese el :sectionId en la ruta para establecer el contexto
router.post('/sections/:sectionId/fields', formFieldController.create);
router.get('/sections/:sectionId/fields', formFieldController.findAllBySection);
// Para GET (uno), PUT, DELETE de un campo específico, usamos su propio ID
router.get('/fields/:fieldId', formFieldController.findOne);
router.put('/fields/:fieldId', formFieldController.update);
router.delete('/fields/:fieldId', formFieldController.delete);

module.exports = router;