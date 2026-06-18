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

    // ─── Response chain (relational forms) ───
    /** The parent form's response this submission descends from (null = chain root). */
    @ForeignKey(() => FormResponse)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare parentResponseId: number | null;

    /** Which form the parent response belongs to. */
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare parentFormId: number | null;

    /** Second link, for many-to-many bridge responses (the "other side" they connect). */
    @ForeignKey(() => FormResponse)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare secondaryResponseId: number | null;

    /** Root response of the whole chain (A in A→B→C). Lets a full chain be fetched at once. */
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare rootResponseId: number | null;

    @BelongsTo(() => UserForm)
    declare form: UserForm;

    @BelongsTo(() => User)
    declare respondent: User;

    @BelongsTo(() => FormResponse, "parentResponseId")
    declare parent: FormResponse;
}

export default FormResponse;
