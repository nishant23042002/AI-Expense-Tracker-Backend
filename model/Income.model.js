import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    source: {
        type: String,
        required: true,
    },
    icon: {
        type: String
    },
    amount: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        enum: [
            "Salary",
            "Freelance",
            "Investments",
            "Rental Income",
            "Business",
            "Pension",
            "Scholarship",
            "Gifts & Donations",
            "Royalties",
            "Interest",
            "Refunds",
            "Other"
        ],
        default: "Other",
    },
    receivedDate: {
        type: Date,
        default: Date.now,
    },
    notes: String,
    isAICategorized: {
        type: Boolean,
        default: false,
    },
    aiCategorySuggestion: String,
    aiRecommendation: String,
    inputMethod: {
        type: String,
        default: "manual"
    },
}, { timestamps: true });

const Income = mongoose.model("Income", incomeSchema);

export default Income;