import 'dotenv/config';

export default {
  "dev": {
    "url": process.env.DEV_DATABASE_URL,
    "dialect": "postgres"
  },
  "prod": {
    "url": process.env.PROD_DATABASE_URL,
    "dialect": "postgres"
  }
};