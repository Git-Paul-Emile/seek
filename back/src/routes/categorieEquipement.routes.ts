import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as Controller from "../controllers/categorieEquipement.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createCategorieEquipementSchema,
  updateCategorieEquipementSchema,
} from "../validators/categorieEquipement.validator.js";

const router = Router();

router.get("/",       controllerWrapper(Controller.getActive));
router.get("/admin",  authenticate, controllerWrapper(Controller.getAll));
router.post("/",      authenticate, validate(createCategorieEquipementSchema), controllerWrapper(Controller.create));
router.put("/:id",    authenticate, validate(updateCategorieEquipementSchema),  controllerWrapper(Controller.update));
router.delete("/:id", authenticate, controllerWrapper(Controller.remove));

export default router;
