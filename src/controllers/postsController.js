//postsController.js

const cloudinary = require('cloudinary').v2;

function createPost(prisma) {
    return async (req, res) => {
        const authorId = req.user.id;
        const { content } = req.body;

        try {
            const newPost = await prisma.post.create(
                {data: {content: content, authorId: authorId}}
            )

            res.json(newPost)

        } catch (err) {
            console.log(err)
            res.status(400).json({err: "Failed to create post"})
        }
    }
}


function getPosts(prisma) {
    return async (req, res) => {

        //get user iD
        const userId = req.user.id;

        
        try{

            //Get following IDs
            const following = await prisma.follow.findMany({
                where: { followerId: userId },
                select: { followingId: true }
            }) 

            //Build author list (self + following)
            const authorIds = [
                userId,
                ...following.map(f => f.followingId)
            ];

            //Get posts
            const posts = await prisma.post.findMany({
                where: {authorId: {in: authorIds}}, 
                orderBy: {createdAt: "desc"},
                 include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            profile: {
                                select: {
                                    name: true,
                                    profilePic: true,
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                        likes: true,
                        comments: true
                        }
                    }                    
                }
            })

            res.json(posts);

        } catch(err){
            console.log(err);
            res.status(400).json({err: "Failed to fetch posts"})
        }
    }
}


function getPostById(prisma) {
    return async (req, res) => {
        const postId = parseInt(req.params.id);

        try{ 
            const post = await prisma.post.findUnique({
                where: {id: postId},
                include: {
                    author: {
                        select: {
                            id: true, 
                            username: true,  
                            profile: {
                                select: {
                                    name: true,
                                    profilePic: true,
                                }    
                            }
                        }        
                    },
                    comments: {
                        select: {
                            userId: true,
                            content: true,
                            orderBy: {createdAt: "desc"}
                        }
                    },
                    _count: {
                        select: { likes: true }
                    }
                }
            });


    if(!post) {
        return res.status(400).json({err: "Post not found"})
    }
        res.json(post)

        }catch (err) {
            console.log(err)
            res.status(500).json({err: "Failed to get post"})
        }

    }
}


function deletePostById(prisma) {
    return async (req, res) => {
        const postId = parseInt(req.params.id);
        const userId = req.user.id

        try {
            const post = await prisma.post.findUnique({where: {id: postId}})

            //Check if user is the post author
            if(!post || post.authorId !== userId){
                return res.status(403).json({err: "Not allowed"})
            }

            await prisma.post.delete({ where: {id: postId}})

            res.json({success: true});

        } catch (err) {
            console.log(err)
            res.status(500).json({err: "Failed to delete post"})
        }
    }
}


function likePost(prisma) {
    return async (req, res) => {
        const postId = parseInt(req.params.id);
        const userId = req.user.id

        try {
            const likePost = await prisma.like.upsert({
                where: {userId_postId: {userId, postId}},
                create: {userId, postId},
                update: {}
            })

            res.json(likePost);

        } catch (err) {
            console.log(err)
            res.status(400).json({err: "Failed to like post"})
        }
    }
}


function unlikePost(prisma) {
    return async (req, res) => {        
        const postId = parseInt(req.params.id);
        const userId = req.user.id

        try {
            await prisma.like.delete({
                where: {userId_postId: {userId, postId}}
            })

            res.json({success: true});

        } catch (err) {
            console.log(err)
            res.status(400).json({err: "Failed to unlike post"})
        }
    }
}


function createComment(prisma) {
    return async (req, res) => {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;
        const { content } = req.body;

        try {
            const newComment = await prisma.comment.create({
                data: {userId: userId, postId: postId, content: content}
            })

            res.json(newComment);

        } catch (err) {
            console.log(err)
            res.status(500).json({err: "Failed to create comment"})
        }
    }
}


function getComments(prisma) {
    return async (req, res) => {
        const postId = parseInt(req.params.id);

        try {
            const comments = await prisma.comment.findMany({
                where: {postId: postId},
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            profile: {
                                select: {
                                    name: true,
                                    profilePic: true}
                            }
                        }
                    }
                }
            })

            res.json(comments);

        } catch (err) {
            console.log(err)
            res.status(500).json({err: "Failed to create comment"})
        }
    }
}



function deleteComment(prisma) {
    return async (req, res) => {
        const commentId = parseInt(req.params.id);
        const userId = req.user.id;

        try {
            const comment = await prisma.comment.findUnique({
                where: {id: commentId}
            })

            if(!comment || comment.userId !== userId) {
                return res.status(403).json({err: "Not allowed"})
            }

            await prisma.comment.delete({
                where: {id: commentId}
            })

            res.json({success: true});

        } catch (err) {
            console.log(err)
            res.status(500).json({err: "Failed to delete comment"})
        }
    }
}

module.exports = { createPost, getPosts, getPostById, deletePostById, likePost, unlikePost, createComment, getComments, deleteComment};