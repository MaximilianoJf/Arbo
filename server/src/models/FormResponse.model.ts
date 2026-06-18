import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import UserForm from "./UserForm.model";
import User from "./User.model";

@Table({
    tableName: "FormResponses",
    timestamps: true,
})
class FormResponse extends Model {
    @Column({
        type: DataType.JSON,
        allowNull: false,
    })
    declare answers: Record<string, any>;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare respondentName: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare respondentEmail: string;

    @Column({
        type: DataType.JSON,
        allowNull: true,
    })
    declare respondentData: Record<string, any>;

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
    declare respondentId: number;

    @BelongsTo(() => UserForm)
    declare form: UserForm;

    @BelongsTo(() => User)
    declare respondent: User;
}

export default FormResponse;
