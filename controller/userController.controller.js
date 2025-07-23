import { uploadToCloudinary } from "../utils/cloudinary.service.js";
import User from "../model/User.model.js";

export const signUpUser = async (req, res) => {
    try {
        const { userName, email, password, isAgree, role } = req.body;
        console.log("req.file:", req.file);

        const register = await User.findOne({email})
        if(register){
            return res.status(400).json({message: "Email already exists..."})
        }
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
            profile: result.secure_url,
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
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


export const loginUser = async (req, res) => {
    try {
        let { email, password, isAgree, role } = req.body;
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