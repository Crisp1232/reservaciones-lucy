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

app.post('/api/reservaciones', (req, res) => {
    const nueva = { ...req.body, id: Date.now(), estado: 'pendiente' };
    reservaciones.push(nueva);
    res.status(201).json({ mensaje: 'Reservación guardada', reservacion: nueva });
});

app.get('/api/reservaciones', (req, res) => {
    res.json(reservaciones);
});

app.put('/api/reservaciones/:id/completar', (req, res) => {
    const id = parseInt(req.params.id);
    const reserva = reservaciones.find(r => r.id === id);
    if (reserva) {
        reserva.estado = 'completada';
        res.json({ mensaje: 'Mesa servida' });
    } else {
        res.status(404).json({ error: 'No encontrada' });
    }
});

app.get('/api/exportar-pdf', (req, res) => {
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Pendientes_Lucy.pdf');
    doc.pipe(res);

    doc.fontSize(22).text('GRILL & BAKERY LUCY', { align: 'center' });
    doc.fontSize(14).text('HOJA DE TRABAJO: MESAS PENDIENTES', { align: 'center' });
    doc.moveDown();
    
    // Filtro estricto: Solo pendientes y ordenado por Fecha -> Hora
    const pendientes = reservaciones.filter(r => r.estado === 'pendiente')
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

    if (pendientes.length === 0) {
        doc.text('No hay reservaciones pendientes.');
    } else {
        let fechaActual = "";
        pendientes.forEach((r) => {
            if (r.fecha !== fechaActual) {
                fechaActual = r.fecha;
                doc.moveDown();
                doc.fillColor('black').fontSize(14).text(`DÍA: ${fechaActual}`, { underline: true });
                doc.moveDown(0.5);
            }
            doc.fillColor('#333').fontSize(11)
               .text(`Hora: ${r.hora} | Cliente: ${r.nombre} | Pers: ${r.personas}`)
               .fillColor('blue').text(`Pedido: ${r.pedido}`)
               .fillColor('black').text(`Notas: ${r.nota || 'Sin notas'}`)
               .moveDown(0.8);
            doc.path(`M 50 ${doc.y} L 550 ${doc.y}`).strokeOpacity(0.1).stroke().strokeOpacity(1);
        });
    }
    doc.end();
});

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));