import express, {type NextFunction, type Request, type Response} from "express";
import {deletionHandler, loginHandler, logoutHandler, registerHandler} from "./auth.controller";
import {requireAuth} from "../../middleware/auth.middleware";


const authRouter  = express.Router()

authRouter.post("/register", registerHandler)
authRouter.post("/login", loginHandler)

// Routes after this requires authentication
authRouter.use(requireAuth)

authRouter.all("/logout", logoutHandler)
authRouter.all("/delete", deletionHandler)



export default authRouter;