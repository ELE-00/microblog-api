//postsRouter.js
const  {Router} = require("express");
const prisma = require("../../script.js")
const { createPost, getPosts, getPostById, deletePostById, likePost, unlikePost, createComment, getComments, deleteComment} = require("../controllers/postsController.js");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const postsRouter = Router();


//Create a post
postsRouter.post("/", createPost(prisma));

//Get posts (self + following users)
postsRouter.get("/", getPosts(prisma));

//Get single post
postsRouter.get("/:id", getPostById(prisma));

//Delete post
postsRouter.delete("/:id", deletePostById(prisma));

//Like post
postsRouter.post("/:id/like", likePost(prisma));

//Unlike posts
postsRouter.post("/:id/unlike", unlikePost(prisma));

//Post comment
postsRouter.post("/:id/comments", createComment(prisma));

//Get comments
postsRouter.get("/:id/comments", getComments(prisma));

//Delete comment
postsRouter.delete("/comments/:id", deleteComment(prisma));

module.exports = postsRouter;