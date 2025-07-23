import express from "express"
import { addIncome, deleteIncome, downloadIncome, editUserIncome, getAllIncome } from "../controller/incomeController.controller.js"
import { protectedRoute } from "../middleware/protectedRoute.middleware.js";

const router = express.Router();


router.post("/addIncome",protectedRoute, addIncome);
router.get("/getAllIncome",protectedRoute, getAllIncome);
router.get("/downloadIncome",protectedRoute, downloadIncome);
router.delete("/:id", deleteIncome);
router.patch("/editIncome/:id", editUserIncome);     // logic will write later

// router.use(protectedRoute);

export default router;
