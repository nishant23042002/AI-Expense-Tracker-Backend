import { uploadToCloudinary } from "../utils/cloudinary.service.js";
import User from "../model/User.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config();

const buildDefaultProfileImage = (userName = "User", email = "") => {
    const displayName = userName.trim() || email.trim() || "User";
    const initials = displayName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.match(/[a-z0-9]/i)?.[0]?.toUpperCase())
        .filter(Boolean)
        .join("") || "U";

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
            <rect width="160" height="160" rx="80" fill="#7D5FFF"/>
            <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="700" fill="#ffffff">
                ${initials}
            </text>
        </svg>
    `;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

export const signUpUser = async (req, res) => {
    try {
        const { userName, email, password, isAgree, role } = req.body;
        console.log("req.file:", req.file);

        const register = await User.findOne({ email })
        if (register) {
            return res.status(400).json({ message: "Email already exists..." })
        }
        if (!req.file) {
            return res.status(400).json({ message: "No profile picture uploaded." });
        }

        let profileUrl;

        try {
            const result = await uploadToCloudinary(req.file.buffer, "profile_pictures");
            profileUrl = result.secure_url;
        } catch (error) {
            if (!error.isCloudinaryConfigError) {
                throw error;
            }

            console.warn("Cloudinary upload skipped during signup:", error.message);
            profileUrl = buildDefaultProfileImage(userName, email);
        }

        const registerUser = await User.create({
            userName: userName,
            email: email,
            password: password,
            isAgree: isAgree,
            profile: profileUrl,
            role: role
        })
        if (!registerUser) {
            return res.status(400).json({ message: "Something went wrong while registering the user" })
        }

        const token = registerUser.generateAccessToken();
        return res.status(201).json({
            message: "User registered. Please Login...",
            token,
            user: {
                username: registerUser.userName,
                profilePic_URL: registerUser.profile
            }
        });
    } catch (error) {
        console.error("Signup error:", error);
        if (error.isCloudinaryConfigError) {
            return res.status(error.statusCode || 503).json({
                message: "Profile image upload is not configured correctly.",
                error: error.message,
            });
        }

        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


export const loginUser = async (req, res) => {
    try {
        let { email, password, isAgree } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }
        if (!isAgree) {
            return res.status(401).json({ message: "You must agree to the terms and conditions." })
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid Email or Password" })
        }

        const matchPassword = await user.comparePassword(password)
        if (!matchPassword) {
            return res.status(401).json({ message: "Invalid Email or Password" })
        }
        const accessToken = user.generateAccessToken();


        return res.status(201).json({
            message: "Login Successfully. WELCOME...",
            accessToken,
            user: {
                username: user.userName,
                profilePic_URL: user.profile,
                termsandconditions: user.isAgree,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}



export const getAllUser = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        console.log(users);
        res.status(200).json({ message: "All Users", registerUsers: users })
    } catch (error) {
        console.error("Something went wrong: ", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}
