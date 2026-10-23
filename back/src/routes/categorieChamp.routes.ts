import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as Ctrl from "../controllers/categorieChamp.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/",       authenticate, controllerWrapper(Ctrl.getAll));
router.post("/",      authenticate, controllerWrapper(Ctrl.create));
router.put("/:id",    authenticate, controllerWrapper(Ctrl.update));
router.delete("/:id", authenticate, controllerWrapper(Ctrl.remove));

export default router;
