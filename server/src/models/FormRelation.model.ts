import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import Project from "./Project.model";
import UserForm from "./UserForm.model";

/**
 * A directed one-to-many link between two forms of the same project.
 * parentForm → childForm means: each response of the parent can spawn many
 * child responses, and every child response references the parent response.
 */
@Table({
    tableName: "FormRelations",
    timestamps: true,
    indexes: [{ unique: true, fields: ["parentFormId", "childFormId"] }],
})
class FormRelation extends Model {
    @ForeignKey(() => Project)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare projectId: number;

    @ForeignKey(() => UserForm)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare parentFormId: number;

    @ForeignKey(() => UserForm)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare childFormId: number;

    /** Optional answer field (e.g. "email", "dni") used to match the same respondent without a link. */
    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare keyField: string | null;

    /** Cardinality: "one_to_one" | "one_to_many" | "many_to_many". */
    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: "one_to_many",
    })
    declare type: string;

    /** For many-to-many: the bridge form whose responses link the two sides. */
    @ForeignKey(() => UserForm)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare joinFormId: number | null;

    @BelongsTo(() => Project)
    declare project: Project;

    @BelongsTo(() => UserForm, "parentFormId")
    declare parentForm: UserForm;

    @BelongsTo(() => UserForm, "childFormId")
    declare childForm: UserForm;
}

export default FormRelation;
