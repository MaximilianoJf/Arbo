import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import User from "./User.model";
import UserForm from "./UserForm.model";

@Table({
    tableName: "Projects",
    timestamps: true,
})
class Project extends Model {
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

    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: "#4ADE80",
    })
    declare color: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare userId: number;

    @BelongsTo(() => User)
    declare user: User;

    @HasMany(() => UserForm)
    declare forms: UserForm[];
}

export default Project;
