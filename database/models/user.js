import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Trade, {
        foreignKey: 'owner',
        onDelete: 'CASCADE',
      });

      User.belongsToMany(models.Card, {
        through: 'UserCard',
        as: 'desiredCards',
        foreignKey: 'user_id',
        otherKey: 'card_id',
      });
    }
  }
  User.init({
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    nickname: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};