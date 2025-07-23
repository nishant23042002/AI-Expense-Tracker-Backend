import mongoose from "mongoose";

const setGoalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    durationMonths: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    targetDate: { type: Date, required: true },
    aiTipForSaving: {
        type: String,
        default: ""
    },
    isCompleted: { type: Boolean, default: false },
})

const SetGoal = mongoose.model("SetGoal", setGoalSchema);
export default SetGoal;