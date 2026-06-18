"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("FormResponses", "respondentName", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("FormResponses", "respondentEmail", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("FormResponses", "respondentName");
    await queryInterface.removeColumn("FormResponses", "respondentEmail");
  },
};
