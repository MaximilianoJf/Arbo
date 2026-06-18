"use strict";

// Idempotent (coexists with db.sync({ alter: true })). Adds cardinality type
// and the optional bridge form for many-to-many relations.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const addColumnIfMissing = async (table, column, spec) => {
      const desc = await queryInterface.describeTable(table);
      if (!desc[column]) await queryInterface.addColumn(table, column, spec);
    };

    await addColumnIfMissing("FormRelations", "type", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "one_to_many",
    });
    await addColumnIfMissing("FormRelations", "joinFormId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "UserForms", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("FormRelations", "joinFormId").catch(() => {});
    await queryInterface.removeColumn("FormRelations", "type").catch(() => {});
  },
};
