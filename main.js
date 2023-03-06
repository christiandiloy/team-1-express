const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const request = require('request');
const requestAPI = request;
const { Sequelize, DataTypes } = require('sequelize');
const itemModel = require('./models/itemModel');
const path = require('path');



const sequelize = new Sequelize('mp2', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
});

const User = sequelize.define('user', {
  username: {
    type: Sequelize.STRING
  },
  full_name: {
    type: Sequelize.STRING
  },
  password: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING
  }
},{
  tableName: 'user',
  timestamps: false,
});

let rawData = fs.readFileSync('data.json');
let parsedData = JSON.parse(rawData);

app.use(cors());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let defaultData = [];

app.post('/api/v2/login', function (request, response) {
  let retVal = {success: false};

  User.findOne({
    where: {
      username: request.body.username
    }
  })
  .then((result)=>{
    if(result){
      return result.dataValues;
    }else{
      retVal.success = false;
      retVal.message = 'User Does not Exist!'
    }
  })
  .then((result)=>{
    if(result.password === request.body.password){
      retVal.success = true;
      delete result.password;
      retVal.userData = result;
      return true;
    }else{
      retVal.success = false;
      retVal.message = 'Invalid Password!'
      throw new Error('invalid password')
    }
  })
  .finally(()=>{
    response.send(retVal)
  })
  .catch((error)=>{
    console.log('error: ', error)
  })
});

app.post('/api/v2/register', function (request, response) {
  let retVal = {success: false};

  User.findOne({
    where: {
      username: request.body.username
    }
  })
  .then((result)=>{
    if(result){
      retVal.success = false;
      retVal.message = 'username is already taken';
      response.send(retVal);
    }else{
      User.create({
        username: request.body.username,
        password: request.body.password,
        full_name: request.body.fullName,
        email: request.body.email
      })
      .then((result)=>{
        return result.dataValues;
      })
      .then((result)=>{
        retVal.success = true;
        delete result.password;
        retVal.userData = null;
      })
      .finally(()=>{
        response.send(retVal)
      })
      .catch((error)=>{
        console.log('error: ', error)
      })
    }
  })
});

app.get('/getProduct', function(req, res){
    fs.readFile(__dirname + "/" + "all-products.json", 'utf8', function(err, data){
        res.send(data);
    });
});

app.get('/keyword', function(req, res){
    fs.readFile(__dirname + "/" + "all-products.json", 'utf8', function(err, data){
        data = JSON.parse(data);
        const result = data.tour.filter(function(obj) {
        return obj['category'].toLowerCase().includes(req.query.i.toLowerCase());
        });
        res.send(result);
    });
});

app.get('/store/item-page/:itemId', async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const item = await itemModel.findByPk(itemId);
        if (item) {
            const itemData = {
            item_id: item.item_id,
            item_name: item.item_name,
            item_price: item.item_price,
            item_desc: item.item_desc,
            item_category: item.item_category,
            item_series: item.item_series
            };
            res.json(itemData);
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
        } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
});



    app.listen(3005, function(){
    console.log('listening on 3005');
    });

    module.exports = app;