import { Types } from "mongoose";
import Expense from "../model/Expense.model.js";
import Income from "../model/Income.model.js";

export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const userObjectId = new Types.ObjectId(String(userId))
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);


        //Total Income
        const totalIncomeAgg = await Income.aggregate([
            { $match: { userId: userObjectId } },
            { $group: { _id: null, totalIncome: { $sum: "$amount" } } }
        ]);
        const totalIncome = totalIncomeAgg[0]?.totalIncome || 0;

        //Total Expense
        const totalExpenseAgg = await Expense.aggregate([
            { $match: { userId: userObjectId } },
            { $group: { _id: null, totalExpense: { $sum: "$amount" } } }
        ]);
        const totalExpense = totalExpenseAgg[0]?.totalExpense || 0;

        //last 60 days income transactions
        const last60DaysIncomeTransactions = await Income.find({
            userId,
            receivedDate: { $gte: sixtyDaysAgo }
        }).sort({ receivedDate: -1 });


        const last60DaysIncome = last60DaysIncomeTransactions.map((txn) => ({
            date: txn.receivedDate.toISOString().split("T")[0], // 'YYYY-MM-DD'
            value: txn.amount,
            name: txn.source
        }));
        const totalIncomeLast60Days = last60DaysIncomeTransactions.reduce(
            (sum, transaction) => sum + transaction.amount, 0
        );

        //last 30 days expense transactions
        const last30DaysExpenseTransactions = await Expense.find({
            userId,
            spentDate: { $gte: thirtyDaysAgo }
        }).sort({ spentDate: -1 });


        const expenseLast30Days = last30DaysExpenseTransactions.reduce(
            (sum, transaction) => sum + transaction.amount, 0
        );

        const lastTransactions = [
            ...(await Income.find({ userId }).sort({ receivedDate: -1 })).map((txn) => ({
                ...txn.toObject(),
                type: "income",
                date: txn.receivedDate,
            })),
            ...(await Expense.find({ userId }).sort({ spentDate: -1 })).map((txn) => ({
                ...txn.toObject(),
                type: "expense",
                date: txn.spentDate,
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));  // latest first

        res.status(200).json({
            message: "Dashboard data fetched successfully",
            data: {
                totalBalance: totalIncome - totalExpense,
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                last30DaysExpenses: {
                    totalExpenseAmount: expenseLast30Days,
                    transaction: last30DaysExpenseTransactions
                },
                last60DaysIncomeTransactions: {
                    totalIncomeAmount: totalIncomeLast60Days,
                    transaction: last60DaysIncomeTransactions,
                    incomeLast60Days: last60DaysIncome
                },
                recentTransaction: lastTransactions
            }
        })
    } catch (err) {
        res.status(500).json({ message: "Failed to load dashboard", error: err.message });
    }
};
