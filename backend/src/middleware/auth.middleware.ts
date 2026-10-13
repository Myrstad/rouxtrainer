import { type Request, type Response, type NextFunction } from 'express';
import {db} from "../db/db";
import { sessions } from "../db/schema";
import {eq} from "drizzle-orm";

declare global {
    namespace Express {
        interface Request {
            userId?: number;
        }
    }
}

export const requireAuth = async(req: Request, res: Response, next: NextFunction) => {
    // request must have id cookie
    const sessionId = req.cookies.id;
    if (!sessionId) {
        res.status(401).json({error: "Unauthorized: not logged in"});
        return
    }

    // get session: if expired log out and delete entry
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session || session.expires_at < new Date()) {
        res.clearCookie('id', { path: '/' });
        res.cookie('logged_in', false);

        if (session) {
            await db.delete(sessions).where(eq(sessions.id, sessionId));
        }

        res.status(401).json({ error: 'Unauthorized: session expired or invalid' });
        return
    }

    const DAY_MS = 24 * 60 * 60 * 1000; // hours, minutes, seconds, ms
    const next_day = new Date( new Date().getTime() + DAY_MS );
    if (session.can_refresh && (session.expires_at < next_day)) {
        const inAWeek = new Date (new Date().getTime() + DAY_MS * 7);
        await db.update(sessions).set({expires_at: inAWeek}).where(eq(sessions.id, session.id));
    }

    // everything went fine, go to next function!
    req.userId = session.user_id;
    return next()
}