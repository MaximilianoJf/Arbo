import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import Project from "./Project.model";
import User from "./User.model";

@Table({
    tableName: "ProjectCollaborators",
    timestamps: true,
})
class ProjectCollaborator extends Model {
    @ForeignKey(() => Project)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare projectId: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare userId: number | null;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare email: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: "viewer",
    })
    declare role: string; // "viewer" | "editor"

    @BelongsTo(() => Project)
    declare project: Project;

    @BelongsTo(() => User)
    declare user: User;
}

export default ProjectCollaborator;
