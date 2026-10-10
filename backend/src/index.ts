import dotenv from 'dotenv'
dotenv.config( { path: "../.env" } )

import express, { Request, Response, Application } from 'express'
import {runMigrations} from "./db/db";
import authRoutes from "./routes/authRoutes";

const app: Application = express();

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.get("/api/", (req: Request, res: Response) => {
    res.status(200).send("Hello from TypeScript backend!")
})

app.use("/api/auth", authRoutes)


app.listen(3000, async () => {
    await runMigrations();
    console.log(`Server started on port 3000}`);
})