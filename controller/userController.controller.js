import { uploadToCloudinary } from "../utils/cloudinary.service.js";
import User from "../model/User.modal.js";

export const signUpUser = async (req, res) => {
    try {
        const { userName, email, password, isAgree } = req.body;
        console.log("req.file:", req.file);

        if (!req.file) {
            return res.status(400).json({ message: "No profile picture uploaded." });
        }

        // Upload to Cloudinary
        // const uploadToCloudinary = () =>
        //     new Promise((resolve, reject) => {
        //         const stream = cloudinary.uploader.upload_stream(
        //             {
        //                 folder: "profile_pictures",
        //                 resource_type: "image",
        //             },
        //             (error, result) => {
        //                 if (error) return reject(error);
        //                 resolve(result);
        //             }
        //         );
        //         stream.end(req.file.buffer);
        //     });
        const result = await uploadToCloudinary(req.file.buffer, "profile_pictures");

        const registerUser = await User.create({
            userName: userName,
            email: email,
            password: password,
            isAgree: isAgree,
            profile: result.secure_url
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
        const token = user.generateAccessToken();

        return res.status(201).json({
            message: "Login Successfully. WELCOME...",
            token,
            user: {
                username: user.userName,
                profilePic_URL: user.profile,
                termsandconditions: user.isAgree
            }
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}