// src/controllers/assessment.controller.js
const db = require('../models');
const Assessment = db.Assessment;
const ValuationType = db.ValuationType;
const FormField = db.FormField; // Para validar datos del formulario
const { Op } = require("sequelize"); // Para búsquedas
// Simulación del cliente de IA (reemplaza con tu cliente real, ej. OpenAI)
const { generateIaReport } = require('../services/ia.service'); // Crearemos este servicio
// Para PDF (reemplaza con tu librería, ej. Puppeteer)
const { generatePdfFromHtml } = require('../services/pdf.service'); // Crearemos este servicio


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
    const userId = req.userId; // Del middleware verifyToken

    if (!valuationTypeId || !formData) {
        return res.status(400).json({ message: "valuationTypeId y formData son requeridos." });
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
            return res.status(404).json({ message: "Tipo de valoración no encontrado." });
        }
        if (!valuationType.isActive) {
            return res.status(400).json({ message: "Este tipo de valoración no está activo." });
        }

        // TODO: Validación de formData contra los fields de valuationType.sections
        // (ej. campos requeridos, tipos de datos si es necesario)

        const systemPrompt = valuationType.systemPrompt;
        const formattedInputs = formatDataForIA(formData, valuationType.sections);
        
        let reportText = null;
        try {
            console.log("Enviando a IA. Prompt:", systemPrompt.substring(0,100)+"...", "Inputs:", formattedInputs.substring(0,200)+"...");
            reportText = await generateIaReport(systemPrompt, formattedInputs);
            console.log("Respuesta de IA recibida.");
        } catch (iaError) {
            console.error("Error al generar informe con IA:", iaError);
            // Decidir si guardar la valoración sin informe o devolver error
            // Por ahora, guardaremos con informe null y un mensaje de error.
            toast.error("Hubo un problema al generar el informe con la IA.");
            // Continuamos para guardar la valoración con el informe como null
        }


        const newAssessment = await Assessment.create({
            userId,
            valuationTypeId,
            formData,
            generatedReportText: reportText,
        });

        res.status(201).json({
            message: "Valoración creada exitosamente.",
            assessment: newAssessment,
            // Si el informe es null, el frontend debería indicar que hubo un problema con la IA
        });

    } catch (error) {
        console.error("Error al crear la valoración:", error);
        res.status(500).json({ message: "Error interno del servidor al crear la valoración." });
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
    // Podrías añadir paginación aquí con req.query.page y req.query.limit
    try {
        const assessments = await Assessment.findAll({
            where: { userId: userId },
            include: [ // Incluir datos relacionados para mostrar en la lista
                { model: ValuationType, as: 'valuationType', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']], // Más recientes primero
            // limit: 10, // Ejemplo de paginación
            // offset: 0,
        });
        res.status(200).json(assessments);
    } catch (error) {
        console.error("Error al obtener valoraciones del usuario:", error);
        res.status(500).json({ message: "Error interno al obtener las valoraciones." });
    }
};