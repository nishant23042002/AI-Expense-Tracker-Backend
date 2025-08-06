import Income from "../model/Income.model.js"
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const addIncome = async (req, res) => {
    try {
        let userId = req.user.id;
        const { source, amount, receivedDate } = req.body;
        let aiCategorySuggestion = "";
        let aiRecommendation = "";
        let iconSuggestion = ""

        const newIncome = await Income.create({
            userId,
            source,
            amount,
            receivedDate
        });
        // Step 2: Respond immediately
        res.status(201).json({
            message: "Income added successfully.",
            data: newIncome,
        });

        setImmediate(async () => {
            try {
                // Run all AI calls in parallel
                const [categoryRes, recommendationRes, emojiRes, noteRes] = await Promise.all([
                    // 1. Category
                    openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "user",
                                content: `Classify the income source: "${source}" into ONE category from:
                                Salary, Freelance, Investments, Rental Income, Business, Pension, Scholarship,
                                Gifts & Donations, Royalties, Interest, Refunds, Other.
                                Respond with ONLY the category name, no extra words.`
                            }
                        ]
                    }),

                    // 2. Recommendation
                    openai.chat.completions.create({
                        model: "chatgpt-4o-latest",
                        messages: [
                            {
                                role: "user",
                                content: `You received ₹${amount} from "${source}".
                                Give 1 practical budgeting or saving tip related to this type of income.
                                Keep it under 2-3 sentenced, direct, and useful.`
                            }
                        ]
                    }),

                    // 3. Icon
                    openai.chat.completions.create({
                        model: "chatgpt-4o-latest",
                        messages: [
                            {
                                role: "user",
                                content: `Suggest 1 relevant emoji for the income source "${source}".
                                Rules:
                                - Only one emoji (no text, no multiple emojis)
                                - Must represent the source naturally.
                                Examples:
                                  "Freelance design" -> 🎨
                                  "Salary" -> 💼
                                  "Stock dividends" -> 📈`
                            }
                        ]
                    }),

                    // 4. Notes
                    openai.chat.completions.create({
                        model: "chatgpt-4o-latest",
                        messages: [
                            {
                                role: "system",
                                content: `You are a personal finance assistant helping users write natural income notes in first person. 
                                        The tone should be personal and informal, like something the user typed for themselves. 
                                        Mention the income type/source, amount, and date naturally in 1–2 short sentences. Avoid using 'you' or giving instructions.`
                            },
                            {
                                role: "user",
                                content: `Income Source: ${source}
                                        Amount: ₹${amount}
                                        Date: ${receivedDate}
                                        Write a short personal-style note (1–2 sentences) summarizing this income entry as if the user typed it.`
                            }

                        ]
                    })
                ]);

                // Extract AI results
                const aiCategorySuggestion = categoryRes.choices[0].message.content.trim();
                const aiRecommendation = recommendationRes.choices[0].message.content.trim();
                const iconSuggestion = emojiRes.choices[0].message.content.trim();
                const notes = noteRes.choices[0].message.content.trim();

                // Step 4: Update the expense with AI-generated fields
                await Income.findByIdAndUpdate(newIncome._id, {
                    category: aiCategorySuggestion,
                    icon: iconSuggestion,
                    notes: notes,
                    aiRecommendation,
                    isAICategorized: true,
                });
            } catch (error) {
                console.error("AI enrichment failed:", error.message);
            }
        })
    } catch (err) {
        res.status(500).json({
            message: "Failed to Add Income",
            error: err.message,
        });
    }
};


export const deleteIncome = async (req, res) => {
    let { id } = req.params;
    try {
        const deleteIncomeById = await Income.findByIdAndDelete(id)
        res.status(200).json({ message: "Income Deleted Successfully.", deletedIncome: deleteIncomeById })
    } catch (error) {
        res.status(500).json({ error: error.message, message: "Something went wrong" })
    }
}

export const editIncome = async (req, res) => {
    const { id } = req.params;
    const { source, amount, receivedDate, category, icon, notes } = req.body;

    try {
        // Find the existing income first
        const existingIncome = await Income.findById(id);
        if (!existingIncome) {
            return res.status(404).json({
                message: "Income not found. Update failed.",
            });
        }

        // Build update object
        const updateFields = {};
        if (source) updateFields.source = source;
        if (amount) updateFields.amount = amount;
        if (receivedDate) updateFields.receivedDate = receivedDate;
        if (icon) updateFields.icon = icon;
        if (category) updateFields.category = category;
        if (notes) updateFields.notes = notes;

        let runAIUpdate = false;

        // Check if AI fields should be updated (source or amount changed)
        if ((source && source !== existingIncome.source) || (amount && amount !== existingIncome.amount)) {
            runAIUpdate = true;
        }

        // Update basic fields first
        let updatedIncome = await Income.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true }
        );

        // If source or amount changed → regenerate AI suggestions
        if (runAIUpdate) {
            try {
                const [categoryRes, recommendationRes, emojiRes, noteRes] = await Promise.all([
                    // 1. Category
                    openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "user",
                                content: `Classify the income source: "${updatedIncome.source}" into ONE category from:
                                Salary, Freelance, Investments, Rental Income, Business, Pension, Scholarship,
                                Gifts & Donations, Royalties, Interest, Refunds, Other.
                                Respond with ONLY the category name, no extra words.`
                            }
                        ]
                    }),

                    // 2. Recommendation
                    openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "user",
                                content: `You received ₹${updatedIncome.amount} from "${updatedIncome.source}".
                                Give 1 practical budgeting or saving tip related to this type of income.
                                Keep it under 20 words, direct, and useful.`
                            }
                        ]
                    }),

                    // 3. Icon
                    openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "user",
                                content: `Suggest 1 relevant emoji for the income source "${updatedIncome.source}".
                                Rules:
                                - Only one emoji (no text, no multiple emojis)
                                - Must represent the source naturally.
                                Examples:
                                  "Freelance design" -> 🎨
                                  "Salary" -> 💼
                                  "Stock dividends" -> 📈`
                            }
                        ]
                    }),

                    // 4. Notes
                    openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "system",
                                content: `You are an assistant that writes short, natural income notes.
                                Mention what it was for, amount, and date in a friendly tone.
                                Keep under 20 words.`
                            },
                            {
                                role: "user",
                                content: `Title: "${updatedIncome.source}"
                                            Amount: ₹${updatedIncome.amount}
                                            Date: ${updatedIncome.receivedDate}
                                            Write one natural sentence summarizing this income.`
                            }
                        ]
                    })
                ]);

                // Extract AI results
                const aiCategorySuggestion = categoryRes.choices[0].message.content.trim();
                const aiRecommendation = recommendationRes.choices[0].message.content.trim();
                const iconSuggestion = emojiRes.choices[0].message.content.trim();
                const notesAI = noteRes.choices[0].message.content.trim();

                updatedIncome = await Income.findByIdAndUpdate(
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
                ? "Income updated successfully with AI-enhanced details."
                : "Income updated successfully.",
            updatedIncome,
        });

    } catch (error) {
        res.status(500).json({
            error: error.message,
            message: "Something went wrong while updating income.",
        });
    }
};



export const editUserIncome = async (req, res) => {

}



export const getAllIncome = async (req, res) => {
    let userId = req.user.id;
    try {
        const allIncomeOfUser = await Income.find({ userId }).sort({ receivedDate: -1 })
        res.status(200).json({ message: "All Added Income of the user", Incomes: allIncomeOfUser })
    } catch (err) {
        res.status(500).json({ error: err.message, message: "Something went wrong" })
    }
}