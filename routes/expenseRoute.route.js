import express from "express";
import { upload } from "../middleware/multer.middleware.js";
import {
    addExpense,
    getUserExpenses,
    deleteExpense,
    extractAndAddFromReceipt
} from "../controller/expenseController.controller.js";
import { protectedRoute } from "../middleware/protectedRoute.middleware.js";

const router = express.Router();

// 1. Add Expense manually
router.post("/addexpense",protectedRoute, addExpense);

// 2. Get all expenses for a user
router.get("/getmyexpense",protectedRoute, getUserExpenses);

// 3. Delete an expense
router.delete("/:id", deleteExpense);

// 4. Upload a receipt and auto-create expense via OCR
router.post("/myexpense/upload-receipt", upload.single("receipt"), extractAndAddFromReceipt);

export default router;
