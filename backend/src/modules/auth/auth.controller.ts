import {type Request, type Response} from "express";
import argon2 from "argon2";
import {db} from "../../db/db";
import {sessions, users} from "../../db/schema";
import {eq} from "drizzle-orm";

export const registerHandler = async (req: Request, res: Response) => {
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

    res.status(200).send({status: "User successfully created!"})
}

export const loginHandler = async (req: Request, res: Response) => {
    const { username, password, canRefresh } = req.body;
    console.log(req.body, username, password, canRefresh);
    if (!username || !password) {
        res.status(400).send({"error": "Username and password is required"})
        return
    }

    // get user
    const [user] = await db.select().from(users).where(eq(users.user_name, username))
    if (!user) {
        res.status(400).send({"error": "User not found"})
        return
    }

    // validate password
    const validated = await argon2.verify(user.password, password)
    if (validated) console.log(`${username} is validated`)
    else res.status(401).send({"error": "Password incorrect"})



    // send user credentials / cookie
    const sessionId = crypto.randomUUID()
    const userId = user.id
    let expiresAt = new Date().getTime() // current time in milliseconds
    if (canRefresh) expiresAt += 7 * 24 * 60 * 60 * 1000 // 24 hours = 7 days, 24 hours, 60 minutes, 60 seconds, 1000ms
    else expiresAt += 24 * 60 * 60 * 1000 // 24 hours = 24 hours, 60 minutes, 60 seconds, 1000ms

    const sessionInsert = {
        id: sessionId,
        user_id: userId,
        can_refresh: canRefresh ?? false,
        expires_at: new Date(expiresAt),
        user_agent: req.headers["user-agent"] ?? null,
    }

    const [session] = await db.insert(sessions).values(sessionInsert).returning()
    if (!session) {
        res.status(500).send({"error": "failed creating session"})
    }

    res.cookie('id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(expiresAt),
        path: '/',
    });

    res.cookie('logged_in', true);

    console.log("User successfully logged in")
    res.status(200).send({status: "User successfully logged in!"})
}

export const logoutHandler = async (req: Request, res: Response) => {
    const userId = req.userId
    if (!userId) {
        res.status(412).send({error: "request userId missing"})
        return
    }

    const [session] = await db.select().from(sessions).where(eq(sessions.user_id, userId));
    if (session) {
        await db.delete(sessions).where(eq(sessions.user_id, userId));
        res.cookie('logged_in', false);
        res.clearCookie('id')
    }

    res.status(200).send({status: "User logged out"})
}

export const deletionHandler = async (req: Request, res: Response) => {
    const userId = req.userId
    const { password } = req.body;
    if (!userId) {
        res.status(412).send({error: "request userId missing"})
        return
    }
    if (!password) {
        res.status(412).send({error: "password missing"})
        return
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
        res.status(400).send({"error": "userId missing"})
        return
    }

    // ensure password is correct
    const validated = await argon2.verify(user.password, password)
    if (!validated) {
        res.status(401).send({"error": "Password incorrect"})
        return
    }

    // ensure session is valid
    const [session] = await db.select().from(sessions).where(eq(sessions.user_id, userId));
    if (!session) {
        res.status(400).send({"error": "session invalid"})
    } else {
        await db.delete(sessions).where(eq(sessions.user_id, userId));
        res.cookie('logged_in', false);
        res.clearCookie('id')
    }

    const [deleted] = await db.delete(users).where(eq(users.id, session.user_id)).returning();
    if (!deleted) {
        res.status(400).send({error: "user not deleted. but logged out!"})
        return
    }

    res.status(200).send({status: "User successfully deleted!"})
}