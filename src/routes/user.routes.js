import { Router } from "express";
import { logOutUser, loginUser, refreshAccesstoken, registerUser } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:10
        },
        {
            name: "coverImage",
            maxCount:10
        }
    ]),
    registerUser
    )
router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccesstoken)






export default router