import Income from "../model/Income.model.js";
import Expense from "../model/Expense.model.js";
import SetGoal from "../model/SetGoal.model.js";
import mongoose from "mongoose";
const { Types } = mongoose;
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Utility function to generate AI tip
const generateAITip = async (goal, savedAmount, monthsLeft, percentCompleted) => {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `
                I'm currently saving up for a personal goal: "${goal.title}".
                - My total goal is ₹${goal.amount}.
                - So far, I've saved ₹${savedAmount}.
                - I have ${monthsLeft} months remaining to achieve this.

                Give me a **realistic, helpful, and motivating tip** to help me reach my goal on time.
                The advice should:
                - Be concise but informative (2-3 sentences max)
                - Suggest a practical action or mindset shift
                - Make sure progress percentage should included in the response
                - Feel personalized and encouraging based on my progress percentage ${percentCompleted}%.
        `
      }
    ],
    temperature: 0.7
  });

  return response.choices[0].message.content.trim();
};



// ----------------------------------------
// 1. Set a Goal (with AI tip generation)
// ----------------------------------------

export const setGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, amount, durationMonths } = req.body;
    const targetDate = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000);

    // Dummy tip to avoid delay (optional)
    const aiTipForSaving = "Your tip will be available shortly.";

    const myGoal = await SetGoal.create({
      userId,
      title,
      amount,
      durationMonths,
      targetDate,
      aiTipForSaving
    });

    res.status(201).json({ message: "Goal set successfully", Goal: myGoal });

    // After response, asynchronously update AI tip
    const userObjectId = new Types.ObjectId(String(userId));

    const incomeAgg = await Income.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalIncome = incomeAgg[0]?.total || 0;

    const expenseAgg = await Expense.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpense = expenseAgg[0]?.total || 0;

    const savedAmount = totalIncome - totalExpense;
    const monthsLeft = Math.max(1, Math.ceil((targetDate - new Date()) / (30 * 24 * 60 * 60 * 1000)));
    const percentCompleted = Math.min(100, Math.floor((savedAmount / amount) * 100));

    const tip = await generateAITip({ title, amount }, savedAmount, monthsLeft, percentCompleted);
    await SetGoal.findByIdAndUpdate(myGoal._id, { aiTipForSaving: tip });

  } catch (error) {
    res.status(500).json({ error: error.message, message: "Something went wrong" });
  }
};

// ----------------------------------------
// 2. Get Goal Progress (uses cached AI tips)
// ----------------------------------------

export const getGoalProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const goals = await SetGoal.find({ userId });
    const userObjectId = new Types.ObjectId(String(userId));

    const incomeAgg = await Income.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalIncome = incomeAgg[0]?.total || 0;

    const expenseAgg = await Expense.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpense = expenseAgg[0]?.total || 0;

    const savedAmount = totalIncome - totalExpense;

    const progressData = goals.map((goal) => {
      const monthsLeft = Math.max(1, Math.ceil((goal.targetDate - new Date()) / (30 * 24 * 60 * 60 * 1000)));
      const monthlyTarget = Math.ceil(goal.amount / goal.durationMonths);
      const percentCompleted = Math.min(100, Math.floor((savedAmount / goal.amount) * 100));

      return {
        goal,
        savedAmount,
        percentCompleted,
        monthlyTarget,
        monthsLeft,
        isOnTrack: savedAmount >= (goal.amount / goal.durationMonths) * (goal.durationMonths - monthsLeft),
        aiTipForSaving: goal.aiTipForSaving
      };
    });

    res.status(200).json({ progress: progressData });

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch goal progress", error: err.message });
  }
};

// ----------------------------------------
// 3. Refresh AI Tip for Specific Goal
// ----------------------------------------

export const refreshGoalTip = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.goalId;
    const goal = await SetGoal.findOne({ _id: goalId, userId });

    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const userObjectId = new Types.ObjectId(String(userId));

    const incomeAgg = await Income.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalIncome = incomeAgg[0]?.total || 0;

    const expenseAgg = await Expense.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpense = expenseAgg[0]?.total || 0;

    const savedAmount = totalIncome - totalExpense;
    const monthsLeft = Math.max(1, Math.ceil((goal.targetDate - new Date()) / (30 * 24 * 60 * 60 * 1000)));
    const percentCompleted = Math.min(100, Math.floor((savedAmount / goal.amount) * 100));

    const tip = await generateAITip(goal, savedAmount, monthsLeft, percentCompleted);

    goal.aiTipForSaving = tip;
    await goal.save();

    res.status(200).json({ message: "AI tip refreshed successfully", tip });

  } catch (err) {
    res.status(500).json({ message: "Failed to refresh tip", error: err.message });
  }
};

// ----------------------------------------
// 4. Get All Goals (for listing)
// ----------------------------------------

export const getAllGoal = async (req, res) => {
  let userId = req.user.id;
  try {
    const allGoals = await SetGoal.find({ userId });
    res.status(200).json({ message: "All goals set by user", Goals: allGoals });
  } catch (error) {
    res.status(500).json({ error: error.message, message: "Something went wrong" });
  }
};
