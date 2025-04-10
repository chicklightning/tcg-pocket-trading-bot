/** @type {import('sequelize-cli').Migration} */

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Cards', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.STRING,
      unique: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    image: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    packSet: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    rarity: {
      type: Sequelize.INTEGER,
      allowNull: false,
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
  await queryInterface.dropTable('Cards');
};