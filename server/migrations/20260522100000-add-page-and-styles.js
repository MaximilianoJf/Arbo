"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add page column to FormFields
        await queryInterface.addColumn("FormFields", "page", {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });

        // Add styles JSON column to UserForms
        await queryInterface.addColumn("UserForms", "styles", {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: null,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("FormFields", "page");
        await queryInterface.removeColumn("UserForms", "styles");
    },
};
