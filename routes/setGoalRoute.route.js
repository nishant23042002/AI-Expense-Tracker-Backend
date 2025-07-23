import express from "express"
import { getAllGoal, getGoalProgress, refreshGoalTip, setGoal } from "../controller/setGoalController.controller.js"
import {protectedRoute} from "../middleware/protectedRoute.middleware.js"
const router = express.Router();

router.post("/setgoal",protectedRoute, setGoal)
router.get("/getallgoals",protectedRoute, getAllGoal)
router.get("/goalprogress",protectedRoute, getGoalProgress)
router.put("/refreshgoaltip/:goalId",protectedRoute, refreshGoalTip)

export default router;