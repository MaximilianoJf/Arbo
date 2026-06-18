import { Sequelize } from "sequelize-typescript";
import path from 'path';

const connectionString = process.env.DATABASE_URL;

const db = connectionString
    ? new Sequelize(connectionString, {
        dialect: "postgres",
        logging: false,
        models: [path.join(__dirname, '/../models/**/*.model.{js,ts}')],
        dialectOptions: {
            ssl: { require: true, rejectUnauthorized: false }
        }
    })
    : new Sequelize({
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: "postgres",
        logging: false,
        models: [path.join(__dirname, '/../models/**/*.model.{js,ts}')],
    });

export default db;