//authRouter.js
const  {Router} = require("express");
const prisma = require("../../script.js")
const { signup, login } = require("../controllers/authController");
const authRouter = Router();

//Signup
authRouter.post("/signup", signup(prisma));

//Login
authRouter.post("/login", login(prisma));


module.exports = authRouter;


