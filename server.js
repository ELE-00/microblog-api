// server.js
console.log("SERVER MODE:", process.env.NODE_ENV)

const express = require("express");
const cloudinary = require('cloudinary').v2;
require("dotenv").config();


// Configure Cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const authRouter = require("./src/routes/authRouter.js");
const followRouter = require("./src/routes/followRouter.js");
const postsRouter = require("./src/routes/postsRouter.js");
const profileRouter = require("./src/routes/profileRouter.js");
const userRouter = require("./src/routes/userRouter.js");
const authenticationToken = require("./middleware/authenticateToken.js");


const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(",").map(o => o.trim()).filter(Boolean);
console.log("Allowed origins:", allowedOrigins);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});
app.use(express.json());

 
//public routes
app.use("/api/auth", authRouter);

//Protected routes
app.use("/api/follow", authenticationToken, followRouter);
app.use("/api/profile", authenticationToken, profileRouter);
app.use("/api/posts", authenticationToken, postsRouter);
app.use("/api/user", authenticationToken, userRouter);


if (require.main === module) {
    app.listen(3000, () => console.log("API at localhost 3000"));
}

module.exports = app;
