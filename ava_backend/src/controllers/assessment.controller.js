// src/controllers/assessment.controller.js
const db = require('../models');
const Assessment = db.Assessment;
const ValuationType = db.ValuationType;
const FormField = db.FormField; // Para validar datos del formulario
const User = db.User; // Para verificar permisos

const { Op } = require("sequelize"); // Para búsquedas
// Simulación del cliente de IA (reemplaza con tu cliente real, ej. OpenAI)
const { generateIaReport } = require('../services/ia.service'); // Crearemos este servicio
// Para PDF (reemplaza con tu librería, ej. Puppeteer)
//const { generatePdfFromHtml } = require('../services/pdf.service'); // Crearemos este servicio


// Formatear los datos del formulario para la IA
function formatDataForIA(formData, fields) {
    let formattedText = "Datos de la valoración:\n";
    fields.forEach(section => {
        formattedText += `\n--- ${section.title} ---\n`;
        section.fields.forEach(field => {
            const fieldValue = formData[field.id] || formData[`field_${field.id}`]; // Adaptar según cómo envíe el frontend
            if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
                formattedText += `${field.label}: ${fieldValue}\n`;
            } else {
                formattedText += `${field.label}: (No proporcionado)\n`;
            }
        });
    });
    return formattedText;
}

exports.createAssessmentAndGenerateReport = async (req, res) => {
    const { valuationTypeId, formData } = req.body;
    const userId = req.userId; 
    console.log('[ASSESSMENT CTRL POST /assessments] Received data:', { valuationTypeId, userId, formDataPreview: JSON.stringify(formData, null, 2).substring(0, 200) + '...' });


    if (!valuationTypeId || !formData || typeof formData !== 'object' || Object.keys(formData).length === 0) {
        console.error('[ASSESSMENT CTRL POST /assessments] Error: valuationTypeId o formData inválidos.', { valuationTypeId, formData });
        return res.status(400).json({ message: "valuationTypeId y un objeto formData válido y no vacío son requeridos." });
    }

    try {
        const valuationType = await ValuationType.findByPk(valuationTypeId, {
            include: [{
                model: db.FormSection,
                as: 'sections',
                include: [{ model: db.FormField, as: 'fields' }]
            }]
        });

        if (!valuationType) {
            console.error(`[ASSESSMENT CTRL POST /assessments] Error: ValuationType con ID ${valuationTypeId} no encontrado.`);
            return res.status(404).json({ message: "Tipo de valoración no encontrado." });
        }
        if (!valuationType.isActive) {
            console.error(`[ASSESSMENT CTRL POST /assessments] Error: ValuationType con ID ${valuationTypeId} no está activo.`);
            return res.status(400).json({ message: "Este tipo de valoración no está activo." });
        }

        // Validación básica de formData (puedes hacerla más exhaustiva)
        // Por ejemplo, verificar que todas las claves en formData corresponden a IDs de campos existentes
        // y que los campos requeridos están presentes.
        // Esta es una validación simple:
        const allFieldIdsInStructure = valuationType.sections.flatMap(s => s.fields.map(f => f.id));
        for (const key in formData) {
            if (!allFieldIdsInStructure.includes(key)) {
                console.warn(`[ASSESSMENT CTRL POST /assessments] Advertencia: formData contiene una clave inesperada '${key}' que no es un ID de campo conocido.`);
                // Podrías decidir eliminarla o simplemente advertir
            }
        }
        // Aquí podrías añadir lógica para verificar campos requeridos de 'valuationType.sections' en 'formData'

        const systemPrompt = valuationType.systemPrompt;
        const formattedInputs = formatDataForIA(formData, valuationType.sections); // Asegúrate que esta función existe y es robusta
        
        let reportText = null;
        try {
            reportText = await generateIaReport(systemPrompt, formattedInputs);
        } catch (iaError) {
            console.error("[ASSESSMENT CTRL POST /assessments] Error al generar informe con IA:", iaError);
            // Se guardará con reportText = null
        }

        const newAssessment = await Assessment.create({
            userId,
            valuationTypeId,
            formData, // formData debe ser un objeto JSON
            generatedReportText: reportText,
        });
        console.log('[ASSESSMENT CTRL POST /assessments] Nueva valoración creada, ID:', newAssessment.id);

        res.status(201).json({
            message: "Valoración creada exitosamente.",
            assessment: newAssessment,
        });

    } catch (error) {
        console.error("[ASSESSMENT CTRL POST /assessments] Error CRÍTICO al crear la valoración:", error);
        console.error("[ASSESSMENT CTRL POST /assessments] Error stack:", error.stack);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
             console.error("[ASSESSMENT CTRL POST /assessments] Detalle FK Error:", error.fields, error.index, error.parent?.toString());
        } else if (error.name === 'SequelizeValidationError') {
            console.error("[ASSESSMENT CTRL POST /assessments] Detalle Validation Error:", error.errors.map(e => ({ field: e.path, message: e.message })));
        }
        res.status(500).json({ message: "Error interno del servidor al crear la valoración.", errorDetails: error.message });
    }
};

