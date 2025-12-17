//profileConroller.js
const cloudinary = require('cloudinary').v2;

function uploadProfileImage(prisma) {
    return async (req, res) => {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "profile_pics",
            resource_type: "image"
        });

        // Save to Prisma
        const updatedUser = await prisma.profile.update({
            where: {id: userId},
            data: {
                profilePic: uploadResult.secure_url,
            }
        });

        return res.json({
            success: true,
            profilepic: uploadResult.secure_url,
            user: updatedUser
        });

        } catch (err) {
            console.error(err);
            console.log("Upload failed");
        }
    }
}




//Get logged in user profile data
function getProfileData(prisma){
  return async (req, res) => {
    const userId = req.user.id;

    console.log("Received userID: " + userId)
    
    try{
    //get profile
    const userProfile = await prisma.profile.findUnique({
      where: {userId: userId}
    });

    const posts = prisma.post.findMany({
        where: {authorId: userId, orderby: {createdAt: "desc"}}
    })

    res.json({profile: userProfile, posts})

    } catch (err) {
      console.log(err)
      res.status(500).json({error: "Failed to get users data"})

    }
  }
}


//Upload files
function UpdateProfileData(prisma) {
    return async (req, res) => {
    const userId = req.user.id;
    const {name, dateOfBirth, occupation, bio, location} = req.body;

    try {
        const updateProfile = await prisma.profile.update({
            where: {userId: userId},
            data: {name: name, dateOfBirth: dateOfBirth, occupation: occupation, location: location, bio: bio}
        })

        res.json(updateProfile);

        } catch (err) {
            console.error(err);
            console.log("Upload failed");
        }
    }
}

module.exports = { uploadProfileImage, getProfileData, UpdateProfileData };