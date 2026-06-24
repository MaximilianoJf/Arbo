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

    /** true = relational database (nested/related forms); false = plain project (just groups forms). */
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    declare isDatabase: boolean;

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

export default Project;
