import express from "express"
import { loginUser, signUpUser, getAllUser } from "../controller/userController.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { protectedRoute } from "../middleware/protectedRoute.middleware.js";

const router = express.Router();

router.post("/signup", upload.single("profilePic"), signUpUser);
router.post("/login", loginUser);
router.get("/getAllUsers", protectedRoute, getAllUser);

export default router;