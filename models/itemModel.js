const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize("paredes", "wd32p", "7YWFvP8kFyHhG3eF", {
  host: "20.211.37.87",
  dialect: 'mysql'
});

const Item = sequelize.define('Item', {
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  item_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  item_price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  item_desc: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  item_category: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  item_series: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  item_main_image: {
    type: DataTypes.STRING,
    allowNull: false
  },
  page_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'item_page',
  timestamps: false
});

module.exports = Item;

