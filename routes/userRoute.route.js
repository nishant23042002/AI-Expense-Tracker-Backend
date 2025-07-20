import express from "express"
import { loginUser, signUpUser } from "../controller/userController.controller.js";
import { uploadProfilePic } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post("/signup", uploadProfilePic.single("profilePic"), signUpUser);
router.post("/login", loginUser);


export default router;