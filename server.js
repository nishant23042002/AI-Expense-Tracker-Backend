import express from "express"
import cors from "cors"
import { connectDB } from "./database/connectDB.js";
import userRoutes from "./routes/userRoute.route.js"
import incomeRoutes from "./routes/incomeRoute.route.js"
import expenseRoutes from "./routes/expenseRoute.route.js"
import dashboardRoutes from "./routes/dashboardRoute.route.js"
import setGoalRoutes from "./routes/setGoalRoute.route.js"
import dotenv from "dotenv"

dotenv.config();

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

connectDB();

app.get("/api/v1", (req, res) => {
    res.send("AI Expense Tracker")
})
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/goal", setGoalRoutes);


const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/api/v1`);
}).on('error', (err) => {
    console.error("Server failed to start:", err.message);
});
