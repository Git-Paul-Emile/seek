import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as EquipementController from "../controllers/equipement.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createEquipementsSchema, updateEquipementSchema } from "../validators/equipement.validator.js";

const router = Router();

router.get("/",       controllerWrapper(EquipementController.getAll));
router.get("/admin",  authenticate, controllerWrapper(EquipementController.getAllAdmin));
router.post("/",      authenticate, validate(createEquipementsSchema), controllerWrapper(EquipementController.createMany));
router.put("/:id",    authenticate, validate(updateEquipementSchema),  controllerWrapper(EquipementController.update));
router.delete("/:id", authenticate, controllerWrapper(EquipementController.remove));

export default router;