exports.downloadAssessmentPDF = async (req, res) => {
    const { assessmentId } = req.params;
    const userId = req.userId; // Para verificar permisos

    try {
        const assessment = await Assessment.findOne({
            where: { id: assessmentId },
            include: [
                { model: db.User, as: 'user', attributes: ['id', 'name', 'email'] },
                { model: db.ValuationType, as: 'valuationType', attributes: ['id', 'name'] }
            ]
        });

        if (!assessment) {
            return res.status(404).json({ message: "Valoración no encontrada." });
        }

        // Verificar permisos: el usuario solo puede descargar sus propias valoraciones
        // o un admin puede descargar cualquiera (si implementas esa lógica de rol aquí)
        if (assessment.userId !== userId && req.userRole !== 'admin') {
            return res.status(403).json({ message: "No autorizado para acceder a esta valoración." });
        }
        
        if (!assessment.generatedReportText) {
            return res.status(400).json({ message: "El informe para esta valoración aún no ha sido generado o falló." });
        }

        // Construir un HTML simple para el PDF (puedes usar plantillas más complejas)
        // Aquí es donde el diseño del PDF se vuelve importante.
        const htmlContent = `
            <html>
                <head><title>Informe de Valoración</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;}
                    h2 { color: #555; margin-top: 30px; }
                    p { line-height: 1.6; white-space: pre-wrap; } /* pre-wrap para mantener saltos de línea del informe */
                    .meta { font-size: 0.9em; color: #777; margin-bottom: 20px; }
                </style>
                </head>
                <body>
                    <h1>Informe de Valoración</h1>
                    <div class="meta">
                        <p><strong>ID Valoración:</strong> ${assessment.id}</p>
                        <p><strong>Tipo de Valoración:</strong> ${assessment.valuationType.name}</p>
                        <p><strong>Realizado por:</strong> ${assessment.user.name || assessment.user.email}</p>
                        <p><strong>Fecha:</strong> ${new Date(assessment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <h2>Contenido del Informe:</h2>
                    <p>${assessment.generatedReportText.replace(/\n/g, '<br>')}</p> 
                </body>
            </html>
        `;

        const pdfBuffer = await generatePdfFromHtml(htmlContent);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="informe_valoracion_${assessment.id}.pdf"`, // Nombre del archivo
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error al generar PDF de valoración:", error);
        res.status(500).json({ message: "Error interno del servidor al generar el PDF." });
    }
};

exports.findUserAssessments = async (req, res) => {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query; // Paginación básica
    const offset = (page - 1) * limit;
    
   try {
        const { count, rows } = await Assessment.findAndCountAll({
            where: { userId: userId },
            include: [
                { 
                    model: ValuationType, 
                    as: 'valuationType', 
                    attributes: ['id', 'name'] 
                },
                // Podrías incluir el usuario si fuera necesario, pero ya filtramos por userId
                { 
                    model: User, 
                    as: 'user', 
                    attributes: ['id', 'name', 'email'] 
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            assessments: rows,
        });
    } catch (error) {
        console.error("[ASSESSMENT CTRL GET /assessments] Error al obtener valoraciones del usuario:", error);
        res.status(500).json({ message: "Error interno al obtener las valoraciones." });
    }
};

// GET: Obtener una valoración específica por su ID
exports.findOneAssessment = async (req, res) => {
    const { assessmentId } = req.params;
    const userId = req.userId;

    try {
        const assessment = await Assessment.findOne({
            where: { id: assessmentId },
            include: [
                { model: ValuationType, as: 'valuationType', attributes: ['id', 'name', 'description'] },
                { model: User, as: 'user', attributes: ['id', 'name', 'email'] } // Para mostrar quién la hizo
            ]
        });

        if (!assessment) {
            return res.status(404).json({ message: "Valoración no encontrada." });
        }

        // Verificar permisos: el usuario solo puede ver sus propias valoraciones o un admin puede ver cualquiera
        if (assessment.userId !== userId && req.userRole !== 'admin') {
            return res.status(403).json({ message: "No autorizado para acceder a esta valoración." });
        }

        res.status(200).json(assessment);
    } catch (error) {
        console.error(`[ASSESSMENT CTRL GET /assessments/${assessmentId}] Error al obtener la valoración:`, error);
        res.status(500).json({ message: "Error interno al obtener la valoración." });
    }
};

// PUT: Actualizar una valoración específica
exports.updateAssessment = async (req, res) => {
    const { assessmentId } = req.params;
    const userId = req.userId;
    const { formData, generatedReportText } = req.body; // Ahora puede recibir ambos

    if (formData === undefined && generatedReportText === undefined) {
        return res.status(400).json({ message: "Se requiere al menos 'formData' o 'generatedReportText' para actualizar." });
    }

    try {
        const assessment = await Assessment.findByPk(assessmentId);

        if (!assessment) {
            return res.status(404).json({ message: "Valoración no encontrada." });
        }
        if (assessment.userId !== userId && req.userRole !== 'admin') {
            return res.status(403).json({ message: "No autorizado para actualizar esta valoración." });
        }

        const updateData = {};
        let reportNeedsRegeneration = false;

        if (formData !== undefined) {
            // TODO: Validación exhaustiva de formData contra la estructura del ValuationType es MUY RECOMENDADA aquí.
            // Por ahora, asumimos que el frontend envía un formData con la estructura correcta de { fieldId: value }
            if (typeof formData !== 'object' || formData === null) {
                return res.status(400).json({ message: "El campo 'formData' debe ser un objeto válido." });
            }
            updateData.formData = formData;
            updateData.generatedReportText = null; // Borrar informe si los datos del formulario cambian
            reportNeedsRegeneration = true;
            console.log(`[ASSESSMENT CTRL PUT /assessments/${assessmentId}] formData actualizado, informe borrado.`);
        }

        if (generatedReportText !== undefined) { // Esto se usará más tarde desde la vista individual
            updateData.generatedReportText = generatedReportText;
            console.log(`[ASSESSMENT CTRL PUT /assessments/${assessmentId}] generatedReportText actualizado.`);
        }
        
        const [numberOfAffectedRows, updatedAssessments] = await Assessment.update(updateData, {
            where: { id: assessmentId },
            returning: true,
        });

        if (numberOfAffectedRows > 0) {
            const responsePayload = { 
                message: "Valoración actualizada exitosamente.", 
                assessment: updatedAssessments[0],
                reportNeedsRegeneration 
            };
            if (reportNeedsRegeneration) {
                responsePayload.message = "Datos de la valoración actualizados. El informe previo ha sido borrado y necesita ser regenerado.";
            }
            res.status(200).json(responsePayload);
        } else {
            res.status(404).json({ message: "Valoración no encontrada (post-actualización)." });
        }
    } catch (error) {
        console.error(`[ASSESSMENT CTRL PUT /assessments/${assessmentId}] Error al actualizar valoración:`, error);
        res.status(500).json({ message: "Error interno al actualizar la valoración." });
    }
};

// DELETE: Eliminar una valoración específica
exports.deleteAssessment = async (req, res) => {
    const { assessmentId } = req.params;
    const userId = req.userId;

    try {
        const assessment = await Assessment.findByPk(assessmentId);

        if (!assessment) {
            return res.status(404).json({ message: "Valoración no encontrada para eliminar." });
        }

        if (assessment.userId !== userId && req.userRole !== 'admin') {
            return res.status(403).json({ message: "No autorizado para eliminar esta valoración." });
        }

        await assessment.destroy(); // O Assessment.destroy({ where: { id: assessmentId } });

        res.status(200).json({ message: "Valoración eliminada exitosamente." });
    } catch (error) {
        console.error(`[ASSESSMENT CTRL DELETE /assessments/${assessmentId}] Error al eliminar la valoración:`, error);
        res.status(500).json({ message: "Error interno al eliminar la valoración." });
    }
};