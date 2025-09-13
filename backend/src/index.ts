import dotenv from 'dotenv'
dotenv.config( { path: "../.env" } )

import express, { Request, Response, Application } from 'express'

const app: Application = express();

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.get("/api/", (req: Request, res: Response) => {
    res.status(200).send("Hello from TypeScript backend!")
})

app.listen(process.env.BACKEND_PORT || 3000, () => {
    console.log(`Server started on port ${process.env.BACKEND_PORT || 3000}`);
})