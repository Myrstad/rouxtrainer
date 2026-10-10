import express, {type NextFunction, type Request, type Response} from "express";
import {users} from "../db/schema";
import {db} from "../db/db";
import argon2 from "argon2";
import {eq} from "drizzle-orm";


const authRouter  = express.Router()

authRouter.post("/register", async (req: Request, res: Response) => {
    const { username, password, email, display_name } = req.body;
    console.log(req.body)
    if (!username || !password || !display_name) {
        res.status(400).send({"error": "Username, password, and display name is required"})
        return
    }

    try {
        let hashedPassword = await argon2.hash(password)
        const user = await db.insert(users).values({
            user_name: username,
            password: hashedPassword,
            display_name: display_name,
            email: email ?? null,
        }).returning()
        console.log(user, "inputted into db")
    } catch (e) {
        res.status(500).send({"error": "internal server error"})
        return
    }

    res.status(200).send("User created!")
})

authRouter.post("/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    console.log(req.body, username, password);
    if (!username || !password) {
        res.status(400).send({"error": "Username, password, and display name is required"})
        return
    }

    // get user
    const result = await db.select().from(users).where(eq(users.user_name, username))
    if (!result) {
        res.status(400).send({"error": "User not found"})
        return
    }

    // validate password
    const validated = await argon2.verify(result[0].password, password)
    if (validated) console.log(`${username} is validated`)
    else res.status(404).send({"error": "Password incorrect"})


    // send user credentials / cookie
    res.status(200).send("User successfully logged in!")
})

// Middleware only runs on routes _after_ /register and /login
authRouter.use((_req: Request, _res: Response, next: NextFunction) => {
    console.log("ALL AUTH ROUTES EXPECT register")
    next()
})



export default authRouter;