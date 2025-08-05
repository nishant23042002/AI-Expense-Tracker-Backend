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
            icon: "🔄",
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
                            content: `You are an assistant that writes short, clear, and friendly expense notes for personal finance records.
                                        Your job is to:
                                        - Summarize the expense in **one natural-sounding sentence**.
                                        - Mention what it was for, how much was spent, and when.
                                        - Avoid repeating the title or category exactly unless necessary.
                                        - Use plain, everyday language (like a quick journal note).
                                        - Keep it relevant and under 20 words.`
                        },
                        {
                            role: "user",
                            content: `
                                        Create a one-sentence expense note with these details:
                                        - Title: "${title}"
                                        - Amount: ₹${amount}
                                        - Category: "${aiCategorySuggestion}"
                                        - Spent Date: ${spentDate}

                                        Format:
                                        <Sentence describing the expense naturally>"

                                        Example:
                                        "Bought groceries for the week on 5th Aug for ₹2,500.
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

export const editExpense = async (req, res) => {
    const { id } = req.params;
    const { title, amount, spentDate, icon, category, notes } = req.body;

    try {
        // Find the existing expense first
        const existingExpense = await Expense.findById(id);
        if (!existingExpense) {
            return res.status(404).json({
                message: "Expense not found. Update failed.",
            });
        }

        // Build update object
        const updateFields = {};
        if (title) updateFields.title = title;
        if (amount) updateFields.amount = amount;
        if (spentDate) updateFields.spentDate = spentDate;
        if (icon) updateFields.icon = icon;
        if (category) updateFields.category = category;
        if (notes) updateFields.notes = notes;

        let runAIUpdate = false;

        // Check if AI fields should be updated (title or amount changed)
        if ((title && title !== existingExpense.title) || (amount && amount !== existingExpense.amount)) {
            runAIUpdate = true;
        }

        // Update basic fields first
        let updatedExpense = await Expense.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true }
        );

        // If title or amount changed → regenerate AI suggestions
        if (runAIUpdate) {
            try {
                const aiCategory = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "user",
                            content: `Classify the expense source: "${updatedExpense.title}" into one of the following categories: 
                                        "Food & Dining", "Transportation", "Housing", "Utilities", "Insurance",
                                        "Medical & Healthcare", "Entertainment", "Shopping", "Debt", "Education",
                                        "Travel", "Gifts & Donations", "Subscriptions", "Taxes", "Other". 
                                        Return only a single category name.`,
                        },
                    ],
                });
                const aiCategorySuggestion = aiCategory.choices[0].message.content.trim();

                const aiIcon = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "user",
                            content: `You are an intelligent finance assistant.
                            Suggest an appropriate single emoji to represent the following expense:
                            "${updatedExpense.title}"
                            - Single emoji only
                            - No text or multiple emojis
                            - Relevant to the expense`,
                        },
                    ],
                });
                const iconSuggestion = aiIcon.choices[0].message.content.trim();

                const aiTip = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are a helpful assistant that gives short, practical money-saving tips."
                        },
                        {
                            role: "user",
                            content: `The user spent ₹${updatedExpense.amount} on "${updatedExpense.title}". Give one short actionable tip to reduce this type of expense.`
                        },
                    ],
                });
                const aiRecommendation = aiTip.choices[0].message.content.trim();

                const noteSuggestion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: `You are an assistant that writes short, clear expense notes.
                                        - Mention what it was for, how much was spent, and when.
                                        - Keep it under 20 words.`
                        },
                        {
                            role: "user",
                            content: `Create a one-sentence expense note:
                                        Title: "${updatedExpense.title}"
                                        Amount: ₹${updatedExpense.amount}
                                        Category: "${aiCategorySuggestion}"
                                        Spent Date: ${updatedExpense.spentDate}`
                        }
                    ]
                });
                const notesAI = noteSuggestion.choices[0].message.content.trim();

                updatedExpense = await Expense.findByIdAndUpdate(
                    id,
                    {
                        $set: {
                            category: aiCategorySuggestion,
                            icon: iconSuggestion,
                            aiRecommendation,
                            notes: notesAI,
                            isAICategorized: true,
                        },
                    },
                    { new: true }
                );
            } catch (error) {
                console.error("AI update failed:", error.message);
            }
        }

        res.status(200).json({
            message: runAIUpdate
                ? "Expense updated successfully with AI-enhanced details."
                : "Expense updated successfully.",
            updatedExpense,
        });

    } catch (error) {
        res.status(500).json({
            error: error.message,
            message: "Something went wrong while updating expense.",
        });
    }
};


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
