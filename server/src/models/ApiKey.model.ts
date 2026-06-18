import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import User from "./User.model";

@Table({
    tableName: "ApiKeys",
    timestamps: true,
})
class ApiKey extends Model {
    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
    declare key: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare name: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    })
    declare isActive: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    declare lastUsedAt: Date | null;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare userId: number;

    @BelongsTo(() => User)
    declare user: User;
}

export default ApiKey;
