const express = require('express');
const cors = require('cors');
const path = require('path');
const PDFDocument = require('pdfkit'); // <-- Nueva librería

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let reservaciones = [];

app.post('/api/reservaciones', (req, res) => {
    const nueva = { ...req.body, id: Date.now() };
    reservaciones.push(nueva);
    res.status(201).json({ mensaje: 'Reservación guardada', reservacion: nueva });
});

app.get('/api/reservaciones', (req, res) => {
    res.json(reservaciones);
});

// RUTA PARA GENERAR PDF
app.get('/api/exportar-pdf', (req, res) => {
    const doc = new PDFDocument({ margin: 50 });

    // Configurar descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Reservaciones.pdf');

    doc.pipe(res);

    // Diseño del PDF
    doc.fontSize(20).text('REPORTE DE RESERVACIONES', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generado el: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown();
    doc.path('M 50 120 L 550 120').stroke(); // Línea decorativa
    doc.moveDown();

    if (reservaciones.length === 0) {
        doc.text('No hay reservaciones registradas.');
    } else {
        reservaciones.forEach((r, i) => {
            doc.fillColor('#007bff').fontSize(14).text(`${i + 1}. Cliente: ${r.nombre}`);
            doc.fillColor('black').fontSize(12)
               .text(`   Fecha: ${r.fecha} | Hora: ${r.hora}`)
               .text(`   Personas: ${r.personas}`)
               .text(`   Nota: ${r.nota || 'Sin notas'}`)
               .moveDown(0.5);
            doc.path(`M 50 ${doc.y} L 300 ${doc.y}`).dash(5, { space: 10 }).stroke().undash();
            doc.moveDown(0.8);
        });
    }

    doc.end();
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));