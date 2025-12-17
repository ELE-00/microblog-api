//followController.js

//Follow a users
function followUser(prisma) {
    return async (req, res) => {
        const userId = req.user.id
        const followingId = parseInt(req.params.id)

        try{
            const follow = await prisma.follow.upsert({
                where: {followerId_followingId: {followerId: userId, followingId}},
                create: {followerId: userId, followingId: followingId},
                update: {}
            })

            res.json(follow)

        } catch(err) {
            console.log(err)
            res.status(400).json({error: "failed to follow user"})
        }
    }
}

//Unfollow a users
function unfollowUser(prisma) {    
    return async (req, res) => {
        const userId = req.user.id
        const followingId = parseInt(req.params.id)

        try{
            const removeFollow = await prisma.follow.delete({
                where: {followerId_followingId: {followerId: userId, followingId}},
            })

            res.json(removeFollow)

        } catch(err) {
            console.log(err)
            res.status(400).json({error: "failed to delete following user"})
        }
    }
}

//Get followers users
function getfollowers(prisma) {
    return async (req, res) => {
        const userId = parseInt(req.params.id)

        try{
        const followers = await prisma.follow.findMany({
            where: {followingId: userId},
            include: {
                follower: {
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

        res.json(followers)

        } catch(err) {
            console.log(err)
            res.status(500).json({error: "failed to get followers"})
        }
    }
}

//Get following users
function getfollowing(prisma) {
        return async (req, res) => {
        const userId = parseInt(req.params.id)

        try{
        const following = await prisma.follow.findMany({
            where: {followerId: userId},
            include: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        profile: {
                            select: {profilePic: true}
                        }
                    }
                }
            } 
        })
        res.json(following)

        } catch(err) {
            console.log(err)
            res.status(500).json({error: "failed to get followings"})
        }
    }
}

module.exports = {followUser, unfollowUser, getfollowers, getfollowing}
