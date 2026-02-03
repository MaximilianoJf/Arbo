'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('projects', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      owner_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'owners', key: 'id' }
      },
      project_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'project_types', key: 'id' }
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    
    await queryInterface.addIndex('projects', ['owner_id', 'slug'], {
      unique: true,
      name: 'unique_project_slug_per_owner'
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('projects'); }
};