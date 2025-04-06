/** @type {import('sequelize-cli').Migration} */

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('UserCards', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.STRING,
      references: {
        model: 'Users',
        key: 'id',
      },
      allowNull: false,
    },
    card_id: {
      type: Sequelize.STRING,
      references: {
        model: 'Cards',
        key: 'id',
      },
      allowNull: false,
    },
    card_count: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  });
};

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('UserCards')
};