import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGO_URI}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log(`MongoDB connected DB: ${connection.connection.host}`);

    }
    catch (error) {
        console.error("Error connecting MongoDB: ", error)
        process.exit(1);
    }
}
