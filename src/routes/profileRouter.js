//profileRouter.js
const  {Router} = require("express");
const prisma = require("../../script.js")
const { uploadProfileImage, getProfileData, UpdateProfileData} = require("../controllers/profileController");
const profileRouter = Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

//Upload profile photo
profileRouter.post("/photo", upload.single("profilepic"), uploadProfileImage(prisma));

//Get logged in user profile data
profileRouter.get("/me", getProfileData(prisma));

//Update profile data
profileRouter.patch("/", UpdateProfileData(prisma));


module.exports = profileRouter;