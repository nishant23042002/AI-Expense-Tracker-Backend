import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    title: {
        type: String,
        required: true,
    },

    icon: {
        type: String,
    },

    amount: {
        type: Number,
        required: true,
    },

    category: {
        type: String,
        enum: [
            "Food & Dining",
            "Transportation",
            "Housing",
            "Utilities",
            "Insurance",
            "Medical & Healthcare",
            "Entertainment",
            "Shopping",
            "Debt",
            "Education",
            "Travel",
            "Gifts & Donations",
            "Subscriptions",
            "Taxes",
            "Other"
        ],
        default: "Other",
    },

    spentDate: {
        type: Date,
        default: Date.now,
    },

    notes: String,

    // AI enhancements
    aiCategorySuggestion: String,
    icon: {
        type: String,
        default: "Generating Icon"
    },
    aiRecommendation: String,
    isAICategorized: {
        type: Boolean,
        default: false,
    },

    inputMethod: {
        type: String,
        enum: ["manual", "ocr", "voice", "bank_import", "other"],
        default: "manual",
    },

    receiptImage: {
        type: String, // Cloudinary URL if OCR-based input
    },

}, { timestamps: true });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
