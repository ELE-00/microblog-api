//userController.js

function getAllUsers(prisma){
  return async (req, res) => {
    try{
    const users = await prisma.user.findMany({
        select: {
        id: true,
        username: true,
        profile: true,
        }
    });

    res.json(users)

    } catch (err) {
      console.log(err)
      res.status(500).json({error: "Failed to get users list"})

    }
  }
}


function getUserData(prisma){
  return async (req, res) => {
    const userId = parseInt(req.params.id);

    console.log("Received userID: " + userId)
    
    try{
    //get profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        createdAt: true,
        profile: true,
        posts: {
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    name: true,
                    profilePic: true
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
        }
      }
    });

    res.json(user);

    } catch (err) {
      console.log(err)
      res.status(500).json({error: "Failed to get users data"})

    }
  }
}


module.exports = {getUserData, getAllUsers}