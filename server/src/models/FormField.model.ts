import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import UserForm from "./UserForm.model";

@Table({
    tableName: "FormFields",
    timestamps: true,
})
class FormField extends Model {
    @ForeignKey(() => UserForm)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare formId: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare name: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare label: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare placeholder: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: "text",
    })
    declare type: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare componentType: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: "",
    })
    declare defaultValue: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    declare required: boolean;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare minLength: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare maxLength: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    declare sortOrder: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    declare page: number;

    @Column({
        type: DataType.ARRAY(DataType.STRING),
        allowNull: false,
        defaultValue: [],
    })
    declare validations: string[];

    @Column({
        type: DataType.ARRAY(DataType.STRING),
        allowNull: false,
        defaultValue: [],
    })
    declare dependencies: string[];

    @Column({
        type: DataType.ARRAY(DataType.STRING),
        allowNull: false,
        defaultValue: [],
    })
    declare options: string[];

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: null,
    })
    declare fieldStyles: Record<string, any> | null;

    // Extended field properties not worth a dedicated column each:
    // optionsSource (FK / remote options), visibleWhen, hiddenWhen, logicMode,
    // pattern, patternMessage, rows, accept, span*, groupId, groupLabel.
    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: null,
    })
    declare meta: Record<string, any> | null;

    @BelongsTo(() => UserForm)
    declare form: UserForm;
}

export default FormField;
