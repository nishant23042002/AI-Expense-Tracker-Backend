import express from "express"
import cors from "cors"
import { connectDB } from "./database/connectDB.js";
import userRoutes from "./routes/userRoute.route.js"
import incomeRoutes from "./routes/incomeRoute.route.js"
import expenseRoutes from "./routes/expenseRoute.route.js"
import dashboardRoutes from "./routes/dashboardRoute.route.js"
import cookieParser from "cookie-parser";
import dotenv from "dotenv"

dotenv.config();

const app = express();

app.use(cors({
    origin: 'https://ai-expense-tracker-rp4b.onrender.com', // Frontend domain in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // If you're sending cookies, tokens etc.
}));

app.use(express.json());
app.use(cookieParser());
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



const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/api/v1`);
}).on('error', (err) => {
    console.error("Server failed to start:", err.message);
});
