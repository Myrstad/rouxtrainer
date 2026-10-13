import express, {type NextFunction, type Request, type Response} from "express";
import {requireAuth} from "../../middleware/auth.middleware";
import {getUserHandler} from "./user.controller";

const userRouter  = express.Router();

userRouter.use(requireAuth)

userRouter.get("/", getUserHandler)

export default userRouter;