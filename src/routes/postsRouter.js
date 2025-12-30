//postsRouter.js
const  {Router} = require("express");
const prisma = require("../../script.js")
const { createPost, getPosts, getPostById, deletePostById, likePost, postLiked, unlikePost, createComment, getComments, deleteComment} = require("../controllers/postsController.js");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const postsRouter = Router();

//STATC ROUTES

//Create a post
postsRouter.post("/", upload.single("postimage"), createPost(prisma));


//Get posts (self + following users)
postsRouter.get("/", getPosts(prisma));

//Delete comment
postsRouter.delete("/comments/:id", deleteComment(prisma));




//NESTED DYNAMIC ROUTES

//Like post
postsRouter.post("/:id/like", likePost(prisma));

//Get post likes
postsRouter.get("/:id/liked", postLiked(prisma));

//Unlike posts
postsRouter.post("/:id/unlike", unlikePost(prisma));

//Post comment
postsRouter.post("/:id/comments", createComment(prisma));

//Get comments
postsRouter.get("/:id/comments", getComments(prisma));


//DYNAMIC ROUTES

//Delete post
postsRouter.delete("/:id", deletePostById(prisma));

//Get single post
postsRouter.get("/:id", getPostById(prisma));



module.exports = postsRouter;