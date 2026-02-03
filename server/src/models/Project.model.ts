import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import Owner from "./Owner.model";
import { ProjectType } from "./ProyectType.model";
import { DocumentReference } from "./DocumentReference.model";

@Table({
    tableName: "projects",
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['owner_id', 'slug'],
            name: 'unique_project_slug_per_owner'
        }
    ]
})
export class Project extends Model {
    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare slug: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare description: string;

    @ForeignKey(() => Owner)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare owner_id: number;

    @ForeignKey(() => ProjectType)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare project_type_id: number;

    @BelongsTo(() => Owner)
    declare owner: Owner;

    @BelongsTo(() => ProjectType)
    declare type: ProjectType;

    @HasMany(() => DocumentReference)
    declare documents: DocumentReference[];
}

export default Project