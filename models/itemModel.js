const { Sequelize, DataTypes } = require('sequelize');
const { DATABASE_SCHEMA, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_DIALECT } = require('../env.js');

const sequelize = new Sequelize(DATABASE_SCHEMA, DATABASE_USERNAME, DATABASE_PASSWORD, {
    host: DATABASE_HOST,
    dialect: DATABASE_DIALECT,
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

