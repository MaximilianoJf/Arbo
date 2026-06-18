import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import UserForm from "./UserForm.model";
import User from "./User.model";

@Table({
    tableName: "FormCollaborators",
    timestamps: true,
})
class FormCollaborator extends Model {
    @ForeignKey(() => UserForm)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare formId: number;

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

    @BelongsTo(() => UserForm)
    declare form: UserForm;

    @BelongsTo(() => User)
    declare user: User;
}

export default FormCollaborator;
