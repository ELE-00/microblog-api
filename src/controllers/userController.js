//userController.js

function getAllUsers(prisma){
  return async (req, res) => {
    try{
    const users = await prisma.user.findMany();

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
      where: {id: userId},
      include: {
        profile: true,
        posts: {
          orderBy: {createdAt: "desc"},
        },
      },
    });

    res.json(user);

    } catch (err) {
      console.log(err)
      res.status(500).json({error: "Failed to get users data"})

    }
  }
}


module.exports = {getUserData, getAllUsers}