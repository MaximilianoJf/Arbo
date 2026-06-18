"use strict";

/** Helper: add column only if it doesn't already exist */
async function addColumnIfNotExists(qi, table, column, definition) {
    const desc = await qi.describeTable(table);
    if (!desc[column]) {
        await qi.addColumn(table, column, definition);
    }
}

/** Helper: check if table exists */
async function tableExists(qi, table) {
    const desc = await qi.sequelize.query(
        `SELECT to_regclass('public."${table}"') AS t`,
        { type: qi.sequelize.constructor.QueryTypes.SELECT }
    );
    return !!desc[0]?.t;
}

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Add Google OAuth fields to Users (idempotent)
        await addColumnIfNotExists(queryInterface, "Users", "googleId", {
            type: Sequelize.STRING,
            allowNull: true,
            unique: true,
        });
        await addColumnIfNotExists(queryInterface, "Users", "provider", {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: "local",
        });
        await addColumnIfNotExists(queryInterface, "Users", "avatar", {
            type: Sequelize.STRING,
            allowNull: true,
        });
        // Make password nullable (Google users won't have one)
        await queryInterface.changeColumn("Users", "password", {
            type: Sequelize.STRING,
            allowNull: true,
        });

        // 2. Create Projects table
        if (!(await tableExists(queryInterface, "Projects"))) {
            await queryInterface.createTable("Projects", {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                name: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                color: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    defaultValue: "#4ADE80",
                },
                userId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: "Users", key: "id" },
                    onDelete: "CASCADE",
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal("NOW()"),
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal("NOW()"),
                },
            });
        }

        // 3. Create ProjectCollaborators table
        if (!(await tableExists(queryInterface, "ProjectCollaborators"))) {
            await queryInterface.createTable("ProjectCollaborators", {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                projectId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: "Projects", key: "id" },
                    onDelete: "CASCADE",
                },
                userId: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: "Users", key: "id" },
                    onDelete: "SET NULL",
                },
                email: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                role: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    defaultValue: "viewer",
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal("NOW()"),
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal("NOW()"),
                },
            });

            await queryInterface.addConstraint("ProjectCollaborators", {
                fields: ["projectId", "email"],
                type: "unique",
                name: "unique_project_collaborator",
            });
        }

        // 4. Add projectId to UserForms
        await addColumnIfNotExists(queryInterface, "UserForms", "projectId", {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "Projects", key: "id" },
            onDelete: "SET NULL",
        });
    },

    async down(queryInterface, Sequelize) {
        const desc = await queryInterface.describeTable("UserForms");
        if (desc.projectId) {
            await queryInterface.removeColumn("UserForms", "projectId");
        }
        if (await tableExists(queryInterface, "ProjectCollaborators")) {
            await queryInterface.dropTable("ProjectCollaborators");
        }
        if (await tableExists(queryInterface, "Projects")) {
            await queryInterface.dropTable("Projects");
        }
        const usersDesc = await queryInterface.describeTable("Users");
        if (usersDesc.avatar) await queryInterface.removeColumn("Users", "avatar");
        if (usersDesc.provider) await queryInterface.removeColumn("Users", "provider");
        if (usersDesc.googleId) await queryInterface.removeColumn("Users", "googleId");
        await queryInterface.changeColumn("Users", "password", {
            type: Sequelize.STRING,
            allowNull: false,
        });
    },
};
