import Tesseract from "tesseract.js"
import { uploadToCloudinary } from "../utils/cloudinary.service.js"
import Expense from "../model/Expense.model.js"
import OpenAI from "openai";
import dotenv from "dotenv"
dotenv.config();


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

//waiting for ai response to be fetched then saving it to DB. [synchronously]
// export const addExpense = async (req, res) => {
//     try {
//         let userId = req.user.id;
//         const { title, amount, notes, spentDate } = req.body;
//         let aiCategorySuggestion = ""
//         let aiIconRecommendation = ""
//         let aiExpenseRecommendation = ""

//         const aiCategory = await openai.chat.completions.create({
//             model: "gpt-3.5-turbo",
//             messages: [
//                 {
//                     role: "user",
//                     content: `Classify the expense source: "${title}" into the following categories: 
//                             "Food & Dining",
//                             "Transportation",
//                             "Housing",
//                             "Utilities",
//                             "Insurance",
//                             "Medical & Healthcare",
//                             "Entertainment",
//                             "Shopping",
//                             "Debt",
//                             "Education",
//                             "Travel",
//                             "Gifts & Donations",
//                             "Subscriptions",
//                             "Taxes",
//                             "Other".Return one of this catergory or a category related "${title}". Avoid returning a sentence.`,
//                 },
//             ],
//         });
//         aiCategorySuggestion = aiCategory.choices[0].message.content.trim();

//         const aiIcon = await openai.chat.completions.create({
//             model: "gpt-3.5-turbo",
//             messages: [
//                 {
//                     role: "user",
//                     content: `
//                             Suggest an appropriate single emoji to represent the following user expense on particular thing:
//                             "${title}"
//                             Make sure:
//                             - The emoji is relevant to the nature of the "${title}".
//                             - It is a single Unicode emoji only (no text or multiple emojis).
//                             - Avoid adding explanation or text — just return the emoji only.
//                             Examples:
//                             - "Freelance graphic design" -> 🎨
//                             - "Stock market dividends" -> 📈
//                             - "YouTube AdSense" -> 💻
//                             - "Salary" -> 💼
//                             - "Gift from friend" -> 🎁
//                             - "Real estate rent" -> 🏠
//                             Now, give a suitable emoji for: "${title}"`,
//                 },
//             ],
//         })
//         aiIconRecommendation = aiIcon.choices[0].message.content.trim();

//         const aiExpense = await openai.chat.completions.create({
//             model: "gpt-3.5-turbo",
//             messages: [
//                 {
//                     role: "user",
//                     content: `The user has logged an expense titled "${title}" with an amount of ₹${amount}.
//                                 Suggest a smart money-saving recommendation or personal finance tip based on this expense.

//                                 Be brief (1-2 sentences) and relevant.
//                                 Don't repeat the title. Avoid general advice. Tailor it to the type of expense.
//                                 Examples:
//                                 - If the user spends on streaming: "Consider bundling streaming services or using family plans to save."
//                                 - For eating out: "Try preparing meals at home a few times a week to cut costs."

//                                 Now, provide a recommendation for: "${title}"`
//                 }
//             ]
//         })
//         aiExpenseRecommendation = aiExpense.choices[0].message.content.trim();

//         const expense = await Expense.create({
//             userId,
//             title,
//             amount,
//             category: aiCategorySuggestion,
//             notes,
//             aiRecommendation: aiExpenseRecommendation,
//             spentDate,
//             icon: aiIconRecommendation,
//             inputMethod: "manual"
//         });

//         res.status(201).json({ message: "Expense added", data: expense });
//     } catch (err) {
//         res.status(500).json({ message: "Failed to add expense", error: err.message });
//     }
// };





