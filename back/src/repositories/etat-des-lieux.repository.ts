import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";

type EtatDesLieuxCreateInput = {
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
  type: "ENTREE" | "SORTIE";
  nbCles?: number;
  pieces: {
    nom: string;
    elements: {
      nom: string;
      etat: "NEUF" | "BON" | "USAGE" | "MAUVAIS" | "DEGRADE";
      commentaire?: string;
      photos?: string[];
    }[];
  }[];
};

export const create = async (data: EtatDesLieuxCreateInput) => {
  return prisma.etatDesLieux.create({
    data: {
      bailId: data.bailId,
      bienId: data.bienId,
      proprietaireId: data.proprietaireId,
      locataireId: data.locataireId,
      type: data.type,
      nbCles: data.nbCles,
      pieces: {
        create: data.pieces.map((piece) => ({
          nom: piece.nom,
          elements: {
            create: piece.elements.map((element) => ({
              nom: element.nom,
              etat: element.etat as any,
              commentaire: element.commentaire,
              photos: element.photos || [],
            })),
          },
        })),
      },
    },
    include: {
      pieces: {
        include: {
          elements: true,
        },
      },
    },
  });
};

export const findById = async (id: string) => {
  return prisma.etatDesLieux.findUnique({
    where: { id },
    include: {
      pieces: {
        include: {
          elements: true,
        },
      },
      bail: true,
      bien: true,
      proprietaire: true,
      locataire: true,
    },
  });
};

export const findByBailAndType = async (bailId: string, type: "ENTREE" | "SORTIE") => {
  return prisma.etatDesLieux.findUnique({
    where: {
      bailId_type: {
        bailId,
        type,
      },
    },
    include: {
      pieces: {
        include: {
          elements: true,
        },
      },
      bien: true,
    },
  });
};

export const findAllByBail = async (bailId: string) => {
  return prisma.etatDesLieux.findMany({
    where: { bailId },
    include: {
      pieces: {
        include: { elements: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const updateStatus = async (
  id: string,
  statut: "BROUILLON" | "EN_ATTENTE_VALIDATION" | "VALIDE" | "CONTESTE" | "EN_LITIGE",
  documentPdf?: string
) => {
  return prisma.etatDesLieux.update({
    where: { id },
    data: {
      statut: statut as any,
      ...(statut === "VALIDE" ? { dateValidation: new Date() } : {}),
      ...(documentPdf ? { documentPdf } : {}),
    },
  });
};

export const updateBrouillon = async (id: string, data: Partial<EtatDesLieuxCreateInput>) => {
  return prisma.$transaction(async (tx) => {
    if (data.pieces && data.pieces.length > 0) {
      await tx.pieceEtatDesLieux.deleteMany({
        where: { etatDesLieuxId: id },
      });
    }

    return tx.etatDesLieux.update({
      where: { id },
      data: {
        nbCles: data.nbCles,
        ...(data.pieces && data.pieces.length > 0
          ? {
              pieces: {
                create: data.pieces.map((piece) => ({
                  nom: piece.nom,
                  elements: {
                    create: piece.elements.map((element) => ({
                      nom: element.nom,
                      etat: element.etat as any,
                      commentaire: element.commentaire,
                      photos: element.photos || [],
                    })),
                  },
                })),
              },
            }
          : {}),
      },
      include: {
        pieces: {
          include: { elements: true },
        },
      },
    });
  });
};

export const deleteById = async (id: string) => {
  return prisma.etatDesLieux.delete({ where: { id } });
};

export const findAllByLocataire = async (locataireId: string) => {
  return prisma.etatDesLieux.findMany({
    where: { locataireId },
    include: {
      pieces: { include: { elements: true } },
      bien: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const contesterElements = async (id: string, elements: { elementId: string; motifContestation: string; photoContestation: string }[]) => {
  return prisma.$transaction(async (tx) => {
    // Put EDL in CONTESTE
    await tx.etatDesLieux.update({
      where: { id },
      data: { statut: "CONTESTE" as any }
    });

    // Update each element
    for (const el of elements) {
      await tx.elementEtatDesLieux.update({
        where: { id: el.elementId },
        data: {
          estConteste: true,
          motifContestation: el.motifContestation,
          photoContestation: el.photoContestation,
          statutContestation: "EN_ATTENTE" as any
        } as any
      });
    }

    return tx.etatDesLieux.findUnique({
      where: { id },
      include: {
        pieces: { include: { elements: true } },
        bail: true,
        bien: true,
        proprietaire: true,
        locataire: true,
      }
    });
  });
};

export const resoudreContestations = async (id: string, resolutions: {
  elementId: string;
  decision: "RECTIFIER" | "ACCEPTER_RESERVE" | "REFUSER";
  etat?: "NEUF" | "BON" | "USAGE" | "MAUVAIS" | "DEGRADE";
  commentaire?: string;
  photos?: string[];
}[]) => {
  return prisma.$transaction(async (tx) => {
    let hasRefus = false;

    for (const res of resolutions) {
      if (res.decision === "REFUSER") {
        hasRefus = true;
        await tx.elementEtatDesLieux.update({
          where: { id: res.elementId },
          data: { statutContestation: "REFUSE" as any } as any
        });
      } else if (res.decision === "ACCEPTER_RESERVE") {
        await tx.elementEtatDesLieux.update({
          where: { id: res.elementId },
          data: { statutContestation: "RESERVE" as any } as any
        });
      } else if (res.decision === "RECTIFIER") {
        await tx.elementEtatDesLieux.update({
          where: { id: res.elementId },
          data: {
            statutContestation: "RECTIFIE" as any,
            etat: res.etat as any,
            commentaire: res.commentaire,
            photos: res.photos
          } as any
        });
      }
    }

    // Determine the new status
    const allPieces = await tx.pieceEtatDesLieux.findMany({
      where: { etatDesLieuxId: id },
      include: { elements: true }
    });
    
    let allElements: any[] = [];
    allPieces.forEach(p => allElements = allElements.concat(p.elements));
    
    // Check if any element is still EN_ATTENTE
    const pendingContestations = allElements.filter(e => e.estConteste && e.statutContestation === "EN_ATTENTE");
    
    if (!hasRefus && allElements.some(e => e.statutContestation === "REFUSE")) {
      hasRefus = true;
    }

    let finalStatus: any = "CONTESTE";
    if (hasRefus) {
      finalStatus = "EN_LITIGE";
    } else if (pendingContestations.length === 0) {
      finalStatus = "EN_ATTENTE_VALIDATION";
    }

    const updatedEdl = await tx.etatDesLieux.update({
      where: { id },
      data: { statut: finalStatus },
      include: {
        pieces: { include: { elements: true } },
        bail: true,
        bien: true,
        proprietaire: true,
        locataire: true,
      }
    });

    return updatedEdl;
  });
};
