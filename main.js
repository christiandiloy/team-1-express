const express = require("express"); // server code or to run our own server on localhost specified by port
const cors = require("cors"); // this allows us to access our server on a different domain
const bodyParser = require("body-parser"); // this allows us to ready request data JSON object
const app = express(); // initialize express server into a variable
const fs = require("fs"); // use file system of windows or other OS to access local files
const nodemailer = require("nodemailer"); //send email to users
const hbs = require('nodemailer-express-handlebars');
const request = require("request");
const requestAPI = request;
const { Sequelize } = require("sequelize");
const bcrypt = require("bcrypt");
const itemModel = require("./models/itemModel");
const subscriberModel = require("./models/subscriberModel");
const path = require("path");
const { EMAIL, PASSWORD } = require("./env.js");
const { DATABASE_SCHEMA, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_DIALECT } = require('./env.js');

const sequelize = new Sequelize(DATABASE_SCHEMA, DATABASE_USERNAME, DATABASE_PASSWORD, {
    host: DATABASE_HOST,
    dialect: DATABASE_DIALECT,
  });

const User = sequelize.define(
  "user",
  {
    username: {
      type: Sequelize.STRING,
    },
    full_name: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    contact_no: {
      type: Sequelize.STRING,
    },
    gender: {
      type: Sequelize.STRING,
    },
    date_of_birth: {
      type: Sequelize.STRING,
    },
  },
  {
    tableName: "user",
    timestamps: false,
  }
);

const Address = sequelize.define(
  "address",
  {
    userID: {
      type: Sequelize.STRING,
    },
    full_name: {
      type: Sequelize.STRING,
    },
    contact_no: {
      type: Sequelize.STRING,
    },
    place: {
      type: Sequelize.STRING,
    },
    postal_code: {
      type: Sequelize.STRING,
    },
    house_no: {
      type: Sequelize.STRING,
    },
  },
  {
    tableName: "address",
    timestamps: false,
  }
);

const ItemPage = sequelize.define("item_page", {
  item_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  item_name: Sequelize.STRING,
  item_price: Sequelize.DECIMAL,
  item_desc: Sequelize.TEXT,
  item_category: Sequelize.STRING,
  item_series: Sequelize.STRING,
  item_main_image: Sequelize.STRING,
  page_name: Sequelize.STRING,
});

const CartItems = sequelize.define(
  "cartItems",
  {
    userID: {
      type: Sequelize.STRING,
    },
    cartQuantity: {
      type: Sequelize.STRING,
    },
    itemID: {
      type: Sequelize.STRING,
    },
    price: {
      type: Sequelize.DECIMAL,
    },
    star: {
      type: Sequelize.STRING,
    },
    text: {
      type: Sequelize.STRING,
    },
    title: {
      type: Sequelize.STRING,
    },
    url: {
      type: Sequelize.STRING,
    },
  },
  {
    tableName: "cart",
    timestamps: false,
  }
);

const Order = sequelize.define(
  "orders",
  {
    userID: {
      type: Sequelize.INTEGER,
    },
    orderID: {
      type: Sequelize.INTEGER,
    },
    address: {
      type: Sequelize.STRING,
    },
    total: {
      type: Sequelize.DECIMAL,
    },
    itemId: {
      type: Sequelize.INTEGER,
    },
    quantity: {
      type: Sequelize.INTEGER,
    },
  },
  {
    tableName: "orders",
    timestamps: false,
  }
);

let rawData = fs.readFileSync("data.json"); // read file from given path
let parsedData = JSON.parse(rawData); // parse rawData (which is a string into a JSON object)
app.use(cors()); // initialize cors plugin on express
app.use(
  bodyParser.urlencoded({
    // initialize body parser plugin on express
    extended: true,
  })
);


