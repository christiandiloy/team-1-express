const { Sequelize } = require("sequelize");
const { DATABASE_SCHEMA, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_DIALECT } = require('../env.js');

const sequelize = new Sequelize(DATABASE_SCHEMA, DATABASE_USERNAME, DATABASE_PASSWORD, {
    host: DATABASE_HOST,
    dialect: DATABASE_DIALECT,
  });

  const Subscriber = sequelize.define(
    "subscriber",
    {
        email: {
            type: Sequelize.STRING,
        }
    },
    {
        tableName: "subscriber",
        timestamps: false
    }
  );

  module.exports = Subscriber;