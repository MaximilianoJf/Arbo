import { Table, Column, Model, ForeignKey, DataType } from "sequelize-typescript";
import { ProjectType } from "./ProyectType.model";
import { Module } from "./Module.model";

@Table({ tableName: "project_type_modules" })
export class ProjectTypeModules extends Model {
    @ForeignKey(() => ProjectType)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare project_type_id: number;

    @ForeignKey(() => Module)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare module_id: number;
}
export default ProjectTypeModules