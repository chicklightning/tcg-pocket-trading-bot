import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class UserCard extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UserCard.init({
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    card_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    card_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'UserCard',
  });
  return UserCard;
};