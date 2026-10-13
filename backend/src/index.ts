import dotenv from 'dotenv'
dotenv.config( { path: "../.env" } )

import express, { Request, Response, Application } from 'express'
import {runMigrations} from "./db/db";
import authRoutes from "./modules/auth/auth.routes";
import {errorHandler} from "./middleware/error.middleware";
import userRoutes from "./modules/user/user.routes";
import cookieParser from "cookie-parser";

const app: Application = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(errorHandler)
app.use(cookieParser())

app.get("/api/", (req: Request, res: Response) => {
    res.status(200).send("Hello from TypeScript backend!")
})

app.use("/api/auth", authRoutes)
app.use("/api/user", userRoutes)

app.listen(3000, async () => {
    await runMigrations();
    console.log(`Running in ${process.env.NODE_ENV ?? "production"} mode`)
    console.log(`Server started on port 3000}`);
})