import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Trade extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Trade.belongsTo(models.User, {
        foreignKey: 'owner',
        as: 'initiator',
      });
    }
  }
  Trade.init({
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    desiredCardA: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    desiredCardB: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    isValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    }
  }, {
    sequelize,
    modelName: 'Trade',
  });
  return Trade;
};