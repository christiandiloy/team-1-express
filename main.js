const express = require("express"); // server code or to run our own server on localhost specified by port
const cors = require("cors"); // this allows us to access our server on a different domain
const bodyParser = require("body-parser"); // this allows us to ready request data JSON object
const app = express(); // initialize express server into a variable
const fs = require("fs"); // use file system of windows or other OS to access local files
const nodemailer = require("nodemailer"); //send email to users
const request = require("request");
const requestAPI = request;
const { Sequelize } = require("sequelize");
const bcrypt = require("bcrypt");
const itemModel = require("./models/itemModel");
const subscriberModel = require("./models/subscriberModel");
const path = require("path");
const { EMAIL, PASSWORD } = require("./env.js");

const sequelize = new Sequelize("paredes", "wd32p", "7YWFvP8kFyHhG3eF", {
  host: "20.211.37.87",
  dialect: "mysql",
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
    __dirname + "/" + "all-products.json",
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

app.post("/subscribe", async (req, res) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  });
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

        const msg = {
          from: `"Gon's Dispo Vape Shop" <${EMAIL}>`,
          to: `${req.body.email}, ${req.body.email}`,
          subject: "Thanks for Subscribing!",
          text: "Thanks for subscribing!",
        };

        let info = transporter.sendMail(msg);

        console.log("Message sent: %s", info.messageId);
      }
    });
});

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
