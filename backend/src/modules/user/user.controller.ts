import {type Request, type Response} from "express";
import {db} from "../../db/db";
import {users} from "../../db/schema";
import {eq} from "drizzle-orm";

export const getUserHandler = async(req: Request, res: Response) => {
    const userId = req.userId
    if (!userId) {
        res.status(412).send({error: "request userId missing"})
        return
    }
    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) {
        res.status(400).send({"error": "User not found"})
        return
    }

    // remove password and id from response
    const { password, id, ...safeUser } = user;
    res.status(200).send({"user": safeUser})
    return
}