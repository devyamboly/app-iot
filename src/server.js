const express = require('express');
const path = require('path');
const mqtt = require('mqtt');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4020;
const TIME = 5 

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const Postura = require('./models/postura');
const posturasRoutes = require('./routes/posturas.route');

app.use('/api/posturas', posturasRoutes);

// Control de inserción a la base de datos (máximo cada 5 segundos)
let ultimaInsercion = 0;
const INTERVALO_INSERCION = 5000; // 5 segundos en milisegundos
let datoPendiente = null;

const MQTT_BROKER = 'mqtt://82.197.65.136:1883';
const MQTT_TOPIC_ESTADO = 'sensor/estado';
const MQTT_TOPIC_DATOS = 'sensor/datos';

console.log('Conectando al broker MQTT...');
const mqttClient = mqtt.connect(MQTT_BROKER);

// Inicializar base de datos
Postura.createTable();

// Intervalo para insertar datos pendientes cada 5 segundos
setInterval(async () => {
    if (datoPendiente !== null) {
        const tiempoActual = new Date().getTime();
        const tiempoTranscurrido = tiempoActual - ultimaInsercion;
        
        if (tiempoTranscurrido >= INTERVALO_INSERCION) {
            try {
                const posturaGuardada = await Postura.insert(datoPendiente);
                console.log('Postura guardada en BD (intervalo):', posturaGuardada.id);
                ultimaInsercion = tiempoActual;
                datoPendiente = null; // Limpiar el dato pendiente
            } catch (error) {
                console.error('Error guardando en BD (intervalo):', error);
            }
        }
    }
}, INTERVALO_INSERCION);

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
            // console.log(`Estado recibido: ${estado}`);

            const data = JSON.parse(message.toString());

            if (data.id_sesion && data.angulo_toracico !== undefined) {
                // Acumular el último dato recibido (se insertará máximo cada 5 segundos)
                datoPendiente = data;
                // El intervalo se encargará de insertar este dato cuando corresponda
            } else {
                console.warn('Datos incompletos recibidos:', data);
            }

        } else if (topic === MQTT_TOPIC_DATOS) {
            console.log("Datos recibidios de topic de datod")
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