import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as TypeTransactionController from "../controllers/typeTransaction.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createTypeTransactionSchema,
  updateTypeTransactionSchema,
} from "../validators/typeTransaction.validator.js";

const router = Router();

/** GET /api/types-transaction - public : types actifs */
router.get("/", controllerWrapper(TypeTransactionController.getAll));

/** GET /api/types-transaction/admin - admin : tous les types */
router.get("/admin", authenticate, controllerWrapper(TypeTransactionController.getAllAdmin));

/** POST /api/types-transaction - admin */
router.post(
  "/",
  authenticate,
  validate(createTypeTransactionSchema),
  controllerWrapper(TypeTransactionController.create)
);

/** PUT /api/types-transaction/:id - admin */
router.put(
  "/:id",
  authenticate,
  validate(updateTypeTransactionSchema),
  controllerWrapper(TypeTransactionController.update)
);

/** DELETE /api/types-transaction/:id - admin */
router.delete("/:id", authenticate, controllerWrapper(TypeTransactionController.remove));

export default router;
