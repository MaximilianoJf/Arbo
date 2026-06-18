import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import User from "./User.model";

/**
 * Composite form component ("bloque"): a reusable group of fields
 * with their conditional logic, saved per user and optionally shared.
 */
@Table({
    tableName: "FieldBlocks",
    timestamps: true,
})
class FieldBlock extends Model {
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare name: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare description: string | null;

    // FormField[] (includes visibleWhen logic, fieldStyles, options, etc.)
    @Column({
        type: DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    })
    declare fields: object[];

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    declare isPublic: boolean;

    // Provenance when copied from another user's public block
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare sourceId: number | null;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare userId: number;

    @BelongsTo(() => User)
    declare user: User;
}

export default FieldBlock;
