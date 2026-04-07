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
    res.status(201).json({ mensaje: 'Reservación guardada con éxito', reservacion: nueva });
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
    res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Reservas_Lucy.pdf');
    doc.pipe(res);

    doc.fontSize(22).text('GRILL & BAKERY LUCY', { align: 'center' });
    doc.fontSize(16).text('Hoja de Ruta de Reservaciones', { align: 'center' });
    doc.moveDown();
    
    // Ordenar por fecha y luego por hora
    const reservacionesOrdenadas = [...reservaciones].sort((a, b) => {
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
        return a.hora.localeCompare(b.hora);
    });

    if (reservacionesOrdenadas.length === 0) {
        doc.text('No hay reservaciones.');
    } else {
        reservacionesOrdenadas.forEach((r, i) => {
            const status = r.estado === 'completada' ? '[SERVIDA]' : '[PENDIENTE]';
            doc.fillColor(r.estado === 'completada' ? 'green' : 'red')
               .fontSize(12).text(`${r.fecha} | ${r.hora} - ${r.nombre} ${status}`);
            
            doc.fillColor('black').fontSize(11)
               .text(`   Personas: ${r.personas}`)
               .text(`   Pedido: ${r.pedido}`)
               .text(`   Notas: ${r.nota || 'Ninguna'}`)
               .moveDown(0.8);
            doc.path(`M 50 ${doc.y} L 550 ${doc.y}`).strokeOpacity(0.2).stroke().strokeOpacity(1);
            doc.moveDown(0.5);
        });
    }
    doc.end();
});

app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));