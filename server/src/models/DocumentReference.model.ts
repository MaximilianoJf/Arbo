import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Project } from "./Project.model";

@Table({
    tableName: "document_references",
    indexes: [
        {
            unique: true,
            fields: ['project_id', 'slug']
        }
    ]
})
export class DocumentReference extends Model {

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare content_id: string; //No_Sql Id

    @Column({ type: DataType.STRING, allowNull: false })
    declare title: string;

    @Column({ type: DataType.STRING, allowNull: false })
    declare slug: string;

    @ForeignKey(() => Project)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare project_id: number;

    @BelongsTo(() => Project)
    declare project: Project;
}

export default DocumentReference