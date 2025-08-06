import express from "express";
import {
    addExpense,
    getUserExpenses,
    deleteExpense,
    editExpense
} from "../controller/expenseController.controller.js";
import { protectedRoute } from "../middleware/protectedRoute.middleware.js";

const router = express.Router();

// 1. Add Expense manually
router.post("/addexpense", protectedRoute, addExpense);

// 2. Get all expenses for a user
router.get("/getmyexpense", protectedRoute, getUserExpenses);

// 3. Edit an expense
router.put("/editexpense/:id", protectedRoute, editExpense);

// 4. Delete an expense
router.delete("/:id", deleteExpense);


export default router;
