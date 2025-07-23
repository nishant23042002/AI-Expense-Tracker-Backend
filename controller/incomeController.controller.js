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
        const { source, amount } = req.body;
        let aiCategorySuggestion = "";
        let aiRecommendation = "";
        let iconSuggestion = ""

        const aiResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: `Classify the income source: "${source}" into one of the following categories: Salary, Freelance, Investments, Rental Income, Business, Pension, Scholarship, Gifts & Donations, Royalties, Interest, Refunds, or Other.Return only one of these exact category names.`,
                },
            ],
        });
        console.log("aiCategory: ", aiResponse);
        aiCategorySuggestion = aiResponse.choices[0].message.content.trim();

        const recommendationResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: `You received ₹${amount} from "${source}". Give one smart budgeting or saving tip. Keep it shorter but informative and useful.`,
                },
            ],
        });
        console.log("savingRecommendation: ", recommendationResponse)
        aiRecommendation = recommendationResponse.choices[0].message.content.trim();

        const iconSuggestionForCategory = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: `You are an intelligent finance assistant.
                            Suggest an appropriate single emoji to represent the following income source:
                            "${source}"
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
                            Now, give a suitable emoji for: "${source}"`,
                },
            ],
        });

        iconSuggestion = iconSuggestionForCategory.choices[0].message.content.trim();
        console.log("iconSuggestion based on category :", iconSuggestion);

        const newIncome = await Income.create({
            source,
            amount,
            userId,
            icon: iconSuggestion,
            category: aiCategorySuggestion,
            isAICategorized: true,
            aiCategorySuggestion,
            aiRecommendation
        });

        res.status(201).json(newIncome);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


export const deleteIncome = async (req, res) => {
    try {
        let { id } = req.params;
        const deleteIncomeById = await Income.findByIdAndDelete(id)
        res.status(200).json({ message: "Income Deleted Successfully.", deletedIncome: deleteIncomeById })
    } catch (error) {
        res.status(500).json({ error: error.message, message: "Something went wrong" })
    }
}

export const downloadIncome = async (req, res) => {
    try {
        let { id, role } = req.user;
        console.log("Requested by user:", id);

        let allIncome;
        if (role === "admin") {
            // Admins get everything
            allIncome = await Income.find();
        } else {
            // Normal users get only their own
            allIncome = await Income.find({ userId: id });
        }

        if (allIncome.length === 0) {
            return res.status(404).json({ message: "No income data found." });
        }
        res.status(200).json({ message: "All income: ", incomes: allIncome })
    } catch (error) {
        res.status(500).json({ error: error.message, message: "Something went wrong" })
    }
}


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