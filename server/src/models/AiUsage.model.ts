import { Table, Column, Model, DataType, Index } from "sequelize-typescript";

/**
 * Persistent per-scope AI usage tracking.
 *
 * One row per (scope, provider, UTC day):
 *   - scope    "system" when the call used the platform env key,
 *              "user:<id>" when it used that user's own DB key.
 *   - date     "YYYY-MM-DD" UTC — a new day = a new row that starts at 0,
 *              so the count resets exactly when the real provider quota renews.
 *
 * Lives in Postgres (not a JSON file) so the count survives deploys/restarts
 * and the failover "exhausted until" state is remembered per scope.
 */
@Table({
    tableName: "AiUsages",
    timestamps: true,
    indexes: [{ unique: true, fields: ["scope", "provider", "date"] }],
})
class AiUsage extends Model {
    @Index
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare scope: string; // "system" | "user:<id>"

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare provider: string; // "openrouter" | "groq" | "gemini" | ...

    @Column({
        type: DataType.STRING, // "YYYY-MM-DD" UTC
        allowNull: false,
    })
    declare date: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    declare used: number;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    declare lastUsedAt: Date | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare lastModel: string | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare lastError: string | null;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    declare exhaustedUntil: Date | null;
}

export default AiUsage;
