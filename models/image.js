const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize("paredes", "wd32p", "7YWFvP8kFyHhG3eF", {
  host: "20.211.37.87",
  dialect: 'mysql'
});
const Item = require('./itemModel');

const Image = sequelize.define('Image', {
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  item_main_image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
},{
  tableName: 'item_page',
  timestamps: false
});

// add a foreign key relationship with the Item model
Image.belongsTo(Item, { foreignKey: 'item_id' });

module.exports = Image;
