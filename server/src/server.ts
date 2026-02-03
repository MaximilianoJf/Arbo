import express from "express";
import db from "./config/db";
import router from "./routes";
import dotenv from 'dotenv';
import colors from 'colors';

dotenv.config();

//Instancia de Express
const app = express();
app.use(express.json()); // lectura de datos
app.use('/api', router) // rutas


const connectDB = async () => {
    try {

        await db.authenticate();
        console.log(colors.cyan.bold('Conexión a la base de datos exitosa'));

        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => {
            console.log(colors.magenta.bold(`Servidor funcionando en el puerto: ${PORT}`));
        });

    } catch (error) {
        console.log(colors.red.bold('Error al conectar a la base de datos:'));
        console.log(error);
        process.exit(1);
    }
};

connectDB();

export default app