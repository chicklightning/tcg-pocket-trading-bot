/** @type {import('sequelize-cli').Migration} */

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Trades', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    id: {
      type: Sequelize.STRING
    },
    desiredCardA: {
      type: Sequelize.INTEGER
    },
    desiredCardB: {
      type: Sequelize.INTEGER
    },
    isValid: {
      type: Sequelize.BOOLEAN
    },
    isComplete: {
      type: Sequelize.BOOLEAN
    },
    owner: {
      type: Sequelize.STRING
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    }
  });
};

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('Trades');
};