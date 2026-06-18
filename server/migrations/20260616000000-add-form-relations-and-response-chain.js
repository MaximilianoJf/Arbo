"use strict";

// Idempotent: the app also runs `db.sync({ alter: true })` on boot, so these
// columns/table may already exist. Each step is guarded so `npm run dev`
// (which runs migrations before starting) never breaks on an already-synced DB.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const addColumnIfMissing = async (table, column, spec) => {
      const desc = await queryInterface.describeTable(table);
      if (!desc[column]) await queryInterface.addColumn(table, column, spec);
    };

    await addColumnIfMissing("FormResponses", "parentResponseId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "FormResponses", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
    await addColumnIfMissing("FormResponses", "parentFormId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await addColumnIfMissing("FormResponses", "rootResponseId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((t) => (typeof t === "string" ? t : t.tableName));
    if (!tableNames.includes("FormRelations")) {
      await queryInterface.createTable("FormRelations", {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        projectId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "Projects", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        parentFormId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "UserForms", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        childFormId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "UserForms", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        keyField: { type: Sequelize.STRING, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      });
    }

    const indexes = await queryInterface.showIndex("FormRelations").catch(() => []);
    const hasUnique = indexes.some((i) => i.name === "form_relations_parent_child_unique");
    if (!hasUnique) {
      await queryInterface.addIndex("FormRelations", ["parentFormId", "childFormId"], {
        unique: true,
        name: "form_relations_parent_child_unique",
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("FormRelations").catch(() => {});
    await queryInterface.removeColumn("FormResponses", "rootResponseId").catch(() => {});
    await queryInterface.removeColumn("FormResponses", "parentFormId").catch(() => {});
    await queryInterface.removeColumn("FormResponses", "parentResponseId").catch(() => {});
  },
};
