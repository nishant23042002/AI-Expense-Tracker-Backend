import express from "express";
import { getDashboardStats } from "../controller/dashboardController.controller.js";
import { protectedRoute } from "../middleware/protectedRoute.middleware.js";

const router = express.Router();

router.get("/dashboardstats", protectedRoute, getDashboardStats);

export default router;