// delaying ai response and adding it to DB later improves performance and reduces res time. [asynchronously]
export const addExpense = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, amount, spentDate } = req.body;

        // Step 1: Save base expense quickly
        const expense = await Expense.create({
            userId,
            title,
            amount,
            spentDate,
            icon: `generating icon based on ${title}`,
            aiRecommendation: "Generating AI response",
            inputMethod: "manual",
        });

        // Step 2: Respond immediately
        res.status(201).json({
            message: "Expense added successfully. AI processing will update soon.",
            data: expense,
        });

        // Step 3: AI logic asynchronously (non-blocking)
        setImmediate(async () => {
            try {
                // Get category suggestion
                const aiCategory = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "user",
                            content: `Classify the expense source: "${title}" into one of the following categories: 
                                        "Food & Dining", "Transportation", "Housing", "Utilities", "Insurance",
                                        "Medical & Healthcare", "Entertainment", "Shopping", "Debt", "Education",
                                        "Travel", "Gifts & Donations", "Subscriptions", "Taxes", "Other". 
                                        Return only a single category name.`,
                        },
                    ],
                });
                const aiCategorySuggestion = aiCategory.choices[0].message.content.trim();

                // Get icon suggestion
                const aiIcon = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "user",
                            content: `You are an intelligent finance assistant.
                            Suggest an appropriate single emoji to represent the following income source:
                            "${title}"
                            Make sure:
                            - The emoji is relevant to the nature of the income.
                            - It is a single Unicode emoji only (no text or multiple emojis).
                            - Avoid adding explanation or text — just return the emoji only.
                            Examples:
                            - "Freelance graphic design" -> 🎨
                            - "Stock market dividends" -> 📈
                            - "YouTube AdSense" -> 💻
                            - "Salary" -> 💼
                            - "Gift from friend" -> 🎁
                            - "Real estate rent" -> 🏠
                            Now, give a suitable emoji for: "${title}"`,
                        },
                    ],
                });

                const iconSuggestion = aiIcon.choices[0].message.content.trim();

                // Get saving tip / recommendation
                const aiTip = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are a helpful assistant that gives short, practical money-saving tips based on expense categories and amounts."
                        },
                        {
                            role: "user",
                            content: `The user has spent ₹${amount} on "${title}". Give one short, actionable tip to help them reduce or optimize this specific type of expense. Make it realistic, relevant, and no more than one sentence.`
                        },
                    ],
                });
                const aiRecommendation = aiTip.choices[0].message.content.trim();

                const noteSuggestion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are an assistant that helps users log their personal expenses with clear, concise notes. The note should summarize the expense based on what it was for, how much was spent, and when. Make it sound natural and helpful, like a journal entry or description."
                        },
                        {
                            role: "user",
                            content: `
                                        Generate a one-sentence note for an expense record with the following details:
                                        - Title: "${title}"
                                        - Amount: ₹${amount}
                                        - Category: "${expense.category}"
                                        - Spent Date: ${spentDate}
                                        The note should clearly explain what the expense was for, how much was spent, and when. Keep it human-friendly, avoid repetition, and limit it to one sentence.
                                    `
                        }
                    ]
                });
                const notes = noteSuggestion.choices[0].message.content.trim();

                // Step 4: Update the expense with AI-generated fields
                await Expense.findByIdAndUpdate(expense._id, {
                    category: aiCategorySuggestion,
                    icon: iconSuggestion,
                    notes: notes,
                    aiRecommendation,
                    isAICategorized: true,
                });

                console.log(`Expense [${expense._id}] updated with AI enhancements.`);
            } catch (error) {
                console.error("AI enrichment failed:", error.message);
            }
        });

    } catch (err) {
        res.status(500).json({
            message: "Failed to add expense",
            error: err.message,
        });
    }
};

export const getUserExpenses = async (req, res) => {
    let userId = req.user.id;
    try {
        const getUserExpenses = await Expense.find({ userId }).sort({ spentDate: -1 });
        res.status(200).json({ message: "All My Expenses", Expenses: getUserExpenses })
    } catch (error) {
        res.status(500).json({ error: error.message, message: "Something went wrong" })
    }
}



export const deleteExpense = async (req, res) => {
    let { id } = req.params;
    try {
        const deleteExpense = await Expense.findByIdAndDelete(id)
        res.status(200).json({ message: "Expense Deleted Successfully.", deletedExpense: deleteExpense })
    } catch (error) {
        res.status(500).json({ error: error.message, message: "Something went wrong" })
    }
}










//want to make changes later
export const extractAndAddFromReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No receipt image uploaded" });
        }

        // Optional: upload to Cloudinary
        const cloudinaryRes = await uploadToCloudinary(req.file.buffer, "expense-app/receipts");

        const result = await Tesseract.recognize(req.file.buffer, "eng");

        const text = result.data.text;
        console.log("Extracted Text:", text);

        // 🔍 Basic parsing logic (improve as needed)
        const amountRegex = /\$?\s?(\d{1,3}(,\d{3})*(\.\d{2})?)/g;
        const dateRegex = /(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/g;
        const lines = text.split("\n").filter(Boolean);

        const extracted = {
            vendor: lines[0] || "Unknown Vendor",
            total: (text.match(amountRegex) || []).pop() || "N/A",
            date: (text.match(dateRegex) || []).pop() || "N/A",
            fullText: text,
            receiptImageURL: cloudinaryRes.secure_url
        };

        res.status(200).json({
            message: "OCR extraction successful",
            data: extracted
        });
    } catch (error) {
        console.error("OCR Error:", error);
        res.status(500).json({ message: "Failed to extract receipt", error: error.message });
    }
}
