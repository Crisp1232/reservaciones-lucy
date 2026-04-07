const express = require('express');
const cors = require('cors');
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let reservaciones = [];

// Rutas de la API
app.post('/api/reservaciones', (req, res) => {
    const nueva = { ...req.body, id: Date.now(), estado: 'pendiente' };
    reservaciones.push(nueva);
    res.status(201).json({ mensaje: '¡Reservación exitosa!', reservacion: nueva });
});

app.get('/api/reservaciones', (req, res) => {
    res.json(reservaciones);
});

app.put('/api/reservaciones/:id/completar', (req, res) => {
    const id = parseInt(req.params.id);
    const index = reservaciones.findIndex(r => r.id === id);
    if (index !== -1) {
        reservaciones[index].estado = 'completada';
        res.json({ mensaje: 'Mesa servida con éxito' });
    } else {
        res.status(404).json({ error: 'No se encontró la reserva' });
    }
});

// PDF Profesional: Organizado por día y hora (Solo pendientes)
app.get('/api/exportar-pdf', (req, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Logistica_Lucy.pdf');
    doc.pipe(res);

    // Encabezado
    doc.fillColor('#1b263b').fontSize(26).text('GRILL & BAKERY LUCY', { align: 'center', b: true });
    doc.fontSize(12).fillColor('#666').text('Hoja de Ruta de Cocina y Servicio', { align: 'center' });
    doc.moveDown();
    doc.path('M 50 110 L 550 110').lineWidth(2).stroke('#e9c46a');
    doc.moveDown(2);

    const pendientes = reservaciones.filter(r => r.estado === 'pendiente')
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

    if (pendientes.length === 0) {
        doc.fillColor('black').fontSize(16).text('No hay pedidos pendientes para hoy.', { align: 'center' });
    } else {
        let fechaActual = "";
        pendientes.forEach((r) => {
            if (r.fecha !== fechaActual) {
                fechaActual = r.fecha;
                doc.moveDown();
                doc.rect(50, doc.y, 500, 25).fill('#f1f1f1');
                doc.fillColor('#1b263b').fontSize(14).text(`FECHA: ${fechaActual}`, 60, doc.y - 18, { b: true });
                doc.moveDown(0.5);
            }
            
            doc.fillColor('black').fontSize(12).text(`${r.hora} - Cliente: ${r.nombre} (${r.personas} pers.)`, { b: true });
            doc.fillColor('#e67e22').fontSize(11).text(`ORDEN: ${r.pedido}`);
            if(r.nota) doc.fillColor('#7f8c8d').fontSize(10).text(`NOTA: ${r.nota}`);
            doc.moveDown(0.5);
            doc.path(`M 50 ${doc.y} L 550 ${doc.y}`).lineWidth(0.5).stroke('#ccc');
            doc.moveDown(0.5);
        });
    }
    doc.end();
});

app.listen(PORT, () => console.log(`Lucy Server activo en puerto ${PORT}`));