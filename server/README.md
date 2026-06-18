## 🛠️ Comandos de Base de Datos

Este proyecto utiliza **Sequelize CLI** para gestionar la estructura de la base de datos mediante migraciones y datos iniciales (seeds).

### Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Ejecuta las migraciones pendientes y arranca el servidor en modo desarrollo. |
| `npm run db:migrate` | Aplica todas las migraciones pendientes a la base de datos. |
| `npm run db:seed` | Llena la base de datos con los datos iniciales definidos en los seeders. |
| `npm run db:reset` | **CUIDADO**: Borra todas las tablas, las recrea desde cero y ejecuta los seeders. |

---

### Flujo de Trabajo Sugerido

1. **Crear una nueva tabla/cambio**:
   ```bash
   npx sequelize-cli migration:generate --name nombre-de-la-migracion
