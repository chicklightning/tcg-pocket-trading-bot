/** @type {import('sequelize-cli').Migration} */

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Trades', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.STRING,
    },
    desiredCardA: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    desiredCardB: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isValid: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isComplete: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    owner: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    target: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
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