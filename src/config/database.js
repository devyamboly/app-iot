const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'vps.yamboly.lat',
    database: 'db-iot',
    password: '1234',
    port: 2005,
});

// Verificar conexión a la base de datos
pool.on('connect', () => {
    console.log('Conectado a PostgreSQL');
});

pool.on('error', (err) => {
    console.error('Error en la conexión a PostgreSQL:', err);
});

module.exports = pool;