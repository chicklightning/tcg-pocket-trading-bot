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
        as: 'trades',
        onDelete: 'CASCADE',
      });
    }
  }
  User.init({
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    nickname: DataTypes.STRING,
    desiredCards: DataTypes.ARRAY(DataTypes.UUID),
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};