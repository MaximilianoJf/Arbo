"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add isArchived and deletedAt to UserForms
        await queryInterface.addColumn("UserForms", "isArchived", {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
        await queryInterface.addColumn("UserForms", "deletedAt", {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
        });

        // Create FormCollaborators table
        await queryInterface.createTable("FormCollaborators", {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            formId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "UserForms", key: "id" },
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

        // Unique constraint: one collaborator per form per email
        await queryInterface.addIndex("FormCollaborators", ["formId", "email"], {
            unique: true,
            name: "form_collaborators_form_email_unique",
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("UserForms", "isArchived");
        await queryInterface.removeColumn("UserForms", "deletedAt");
        await queryInterface.dropTable("FormCollaborators");
    },
};
