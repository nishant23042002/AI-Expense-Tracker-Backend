import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
dotenv.config();

const userSchema = mongoose.Schema({
    userName: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    profile: {
        type: String,
        required: [true, "Please select a Profile Picture!!"]
    },
    password: {
        type: String,
        required: [true, "Password is required!!"],
    },
    isAgree: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next(); // Only hash if password is new/modified

    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (err) {
        next(err);
    }
})

userSchema.methods.comparePassword = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
    //generating token while registering user
    return jwt.sign(
        {
            userId: this._id,
            username: this.userName,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model("User", userSchema)
export default User