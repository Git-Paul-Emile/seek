import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as MeubleController from "../controllers/meuble.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createMeublesSchema, updateMeubleSchema } from "../validators/meuble.validator.js";

const router = Router();

router.get("/",       controllerWrapper(MeubleController.getAll));
router.get("/admin",  authenticate, controllerWrapper(MeubleController.getAllAdmin));
router.post("/",      authenticate, validate(createMeublesSchema), controllerWrapper(MeubleController.createMany));
router.put("/:id",    authenticate, validate(updateMeubleSchema),  controllerWrapper(MeubleController.update));
router.delete("/:id", authenticate, controllerWrapper(MeubleController.remove));

export default router;
