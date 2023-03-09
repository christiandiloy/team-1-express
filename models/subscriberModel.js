const { Sequelize } = require("sequelize");
const sequelize = new Sequelize("paredes", "wd32p", "7YWFvP8kFyHhG3eF", {
    host: "20.211.37.87",
    dialect: "mysql",
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