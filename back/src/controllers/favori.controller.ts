import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { jsonResponse } from "../utils/responseApi.js";
import * as FavoriService from "../services/favori.service.js";

// GET /api/public/favoris
export const list = async (req: Request, res: Response) => {
  const comptePublicId = req.comptePublic!.id;
  const favoris = await FavoriService.getFavoris(comptePublicId);
  res.json(jsonResponse({ status: "success", message: "Favoris", data: favoris }));
};

// GET /api/public/favoris/ids
export const ids = async (req: Request, res: Response) => {
  const comptePublicId = req.comptePublic!.id;
  const bienIds = await FavoriService.getFavoriIds(comptePublicId);
  res.json(jsonResponse({ status: "success", message: "IDs favoris", data: bienIds }));
};

// POST /api/public/favoris/:bienId/toggle
export const toggle = async (req: Request, res: Response) => {
  const comptePublicId = req.comptePublic!.id;
  const bienId = req.params["bienId"] as string;
  const result = await FavoriService.toggleFavori(comptePublicId, bienId);
  res.json(jsonResponse({
    status: "success",
    message: result.action === "added" ? "Ajouté aux favoris" : "Retiré des favoris",
    data: result,
  }));
};

// DELETE /api/public/favoris/:bienId
export const remove = async (req: Request, res: Response) => {
  const comptePublicId = req.comptePublic!.id;
  const bienId = req.params["bienId"] as string;
  await FavoriService.removeFavori(comptePublicId, bienId);
  res.status(StatusCodes.NO_CONTENT).end();
};
