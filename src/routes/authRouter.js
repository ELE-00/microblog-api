//authRouter.js
const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const prisma = require("../../script.js")
const { signup, login } = require("../controllers/authController");
const authRouter = Router();

const authLimiter = process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10,
        message: { error: "Too many attempts, please try again later" }
    });

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

const signupRules = [
    body("username").trim().notEmpty().withMessage("Username is required")
        .isLength({ min: 3, max: 20 }).withMessage("Username must be 3–20 characters"),
    body("password").notEmpty().withMessage("Password is required")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
        .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
        .matches(/[a-z]/).withMessage("Password must contain a lowercase letter")
        .matches(/[0-9]/).withMessage("Password must contain a number")
        .matches(/[^A-Za-z0-9]/).withMessage("Password must contain a special character"),
    body("passwordConfirm").notEmpty().withMessage("Password confirmation is required"),
];

const loginRules = [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
];

//Signup
authRouter.post("/signup", authLimiter, signupRules, validate, signup(prisma));

//Login
authRouter.post("/login", authLimiter, loginRules, validate, login(prisma));


module.exports = authRouter;


