import { Table, Column, Model, DataType, HasMany } from "sequelize-typescript";
import Owner from "./Owner.model";

@Table({ tableName: "roles" })
export class Role extends Model {
    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false
    })
    declare name: string;

    @HasMany(() => Owner)
    declare owners: Owner[];
}

export default Role