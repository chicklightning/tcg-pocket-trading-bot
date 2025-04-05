import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Card extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Card.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      }
    },
    set: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['Genetic Apex', 'Mythical Island', 'Space-Time Smackdown', 'Triumphant Light',]],
      },
    },
    rarity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
  }, {
    sequelize,
    modelName: 'Card',
  });
  return Card;
};