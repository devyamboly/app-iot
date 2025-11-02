const pool = require('../config/database');

class Postura {
    // Crear tabla si no existe
    static async createTable() {
        try {
            await pool.connect()
            console.log('Tabla posturas verificada/creada correctamente');
        } catch (error) {
            console.error('Error creando tabla:', error);
        }
    }

    static async insert(data) {

        console.log("Insertando datos")

        const query = `
            INSERT INTO lecturas (
                id_sesion, angulo_toracico, 
                acelerometro_x, acelerometro_y, acelerometro_z,
                giroscopio_x, giroscopio_y, giroscopio_z,
                postura, postura_correcta
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        
        if (data.angulo_toracico < 0){
            data.angulo_toracico = 0;
        } else if (data.angulo_toracico > 180){
            data.angulo_toracico = 180;
        }

        const values = [
            data.id_sesion,
            data.angulo_toracico,
            data.acelerometro_x,
            data.acelerometro_y,
            data.acelerometro_z,
            data.giroscopio_x,
            data.giroscopio_y,
            data.giroscopio_z,
            data.postura,
            data.postura_correcta
        ];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error insertando postura:', error);
            throw error;
        }
    }

    // Obtener posturas por sesión
    static async getBySesion(id_sesion) {
        const query = 'SELECT * FROM lecturas WHERE id_sesion = $1 ORDER BY fecha_creacion DESC';

        try {
            const result = await pool.query(query, [id_sesion]);
            return result.rows;
        } catch (error) {
            console.error('Error obteniendo posturas:', error);
            throw error;
        }
    }

    // Obtener estadísticas de sesión
    static async getStatsBySesion(id_sesion) {
        const query = `
            SELECT 
                COUNT(*) as total_registros,
                AVG(angulo_toracico) as angulo_promedio,
                COUNT(CASE WHEN postura_correcta = true THEN 1 END) as posturas_correctas,
                COUNT(CASE WHEN postura_correcta = false THEN 1 END) as posturas_incorrectas,
                MIN(fecha_creacion) as inicio_sesion,
                MAX(fecha_creacion) as fin_sesion
            FROM lecturas 
            WHERE id_sesion = $1
        `;

        try {
            const result = await pool.query(query, [id_sesion]);
            return result.rows[0];
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error;
        }
    }
}

module.exports = Postura;