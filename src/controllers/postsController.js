//postsController.js

const cloudinary = require('cloudinary').v2;

function createPost(prisma) {
    return async (req, res) => {
        const authorId = req.user.id;
        const { content } = req.body;

        try {
            let imageUrl = null;

            // 🖼️ Upload image if provided
            if (req.file) {
                const uploadResult = await cloudinary.uploader.upload(
                    req.file.path,
                    {
                        folder: "post_images",
                    }
                );
                imageUrl = uploadResult.secure_url;
            }

            const newPost = await prisma.post.create({
                data: {
                    content,
                    authorId,
                    image: imageUrl,
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            profile: {
                                select: {
                                    name: true,
                                    profilePic: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
            });

            res.json(newPost);
        } catch (err) {
            console.error(err);
            res.status(400).json({ err: "Failed to create post" });
        }
    };
}


const getPublicIdFromUrl = (url) => {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return `post_images/${filename.split(".")[0]}`;
};


function deletePostById(prisma) {
    return async (req, res) => {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;

        try {
            const post = await prisma.post.findUnique({
                where: { id: postId },
            });

            if (!post || post.authorId !== userId) {
                return res.status(403).json({ err: "Not allowed" });
            }

            // 🗑️ Delete Cloudinary image if exists
            if (post.image) {
                const publicId = getPublicIdFromUrl(post.image);
                await cloudinary.uploader.destroy(publicId);
            }

            await prisma.post.delete({
                where: { id: postId },
            });

            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ err: "Failed to delete post" });
        }
    };
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
        console.log("getPostById hit with id:", req.params.id);

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
                        orderBy: {createdAt: "desc"},
                        select: {
                            userId: true,
                            content: true,
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





function postLiked(prisma) {
    return async (req, res) => {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;

        try{
            const postLikes = await prisma.like.findUnique({where: {userId_postId: { userId, postId }}})  

            res.json(postLikes)

        }catch (err) {
            console.log(err)
            res.status(500).json({err: "Failed to get post likes"})
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

        console.log("Received content: ", content)

        try {
            const newComment = await prisma.comment.create({
                data: {userId: userId, postId: postId, content: content},
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



module.exports = { createPost, getPosts, getPostById, deletePostById, likePost, postLiked, unlikePost, createComment, getComments, deleteComment};