import dotenv from 'dotenv'
dotenv.config( { path: "../.env" } )

import express, { Request, Response, Application } from 'express'
import {db, runMigrations, testDb} from "./db/db";

const app: Application = express();

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.get("/api/", (req: Request, res: Response) => {
    res.status(200).send("Hello from TypeScript backend!")
})


app.listen(3000, async () => {
    await runMigrations();
    console.log(`Server started on port 3000}`);
})