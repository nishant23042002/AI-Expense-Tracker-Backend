import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config();

export const protectedRoute = (req, res, next) => {
    // Check if the request has an Authorization header with a Bearer token
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not authorized, no token" })
    }

    const token = req.headers.authorization.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        req.user = {
            id: decoded.userId,
            role: decoded.role
        };
        // Pass control to the next middleware or route handler
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
}