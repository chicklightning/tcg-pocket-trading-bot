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
      Card.belongsToMany(models.User, {
        through: 'UserCard',
        foreignKey: 'card_id',
        otherKey: 'user_id',
      });
    }
  }
  Card.init({
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
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
    packSet: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['Genetic Apex',
                'Mythical Island',
                'Space-Time Smackdown',
                'Triumphant Light', 
                'Shining Revelry',
                'Celestial Guardians',
              ]],
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