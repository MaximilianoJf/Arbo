import { Table, Column, Model, DataType, BelongsToMany } from "sequelize-typescript";
import { ProjectType } from "./ProyectType.model";
import { ProjectTypeModules } from "./ProjectTypeModules.model";

@Table({ tableName: "modules" })
export class Module extends Model {
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    declare name: string;

    @Column({ type: DataType.STRING })
    declare description: string;

    @BelongsToMany(() => ProjectType, () => ProjectTypeModules)
    declare projectTypes: ProjectType[];
}

export default Module