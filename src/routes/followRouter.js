//followRouter.js
const  {Router} = require("express");
const prisma = require("../../script.js")
const { followUser, unfollowUser, getfollowers, getfollowing } = require("../controllers/followController");
const followRouter = Router();


//Follow user
followRouter.post("/:id/follow", followUser(prisma));

//Unfollow user
followRouter.post("/:id/unfollow", unfollowUser(prisma));

//Get followers
followRouter.get("/followers/:id", getfollowers(prisma));

//Get following
followRouter.get("/following/:id", getfollowing(prisma));



module.exports = followRouter;