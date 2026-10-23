import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";

/**
 * Middleware de validation générique avec Zod
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = {
        ...req.body,
        ...req.params,
        ...req.query,
      };

      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        // Formater les erreurs Zod
        const errors = result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        throw new AppError(
          `Validation échouée: ${errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
          StatusCodes.BAD_REQUEST
        );
      }

      // Remplacer les données validées si présentes
      const parsedData: any = (result as any).data;
      if (parsedData && parsedData.body) {
        req.body = parsedData.body;
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware pour capturer les erreurs de validation
 */
export const validationErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Erreur de validation",
      errors,
    });
    return;
  }

  next(err);
};

/**
 * Middleware pour valider les paramètres d'ID
 */
export const validateId = (paramName: string = "id") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const idRaw = req.params[paramName];
    const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
    
    if (!id) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Paramètre ${paramName} requis`,
      });
      return;
    }

    // UUID regex simple
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(id)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Format de ${paramName} invalide`,
      });
      return;
    }

    next();
  };
};