app.use(bodyParser.json()); // initialize body parser plugin on express
app.use(express.static(path.join(__dirname, "views")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
let defaultData = [];

app.post("/api/v2/login", function (request, response) {
  let retVal = { success: false };
  console.log("req: ", request.body);
  User.findOne({
    where: {
      username: request.body.username,
    },
  })
    .then((result) => {
      if (result) {
        return result.dataValues;
      } else {
        retVal.success = false;
        retVal.message = "User Does not Exist!";
      }
    })
    .then((result) => {
      const checkedPassword = bcrypt.compareSync(
        request.body.password,
        result.password
      );

      if (checkedPassword) {
        retVal.success = true;
        delete result.password;
        retVal.userData = result;
        return true;
      } else {
        retVal.success = false;
        retVal.message = "Invalid Password!";
        throw new Error("invalid password");
      }
    })
    .finally(() => {
      response.send(retVal);
    })
    .catch((error) => {
      console.log("error: ", error);
    });
});

const userExist = (username) => {
  return User.findOne({ where: { username: username } });
};
const userExistByEmail = (email) => {
  return User.findOne({ where: { email: email } });
};
const checkDuplicate = (req, res, next) => {
  userExist(req.body.username).then((user) => {
    if (user) {
      return res.send({
        success: false,
        message: "Username already taken.",
      });
    } else {
      userExistByEmail(req.body.email).then((userByEmail) => {
        if (userByEmail) {
          return res.send({
            success: false,
            message: "Email already taken.",
          });
        } else {
          next();
        }
      });
    }
  });
};

app.post("/api/v2/register", checkDuplicate, function (request, response) {
  let retVal = { success: false };
  console.log("req: ", request.body);
  User.findOne({
    where: {
      username: request.body.username,
    },
  }).then((result) => {
    if (result) {
      retVal.success = false;
      retVal.message = "username is already taken";
      response.send(retVal);
    } else {
      const hashedPassword = bcrypt.hashSync(request.body.password, 8);
      User.create({
        username: request.body.username,
        password: hashedPassword,
        full_name: request.body.fullName,
        email: request.body.email,
      })
        .then((result) => {
          return result.dataValues;
        })
        .then((result) => {
          retVal.success = true;
          delete result.password;
          retVal.userData = null;
          // retVal.userData = result; // for auto login after registration
          retVal.userData = result; // for auto login after registration
        })
        .finally(() => {
          response.send(retVal);
        })
        .catch((error) => {
          console.log("error: ", error);
        });
    }
  });
});

app.post("/api/v2/address", function (request, response) {
  let retVal = { success: false };
  console.log("req: ", request.body);
  Address.create({
    userID: request.body.userID,
    full_name: request.body.fullName,
    contact_no: request.body.contactNo,
    place: request.body.place,
    postal_code: request.body.postalCode,
    house_no: request.body.houseNo,
  })
    .then((result) => {
      return result.dataValues;
    })
    .then((result) => {
      retVal.success = true;
      retVal.userData = result;
    })
    .finally(() => {
      response.send(retVal);
    })
    .catch((error) => {
      console.log("error: ", error);
    });
});

app.get("/api/v2/users/:userId/addresses", function (req, res) {
  const userId = req.params.userId;
  Address.findAll({
    where: {
      userId: userId,
    },
  })
    .then((addresses) => {
      res.send({
        success: true,
        data: addresses,
      });
    })
    .catch((error) => {
      console.log("Error finding addresses:", error);
      res.send({ success: false, message: "Failed to find addresses" });
    });
});

app.put("/api/v2/users/:id/updateAddress", function (req, res) {
  const id = req.params.id;
  const fullName = req.body.fullName;
  const contactNo = req.body.contactNo;
  const place = req.body.place;
  const postalCode = req.body.postalCode;
  const houseNo = req.body.houseNo;
  Address.findByPk(id)
    .then((address) => {
      if (address) {
        address
          .update({
            full_name: fullName,
            contact_no: contactNo,
            place: place,
            postal_code: postalCode,
            house_no: houseNo,
          })
          .then(() => {
            res.send({
              success: true,
              message: "Address updated successfully",
            });
          })
          .catch((error) => {
            console.log("Error updating user Address:", error);
            res.send({
              success: false,
              message: "Failed to update user Address.",
            });
          });
      } else {
        res.send({ success: false, message: "Address not found" });
      }
    })
    .catch((error) => {
      console.log("Error finding address:", error);
      res.send({ success: false, message: "Failed to find address" });
    });
});

app.delete("/api/v2/users/:id/deleteAddress/:addressId", function (req, res) {
  const id = req.params.id;
  const addressId = req.params.addressId;
  Address.destroy({ where: { id: addressId, userID: id } })
    .then((numRowsDeleted) => {
      if (numRowsDeleted === 1) {
        res.send({
          success: true,
          message: "Address deleted successfully",
        });
      } else {
        res.send({ success: false, message: "Address not found" });
      }
    })
    .catch((error) => {
      console.log("Error deleting address:", error);
      res
        .status(500)
        .send({ success: false, message: "Failed to delete address" });
    });
});

app.put("/api/v2/users/:userId/password", function (req, res) {
  const userId = req.params.userId;
  const newPassword = req.body.newPassword;
  User.findByPk(userId)
    .then((user) => {
      if (user) {
        const hashedPassword = bcrypt.hashSync(newPassword, 8);
        user
          .update({ password: hashedPassword })
          .then(() => {
            res.send({
              success: true,
              message: "Password updated successfully",
            });
          })
          .catch((error) => {
            console.log("Error updating user password:", error);
            res.send({
              success: false,
              message: "Failed to update user password",
            });
          });
      } else {
        res.send({ success: false, message: "User not found" });
      }
    })
    .catch((error) => {
      console.log("Error finding user:", error);
      res.send({ success: false, message: "Failed to find user" });
    });
});

app.get("/api/v2/users/:userId/profile", function (req, res) {
  const userId = req.params.userId;
  User.findByPk(userId)
    .then((user) => {
      if (user) {
        res.send({
          success: true,
          data: {
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            contact_no: user.contact_no,
            gender: user.gender,
            date_of_birth: user.date_of_birth,
          },
        });
      } else {
        res.send({ success: false, message: "User not found" });
      }
    })
    .catch((error) => {
      console.log("Error finding user:", error);
      res.send({ success: false, message: "Failed to find user" });
    });
});

app.put("/api/v2/users/:userId/profile", function (req, res) {
  const userId = req.params.userId;
  const full_name = req.body.fullName;
  const email = req.body.email;
  const contactNo = req.body.contactNo;
  const gender = req.body.gender;
  const dateOfBirth = req.body.dateOfBirth;
  User.findByPk(userId)
    .then((user) => {
      if (user) {
        user
          .update({
            full_name: full_name,
            email: email,
            contact_no: contactNo,
            gender: gender,
            date_of_birth: dateOfBirth,
          })
          .then(() => {
            res.send({
              success: true,
              message: "Profile updated successfully",
            });
          })
          .catch((error) => {
            console.log("Error updating user profile:", error);
            res.send({
              success: false,
              message: "Failed to update user profile.",
            });
          });
      } else {
        res.send({ success: false, message: "User not found" });
      }
    })
    .catch((error) => {
      console.log("Error finding user:", error);
      res.send({ success: false, message: "Failed to find user" });
    });
});

app.get("/getProduct", function (req, res) {
  fs.readFile(
    __dirname + "/" + "all-products.json",
    "utf8",
    function (err, data) {
      console.log(data);
      res.send(data); // you can also use res.send()
    }
  );
});

app.get("/keyword", function (req, res) {
  fs.readFile(
    __dirname + "/" + "all-products.js",
    "utf8",
    function (err, data) {
      data = JSON.parse(data);
      console.log(data.tour);
      const result = data.tour.filter(function (obj) {
        return obj["category"]
          .toLowerCase()
          .includes(req.query.i.toLowerCase());
      });
      console.log(result);
      res.send(result); // you can also use res.send()
    }
  );
});
app.get("/getSliderImages", function (req, res) {
  fs.readFile(
    __dirname + "/" + "slider.json",
    "utf8",
    function (err, data) {
      console.log(data);
      res.send(data); // you can also use res.send()
    }
  );
});

app.get("/keyword", function (req, res) {
  fs.readFile(
    __dirname + "/" + "slider.js",
    "utf8",
    function (err, data) {
      data = JSON.parse(data);
      console.log(data.tour);
      const result = data.tour.filter(function (obj) {
        return obj["id"]
          .toLowerCase()
          .includes(req.query.i.toLowerCase());
      });
      console.log(result);
      res.send(result); // you can also use res.send()
    }
  );
});

app.get("/store/item-page/:pageName", async (req, res) => {
  try {
    const pageName = req.params.pageName;
    const item = await itemModel.findOne({ where: { page_name: pageName } });
    if (item) {
      const itemData = {
        item_id: item.item_id,
        item_name: item.item_name,
        item_price: item.item_price,
        item_desc: item.item_desc,
        item_category: item.item_category,
        item_series: item.item_series,
        page_name: item.page_name,
      };
      res.json(itemData);
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/items", async (req, res) => {
  try {
    const items = await ItemPage.findAll();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/subscribe", async (req, res) => {
  let retVal = { success: false };
  console.log("req: ", request.body);
  subscriberModel
    .findOne({
      where: {
        email: req.body.email,
      },
    })
    .then((result) => {
      if (result) {
        retVal.success = false;
        retVal.message =
          "This email has already subscribed. Please do not input again.";
        console.log(retVal.message);
        res.send(retVal);
      } else {
        subscriberModel
          .create({
            email: req.body.email,
          })
          .then((result) => {
            return result.dataValues;
          })
          .then((result) => {
            retVal.message = "Thank you for subscribing!";
            console.log(retVal.message);
            retVal.success = true;
            retVal.userData = null;
            // retVal.userData = result; // for auto login after registration
            retVal.userData = result; // for auto login after registration
          })
          .finally(() => {
            res.send(retVal);
          })
          .catch((error) => {
            console.log("error: ", error);
          });

        let transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: EMAIL,
            pass: PASSWORD,
          },
        });

        const handlebarsOptions= {
          viewEngine: {
            extName: ".handlebars",
            partialsDir: path.resolve('./views'),
            defaultLayout: false,
          },
          viewPath: path.resolve('./views'),
          extName: ".handlebars",
        }

        transporter.use('compile', hbs(handlebarsOptions));

        const msg = {
          from: `"Gon's Dispo Vape Shop" <${EMAIL}>`,
          to: `${req.body.email}, ${req.body.email}`,
          subject: "Thanks for Subscribing!",
          template: 'template'
        };

        let info = transporter.sendMail(msg);

        console.log("Message sent: %s", info.messageId);
      }
    });
});

app.post("/api/cart", async (req, res) => {
  try {
    const items = req.body.items; // array of items
    const userID = req.body.userID;

    // Retrieve items from database that belong to the user with the given userID
    const existingItems = await CartItems.findAll({
      where: {
        userID: userID,
      },
    });

    // Map over the array of items and create a new array of objects to be inserted into the database
    const cartItems = items.map((item) => {
      // Check if the item already exists in the database
      const exists = existingItems.some(
        (existingItem) => existingItem.itemID === item.id
      );

      // If the item already exists in the database, skip it
      if (exists) {
        return null;
      }

      return {
        cartQuantity: item.cartQuantity,
        itemID: item.id, // Use the 'id' property as the 'itemID'
        price: item.price,
        star: item.star,
        text: item.text,
        title: item.title,
        url: item.url,
        userID: userID,
      };
    });

    // Filter out any null values
    const filteredCartItems = cartItems.filter((item) => item !== null);

    // Insert the array of objects into the database
    await CartItems.bulkCreate(filteredCartItems);

    res.status(200).send("Items successfully saved to the database");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving items to the database");
  }
});

// app.post("/api/orders", async (req, res) => {
//   const { userID, orderID, items, address, total } = req.body;

//   try {
//     // Create new orders for each item and save them to the database
//     for (const item of items) {
//       const order = await Order.create({
//         userID,
//         orderID,
//         address,
//         total,
//         itemId: item.id,
//         quantity: item.quantity,
//       });
//     }

//     res.json({ message: "Order saved successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

const runApp = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    app.listen(3005); // run app with this given port
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};
runApp();
