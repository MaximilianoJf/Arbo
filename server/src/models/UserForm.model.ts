import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import User from "./User.model";
import Project from "./Project.model";
import FormField from "./FormField.model";
import FormResponse from "./FormResponse.model";
import FormCollaborator from "./FormCollaborator.model";

@Table({
    tableName: "UserForms",
    timestamps: true,
})
class UserForm extends Model {
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare title: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare description: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
    declare slug: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare onSubmit: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    declare isPublished: boolean;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: null,
    })
    declare styles: Record<string, any> | null;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    declare isArchived: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        defaultValue: null,
    })
    declare deletedAt: Date | null;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare userId: number;

    @BelongsTo(() => User)
    declare user: User;

    @ForeignKey(() => Project)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare projectId: number | null;

    @BelongsTo(() => Project)
    declare project: Project;

    @HasMany(() => FormField)
    declare fields: FormField[];

    @HasMany(() => FormResponse)
    declare responses: FormResponse[];

    @HasMany(() => FormCollaborator)
    declare collaborators: FormCollaborator[];

    @Column({
        type: DataType.ENUM("none", "ready", "stale"),
        allowNull: false,
        defaultValue: "none",
    })
    declare ragStatus: "none" | "ready" | "stale";

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null,
    })
    declare ragCollectionId: string | null;
}

export default UserForm;
