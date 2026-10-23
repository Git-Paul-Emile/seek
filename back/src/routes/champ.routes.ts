import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as Ctrl from "../controllers/champ.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/",       controllerWrapper(Ctrl.getAll));
router.get("/admin",  authenticate, controllerWrapper(Ctrl.getAllAdmin));
router.post("/",      authenticate, controllerWrapper(Ctrl.create));
router.put("/:id",    authenticate, controllerWrapper(Ctrl.update));
router.delete("/:id", authenticate, controllerWrapper(Ctrl.remove));

export default router;
