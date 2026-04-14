const express = require('express');
const cors = require('cors');
const path = require('path');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose'); // Librería nueva

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 1. CONEXIÓN A LA BASE DE DATOS ETERNA
const uri = "mongodb+srv://chris:<db_password>@cluster0.qn9ys6b.mongodb.net/?appName=Cluster0"; // Pega tu enlace de MongoDB aquí (con tu contraseña real)
mongoose.connect(uri)
    .then(() => console.log('¡Conectado al Cerebro Eterno (MongoDB)!'))
    .catch(err => console.log('Error de conexión:', err));

// 2. CREAR EL "MOLDE" DE LA RESERVACIÓN
const reservaSchema = new mongoose.Schema({
    id: Number,
    nombre: String,
    fecha: String,
    hora: String,
    personas: Number,
    pedido: String,
    nota: String,
    estado: { type: String, default: 'pendiente' }
});
const Reserva = mongoose.model('Reserva', reservaSchema);

// 3. RUTAS ACTUALIZADAS (Ahora guardan en Disco Duro, no en RAM)
app.post('/api/reservaciones', async (req, res) => {
    const nueva = new Reserva({ ...req.body, id: Date.now(), estado: 'pendiente' });
    await nueva.save(); // Guarda para siempre
    res.status(201).json({ mensaje: '¡Reservación guardada eternamente!', reservacion: nueva });
});

app.get('/api/reservaciones', async (req, res) => {
    const reservaciones = await Reserva.find(); // Lee de la base de datos
    res.json(reservaciones);
});

app.put('/api/reservaciones/:id/completar', async (req, res) => {
    const id = parseInt(req.params.id);
    const reserva = await Reserva.findOneAndUpdate({ id: id }, { estado: 'completada' });
    if (reserva) {
        res.json({ mensaje: 'Mesa servida con éxito' });
    } else {
        res.status(404).json({ error: 'No se encontró la reserva' });
    }
});

app.get('/api/exportar-pdf', async (req, res) => {
    try {
        const reservaciones = await Reserva.find(); // Buscar todas las reservas
        
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Logistica_Lucy.pdf');
        doc.pipe(res);

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
    } catch (error) {
        res.status(500).send("Error generando el PDF");
    }
});

app.listen(PORT, () => console.log(`Lucy Server activo en puerto ${PORT}`));