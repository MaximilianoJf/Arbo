"use strict";

// Idempotent (coexists with db.sync({ alter: true })). Adds the second link for
// many-to-many bridge responses.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const desc = await queryInterface.describeTable("FormResponses");
    if (!desc.secondaryResponseId) {
      await queryInterface.addColumn("FormResponses", "secondaryResponseId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "FormResponses", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("FormResponses", "secondaryResponseId").catch(() => {});
  },
};
