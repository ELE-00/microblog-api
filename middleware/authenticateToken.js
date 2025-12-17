const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const header = req.headers["authorization"];
    const token = header && header.split(" ")[1];

    if(!token) return res.status(401).json({error: "Missing token"});

    
    // DEV MODE BYPASS
    if (process.env.NODE_ENV === "development" && token === "dev-token") {
        req.user = { id: 1, username: "ele" };
        return next();
    }


    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({error: "invalid token"});

        req.user = user;
        next();
    });
};



module.exports = authenticateToken;