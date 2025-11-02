const express = require('express');
const path = require('path');
const mqtt = require('mqtt');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const Postura = require('./models/postura');
const posturasRoutes = require('./routes/posturas.route');

app.use('/api/posturas', posturasRoutes);

const MQTT_BROKER = 'mqtt://82.197.65.136:1883';
const MQTT_TOPIC_ESTADO = 'sensor/estado';
const MQTT_TOPIC_DATOS = 'sensor/datos';

console.log('Conectando al broker MQTT...');
const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
    console.log('Conectado al broker MQTT');

    // Suscribirse a ambos tópicos
    mqttClient.subscribe([MQTT_TOPIC_ESTADO, MQTT_TOPIC_DATOS], (err) => {
        if (err) {
            console.error('Error suscribiéndose a tópicos:', err);
        } else {
            console.log(`Suscrito a tópicos: ${MQTT_TOPIC_ESTADO}, ${MQTT_TOPIC_DATOS}`);
        }
    });
});

mqttClient.on('error', (err) => {
    console.error('Error de conexión MQTT:', err);
});

mqttClient.on('message', async (topic, message) => {
    try {
        if (topic === MQTT_TOPIC_ESTADO) {
            const estado = message.toString();
            console.log(`Estado recibido: ${estado}`);

        } else if (topic === MQTT_TOPIC_DATOS) {
            // Manejar datos JSON completos
            const datos = JSON.parse(message.toString());
            console.log('Datos JSON recibidos:', datos);

            // Validar datos requeridos
            if (datos.id_sesion && datos.angulo_toracico !== undefined) {
                try {
                    // Insertar en PostgreSQL
                    const posturaGuardada = await Postura.insert(datos);
                    console.log('Postura guardada en BD:', posturaGuardada.id);
                } catch (error) {
                    console.error('Error guardando en BD:', error);
                }
            } else {
                console.warn('Datos incompletos recibidos:', datos);
            }
        }
    } catch (error) {
        console.error('Error procesando mensaje MQTT:', error);
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log('Esperando datos del sensor MPU6050...');
});