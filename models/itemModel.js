const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('mp2', 'root', '', {
  host: 'localhost',
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
  }
}, {
  tableName: 'item_page',
  timestamps: false
});

module.exports = Item;

