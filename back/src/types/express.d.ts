declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: unknown;
      };
      owner?: {
        id: string;
        prenom: string;
        nom: string;
      };
      locataire?: {
        id: string;
        nom: string;
        prenom: string;
      };
      admin?: {
        id: string;
        email: string;
      };
    }
  }
}

export {};
