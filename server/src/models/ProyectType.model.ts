import { Table, Column, Model, DataType, BelongsToMany, HasMany } from "sequelize-typescript";
import { Module } from "./Module.model";
import { ProjectTypeModules } from "./ProjectTypeModules.model";
import { Project } from "./Project.model";

@Table({ tableName: "project_types" })
export class ProjectType extends Model {

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true
    })
    declare name: string;

    @Column({ type: DataType.STRING, unique: true })
    declare slug: string;

    @BelongsToMany(() => Module, () => ProjectTypeModules)
    declare modules: Module[];

    @HasMany(() => Project)
    declare projects: Project[];
}

export default ProjectType