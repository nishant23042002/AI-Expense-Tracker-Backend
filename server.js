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
const allowedOrigins = [
    "https://ai-expense-tracker-rp4b.onrender.com",
    "http://localhost:5174/"

];

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
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
