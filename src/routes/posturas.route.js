const express = require('express');
const router = express.Router();
const Postura = require('../models/postura');

// Obtener todas las posturas de una sesión
router.get('/sesion/:id_sesion', async (req, res) => {
    try {
        const { id_sesion } = req.params;
        const posturas = await Postura.getBySesion(id_sesion);
        res.json(posturas);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo posturas' });
    }
});

// Obtener estadísticas de sesión
router.get('/sesion/:id_sesion/estadisticas', async (req, res) => {
    try {
        const { id_sesion } = req.params;
        const stats = await Postura.getStatsBySesion(id_sesion);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

// Insertar nueva postura (endpoint HTTP para pruebas)
router.post('/', async (req, res) => {
    try {
        const nuevaPostura = await Postura.insert(req.body);
        res.status(201).json(nuevaPostura);
    } catch (error) {
        res.status(500).json({ error: 'Error insertando postura' });
    }
});

module.exports = router;