import express from "express"
import { addIncome, deleteIncome, editIncome, editUserIncome, getAllIncome } from "../controller/incomeController.controller.js"
import { protectedRoute } from "../middleware/protectedRoute.middleware.js";

const router = express.Router();


router.post("/addIncome",protectedRoute, addIncome);
router.get("/getAllIncome",protectedRoute, getAllIncome);
router.put("/editincome/:id",protectedRoute, editIncome);
router.delete("/:id", deleteIncome);
router.patch("/editIncome/:id", editUserIncome);     // logic will write later

// router.use(protectedRoute);

export default router;
