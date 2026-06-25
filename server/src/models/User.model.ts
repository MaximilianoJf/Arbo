import { Table, Column, Model, DataType, HasMany } from "sequelize-typescript";
import UserForm from "./UserForm.model";
import FormResponse from "./FormResponse.model";

@Table({
    tableName: "Users",
    timestamps: true,
})
class User extends Model {
    // NOT unique: two different people can legitimately share a name (esp. once
    // form respondents become User rows). Identity is the email / googleId.
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare name: string;

    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false,
    })
    declare email: string;

    @Column({
        type: DataType.STRING,
        allowNull: true, // nullable for Google OAuth users
    })
    declare password: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
        unique: true,
    })
    declare googleId: string | null;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: "local",
    })
    declare provider: string; // "local" | "google"

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare avatar: string | null;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: null,
    })
    declare aiProviders: any;

    // RAG de grupo: cubre todos los formularios sueltos del usuario (sin proyecto BD)
    @Column({
        type: DataType.ENUM("none", "ready", "stale"),
        allowNull: false,
        defaultValue: "none",
    })
    declare standaloneRagStatus: "none" | "ready" | "stale";

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null,
    })
    declare standaloneRagCollectionId: string | null;

    @HasMany(() => UserForm)
    declare forms: UserForm[];

    @HasMany(() => FormResponse)
    declare responses: FormResponse[];
}

export default User;
