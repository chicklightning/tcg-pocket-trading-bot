/** @type {import('sequelize-cli').Migration} */

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Trades', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    ownerOfferedCard: {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'Cards',
        key: 'id',
      },
    },
    targetOfferedCard: {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'Cards',
        key: 'id',
      },
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
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    }
  });
};

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('Trades');
};