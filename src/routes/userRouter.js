//userRouter.js
const  {Router} = require("express");
const prisma = require("../../script.js")
const {getUserData, getAllUsers } = require("../controllers/userController.js");
const userRouter = Router();

//Get all users
userRouter.get("/", getAllUsers(prisma));

//Get user profile + posts
userRouter.get("/:id", getUserData(prisma));

module.exports = userRouter;