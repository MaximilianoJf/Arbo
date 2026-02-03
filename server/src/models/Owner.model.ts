import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import Project from "./Project.model";
import Role from "./Role.model";

@Table({
    tableName: "owners",
    timestamps: true,
})

class Owner extends Model {
    @Column({
        type: DataType.STRING,
    })
    declare name: string;

    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false
    })
    declare email: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare password: string;

    @ForeignKey(() => Role)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare role_id: number;

    @ForeignKey(() => Owner)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare parent_id: number;

    @BelongsTo(() => Owner)
    declare parent: Owner;

    @HasMany(() => Owner)
    declare members: Owner[];

    @HasMany(() => Project)
    declare projects: Project[];
}

export default Owner;