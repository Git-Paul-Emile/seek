import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { jsonResponse } from "../utils/responseApi.js";
import * as SuspensionService from "../services/suspension.service.js";
import * as SuspensionRepo from "../repositories/suspension.repository.js";

// ─── Validation DTO ───────────────────────────────────────────────────────────

interface SuspensionBody {
  motif: string;
  masquerAnnonces?: boolean;
}

interface ReactiverBody {
  afficherAnnonces?: boolean;
}

interface ListQuery {
  estSuspendu?: string;
  search?: string;
}

// ─── Liste des propriétaires ─────────────────────────────────────────────────

export const getProprietaires = async (req: Request, res: Response): Promise<void> => {
  const { estSuspendu, search } = req.query as ListQuery;

  const filter: {
    estSuspendu?: boolean;
    search?: string;
  } = {};

  if (estSuspendu !== undefined) {
    filter.estSuspendu = estSuspendu === "true";
  }

  if (search) {
    filter.search = search;
  }

  try {
    const proprietaires = await SuspensionService.getProprietaires(filter);

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Liste des propriétaires récupérée",
        data: proprietaires,
      })
    );
  } catch (error) {
    const status =
      error instanceof Error ? (error as any).statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

// ─── Détails d'un propriétaire ───────────────────────────────────────────────

export const getProprietaireById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "error", message: "ID du propriétaire requis" })
    );
    return;
  }

  try {
    const proprietaire = await SuspensionService.getProprietaireById(id);

    if (!proprietaire) {
      res.status(StatusCodes.NOT_FOUND).json(
        jsonResponse({ status: "error", message: "Propriétaire introuvable" })
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Détails du propriétaire récupérés",
        data: proprietaire,
      })
    );
  } catch (error) {
    const status =
      error instanceof Error ? (error as any).statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

// ─── Liste des locataires ───────────────────────────────────────────────────

export const getLocataires = async (req: Request, res: Response): Promise<void> => {
  const { estSuspendu, search } = req.query as ListQuery;

  const filter: {
    estSuspendu?: boolean;
    search?: string;
  } = {};

  if (estSuspendu !== undefined) {
    filter.estSuspendu = estSuspendu === "true";
  }

  if (search) {
    filter.search = search;
  }

  try {
    const locataires = await SuspensionService.getLocataires(filter);

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Liste des locataires récupérée",
        data: locataires,
      })
    );
  } catch (error) {
    const status =
      error instanceof Error ? (error as any).statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

// ─── Détails d'un locataire ─────────────────────────────────────────────────

export const getLocataireById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "error", message: "ID du locataire requis" })
    );
    return;
  }

  try {
    const locataire = await SuspensionService.getLocataireById(id);

    if (!locataire) {
      res.status(StatusCodes.NOT_FOUND).json(
        jsonResponse({ status: "error", message: "Locataire introuvable" })
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Détails du locataire récupérés",
        data: locataire,
      })
    );
  } catch (error) {
    const status =
      error instanceof Error ? (error as any).statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

// ─── Admin : locataire avec documents de vérification ────────────────────────

function buildVerificationDocuments(v: NonNullable<NonNullable<Awaited<ReturnType<typeof SuspensionRepo.getLocataireAvecDocuments>>>["verification"]>) {
  const docs: { id: string; type: string; url: string; statut: string; createdAt: Date }[] = [];
  if (v.pieceIdentiteRecto) {
    docs.push({ id: `${v.id}-recto`, type: v.typePiece === "PASSEPORT" ? "PASSEPORT" : "CNI_RECTO", url: v.pieceIdentiteRecto, statut: v.statut, createdAt: v.createdAt });
  }
  if (v.pieceIdentiteVerso) {
    docs.push({ id: `${v.id}-verso`, type: "CNI_VERSO", url: v.pieceIdentiteVerso, statut: v.statut, createdAt: v.createdAt });
  }
  if (v.selfie) {
    docs.push({ id: `${v.id}-selfie`, type: "SELFIE", url: v.selfie, statut: v.statut, createdAt: v.createdAt });
  }
  return docs;
}

export const getLocataireAvecDocuments = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const locataire = await SuspensionRepo.getLocataireAvecDocuments(id);
  if (!locataire) {
    res.status(StatusCodes.NOT_FOUND).json(jsonResponse({ status: "not_found", message: "Locataire introuvable" }));
    return;
  }

  const data = {
    ...locataire,
    verification: locataire.verification
      ? {
          id: locataire.verification.id,
          statut: locataire.verification.statut,
          typePiece: locataire.verification.typePiece,
          motifRejet: locataire.verification.motifRejet ?? null,
          verifiedAt: locataire.verification.dateTraitement?.toISOString() ?? null,
          documents: buildVerificationDocuments(locataire.verification),
        }
      : null,
  };

  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Locataire récupéré", data }));
};

// ─── Supprimer un propriétaire ───────────────────────────────────────────────

