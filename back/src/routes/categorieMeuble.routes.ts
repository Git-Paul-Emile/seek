import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as Controller from "../controllers/categorieMeuble.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createCategorieMeubleSchema,
  updateCategorieMeubleSchema,
} from "../validators/categorieMeuble.validator.js";

const router = Router();

router.get("/",       controllerWrapper(Controller.getActive));
router.get("/admin",  authenticate, controllerWrapper(Controller.getAll));
router.post("/",      authenticate, validate(createCategorieMeubleSchema), controllerWrapper(Controller.create));
router.put("/:id",    authenticate, validate(updateCategorieMeubleSchema),  controllerWrapper(Controller.update));
router.delete("/:id", authenticate, controllerWrapper(Controller.remove));

export default router;
