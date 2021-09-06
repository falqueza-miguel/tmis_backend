const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

const User = require("../models/user");
const Prereg = require("../models/prereg");

const isAuth = require("../middleware/is-auth");
const { isAdmin } = require("../middleware/is-role");
const USERS_PER_PAGE = 1000;

//user profile page
router.get("/admin", isAuth, isAdmin, async (req, res) => {
   try {
      let user = await User.findOne({ _id: res.locals._id });
      res.json({
         success: true,
         user: user,
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message,
      });
   }
});

//create user
router.post(
   "/admin/createuser",
   isAuth,
   isAdmin,
   body("email").isEmail(),
   (req, res) => {
      const errors = validationResult(req); //validates if email is an actual email
      if (!errors.isEmpty()) {
         console.log(errors);
         return res.status(400).json({ errors: errors.array() });
      }

      const email = req.body.email; //input from frontend here
      const password = "password"; // DEFAULT PASSWORD HERE

      User.findOne({ email: email })
         .then((userDoc) => {
            //authentication and creation
            if (userDoc) {
               //checks if already exists, could be redundant code(?)
               console.log("user already exists in users coll");
               //    return res.redirect("/"); //user already exists, redirects to home page for now
               return res.send("users email");
            }
            Prereg.findOne({ email: email }) //checks if email used already exists in prereg too, optimize this
               .then((userDoc) => {
                  if (userDoc) {
                     console.log("student email is in use in prereg coll");
                     return res.send("student email");
                  }
                  Prereg.findOne({ parentEmail: email })
                     .then((userDoc) => {
                        if (userDoc) {
                           console.log("parent email is in use in prereg coll");
                           return res.send("parent email");
                           //create user here
                        }
                        return bcrypt
                           .hash(password, 12)
                           .then((hashedPassword) => {

                              let capitalizeFirstLetter = (string) => {
                                 return string.charAt(0).toUpperCase() + string.slice(1);
                             }

                             let capitalizeFirstLetters = (str) => {
                              var splitStr = str.toLowerCase().split(' ');
                              for (var i = 0; i < splitStr.length; i++) {
                                  splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
                              }
                              return splitStr.join(' '); 
                              }

                              //once done hashing,
                              const user = new User({
                                 //new user object
                                 firstName: capitalizeFirstLetters(req.body.firstName),
                                 middleName: capitalizeFirstLetter(req.body.middleName),
                                 lastName: capitalizeFirstLetter(req.body.lastName),
                                 email: req.body.email.toLowerCase(),
                                 phoneNum: req.body.phoneNum,
                                 password: hashedPassword,
                                 role: req.body.role,
                                 active: true,
                                 firstLogin: true,
                              });
                              console.log("account successfully created!");
                              return user.save(); //saving user object to database
                           })
                           .then((result) => {
                              res.json({
                                 success: true,
                              });
                           });
                     })
                     .catch((err) => {
                        console.log(err);
                     });
               })
               .catch((err) => {
                  console.log(err);
               });
         })
         .catch((err) => {
            console.log(err);
         });
   }
);

//gets all active users
router.get("/admin/users", isAuth, isAdmin, async (req, res) => {
   try {
      const page = req.query.page;
      let totalUsers = await User.find({
         $and: [
            { $or: [{ role: 0 }, { role: 1 }, { role: 2 }, { role: 3 }] },
            { active: true },
         ],
      }).count();
      let users = await User.find({
         $and: [
            { $or: [{ role: 0 }, { role: 1 }, { role: 2 }, { role: 3 }] },
            { active: true },
         ],
      })
         .skip((page - 1) * USERS_PER_PAGE)
         .limit(USERS_PER_PAGE);
      res.json({
         success: true,
         users: users,
         totalUsers: totalUsers,
         hasNextPage: USERS_PER_PAGE * page < totalUsers,
         hasPreviousPage: page > 1,
         nextPage: parseInt(page) + 1,
         previousPage: page - 1,
         lastPage: Math.ceil(totalUsers / USERS_PER_PAGE),
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message,
      });
   }
});

//gets one user
router.get("/admin/users/:id", isAuth, isAdmin, async (req, res) => {
   try {
      let user = await User.findOne({ _id: req.params.id });
      res.json({
         success: true,
         user: user,
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message,
      });
   }
});

//changes one user
router.put("/admin/users/:id", isAuth, isAdmin, async (req, res) => {
   try {
      console.log("trying to update!");
      let user = await User.findOneAndUpdate(
         { _id: req.params.id },
         {
            $set: {
               firstName: req.body.firstName,
               middleName: req.body.middleName,
               lastName: req.body.lastName,
               phoneNum: req.body.phoneNum,
            },
         },
         { new: true }
      );
      res.json({
         success: true,
         user: user,
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message,
      });
   }
});

//archive user
router.delete("/admin/archive/:id", isAuth, isAdmin, async (req, res) => {
   try {
      let user = await User.findOneAndUpdate(
         { _id: req.params.id },
         { active: false },
         { new: true }
      );
      res.json({
         success: true,
         user: user,
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message,
      });
   }
});

//get archive users(?)

module.exports = router;