export const supprimerProprietaire = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "error", message: "ID du propriétaire requis" })
    );
    return;
  }

  try {
    await SuspensionService.supprimerProprietaire(id);

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Propriétaire supprimé avec succès",
      })
    );
  } catch (error) {
    const status =
      error instanceof Error ? (error as any).statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

// ─── Supprimer un locataire ─────────────────────────────────────────────────

export const supprimerLocataire = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "error", message: "ID du locataire requis" })
    );
    return;
  }

  try {
    await SuspensionService.supprimerLocataire(id);

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Locataire supprimé avec succès",
      })
    );
  } catch (error) {
    const status =
      error instanceof Error ? (error as any).statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

// ─── Détails d'un propriétaire avec ses biens ───────────────────────────────

export const getProprietaireWithBiens = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "error", message: "ID du propriétaire requis" })
    );
    return;
  }

  try {
    const proprietaire = await SuspensionService.getProprietaireWithBiens(id);

    if (!proprietaire) {
      res.status(StatusCodes.NOT_FOUND).json(
        jsonResponse({ status: "error", message: "Propriétaire introuvable" })
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Détails du propriétaire récupérés",
        data: proprietaire,
      })
    );
  } catch (error) {
    const status =
      (error as any)?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    console.error("Erreur getProprietaireWithBiens:", error);
    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

// ─── Détails d'un locataire avec ses baux ─────────────────────────────────────

export const getLocataireWithBails = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "error", message: "ID du locataire requis" })
    );
    return;
  }

  try {
    const locataire = await SuspensionService.getLocataireWithBails(id);

    if (!locataire) {
      res.status(StatusCodes.NOT_FOUND).json(
        jsonResponse({ status: "error", message: "Locataire introuvable" })
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Détails du locataire récupérés",
        data: locataire,
      })
    );
  } catch (error) {
    const status =
      (error as any)?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    console.error("Erreur getLocataireWithBails:", error);
    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

// ─── Propriétaire ─────────────────────────────────────────────────────────────

export const suspendreProprietaire = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { motif, masquerAnnonces = true } = req.body as SuspensionBody;
  const adminId = req.admin?.id;

  if (!adminId) {
    res.status(StatusCodes.UNAUTHORIZED).json(
      jsonResponse({ status: "unauthorized", message: "Admin non identifié" })
    );
    return;
  }

  if (!motif || motif.trim().length === 0) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "error", message: "Le motif de suspension est requis" })
    );
    return;
  }

  try {
    const result = await SuspensionService.suspendreProprietaire(
      id,
      { motif, masquerAnnonces },
      adminId,
      masquerAnnonces
    );

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Propriétaire suspendu avec succès",
        data: result,
      })
    );
  } catch (error) {
    const status =
      error instanceof Error ? (error as any).statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

export const reactiverProprietaire = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { afficherAnnonces = true } = req.body as ReactiverBody;

  try {
    const result = await SuspensionService.reactiverProprietaire(id, afficherAnnonces);

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Propriétaire réactivé avec succès",
        data: result,
      })
    );
  } catch (error) {
    const status =
      error instanceof Error ? (error as any).statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

export const getStatutSuspensionProprietaire = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "error", message: "ID du propriétaire requis" })
    );
    return;
  }

  try {
    const result = await SuspensionService.getStatutSuspensionProprietaire(id);

    if (!result) {
      res.status(StatusCodes.NOT_FOUND).json(
        jsonResponse({ status: "error", message: "Propriétaire introuvable" })
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Statut de suspension récupéré",
        data: result,
      })
    );
  } catch (error) {
    const status =
      error instanceof Error ? (error as any).statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

// ─── Locataire ─────────────────────────────────────────────────────────────────

export const suspendreLocataire = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { motif } = req.body as SuspensionBody;
  const adminId = req.admin?.id;

  if (!adminId) {
    res.status(StatusCodes.UNAUTHORIZED).json(
      jsonResponse({ status: "unauthorized", message: "Admin non identifié" })
    );
    return;
  }

  if (!motif || motif.trim().length === 0) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "error", message: "Le motif de suspension est requis" })
    );
    return;
  }

  try {
    const result = await SuspensionService.suspendreLocataire(
      id,
      { motif },
      adminId
    );

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Locataire suspendu avec succès",
        data: result,
      })
    );
  } catch (error) {
    const status =
      error instanceof Error ? (error as any).statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

export const reactiverLocataire = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "error", message: "ID du locataire requis" })
    );
    return;
  }

  try {
    const result = await SuspensionService.reactiverLocataire(id);

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Locataire réactivé avec succès",
        data: result,
      })
    );
  } catch (error) {
    const status =
      error instanceof Error ? (error as any).statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};

export const getStatutSuspensionLocataire = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  if (!id) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "error", message: "ID du locataire requis" })
    );
    return;
  }

  try {
    const result = await SuspensionService.getStatutSuspensionLocataire(id);

    if (!result) {
      res.status(StatusCodes.NOT_FOUND).json(
        jsonResponse({ status: "error", message: "Locataire introuvable" })
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Statut de suspension récupéré",
        data: result,
      })
    );
  } catch (error) {
    const status =
      error instanceof Error ? (error as any).statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : "Erreur serveur";

    res.status(status).json(jsonResponse({ status: "error", message }));
  }
};
