import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import envConfigs from '../config/config.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'dev';
const config = envConfigs[env];
const db = {};

let sequelize;
if (config.url) {
  sequelize = new Sequelize(config.url, config);
}
else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const __dirname = path.dirname(__filename);
const initializeModels = async () => {
  const modelFiles = fs
    .readdirSync(__dirname)
    .filter(file => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js');

  const modelPromises = modelFiles.map(async file => {
    const model = (await import('file:///' + path.join(__dirname, file))).default(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

  await Promise.all(modelPromises);

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  console.log(`[LOG] Successfully initialized models for environment: ${env}`);
  return db;
};

export default await initializeModels();