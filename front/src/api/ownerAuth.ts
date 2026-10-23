import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const ownerAuthApi = axios.create({
  baseURL: `${API_URL}/api/owner/auth`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// API pour la vérification d'identité (route différente)
const verificationApi = axios.create({
  baseURL: `${API_URL}/api/owner`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// API pour l'upload de fichiers
const uploadApi = axios.create({
  baseURL: `${API_URL}/api/owner`,
  withCredentials: true,
  headers: { "Content-Type": "multipart/form-data" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  prenom: string;
  nom: string;
  sexe: string;      // "" | "homme" | "femme"
  telephone: string;
  email: string;     // "" si non renseigné
  password: string;
}

export interface LoginPayload {
  identifiant: string;  // email ou téléphone
  password: string;
}

export interface OwnerInfo {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email?: string;
  sexe?: string;
  telephoneVerifie?: boolean;
  statutVerification: "NOT_VERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  verifiedAt?: string | null;
  estSuspendu?: boolean;
  dateFinSuspension?: string | null;
}

export interface VerificationStatus {
  proprietaireId: string;
  statut: "NOT_VERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  verifiedAt: string | null;
  documents?: {
    typePiece: string;
    pieceIdentiteRecto: string | null;
    pieceIdentiteVerso: string | null;
    selfie: string | null;
    conditionsAcceptees: boolean;
    motifRejet?: string | null;
    traitePar?: string | null;
    dateTraitement?: string | null;
  };
}

export interface SubmitVerificationPayload {
  typePiece: string;
  pieceIdentiteRecto: string;
  pieceIdentiteVerso?: string;
  selfie: string;
  conditionsAcceptees: boolean;
}

// ─── Requêtes ─────────────────────────────────────────────────────────────────

export const registerOwnerApi = (payload: RegisterPayload) =>
  ownerAuthApi.post<{ status: string; message: string; data: OwnerInfo }>(
    "/register",
    payload
  );

export const loginOwnerApi = (payload: LoginPayload) =>
  ownerAuthApi.post<{ status: string; message: string; data: OwnerInfo }>(
    "/login",
    payload
  );

export const refreshOwnerApi = () =>
  ownerAuthApi.post<{ status: string; message: string }>("/refresh");

export const logoutOwnerApi = () =>
  ownerAuthApi.post<{ status: string; message: string }>("/logout");

export const meOwnerApi = () =>
  ownerAuthApi.get<{ status: string; message: string; data: OwnerInfo }>("/me");

export interface UpdateProfilePayload {
  prenom?: string;
  nom?: string;
  sexe?: string;
  telephone?: string;
  email?: string;
  password?: string;
}

export const updateProfileApi = (payload: UpdateProfilePayload) =>
  ownerAuthApi.put<{ status: string; message: string; data: OwnerInfo }>(
    "/profile",
    payload
  );

export const deleteProfileApi = () =>
  ownerAuthApi.delete<{ status: string; message: string }>("/profile");

export const verifyOwnerPhoneApi = (otp: string) =>
  ownerAuthApi.post<{ status: string; message: string; data: OwnerInfo }>("/verifier-telephone", { otp });

export const resendOwnerOtpApi = () =>
  ownerAuthApi.post<{ status: string; message: string }>("/renvoyer-otp");

export const verifyOwnerPhonePublicApi = (payload: { proprietaireId: string; otp: string }) =>
  ownerAuthApi.post<{ status: string; message: string; data: OwnerInfo }>("/verifier-telephone-public", payload);

export const resendOwnerOtpPublicApi = (proprietaireId: string) =>
  ownerAuthApi.post<{ status: string; message: string }>("/renvoyer-otp-public", { proprietaireId });

// ─── Vérification d'identité ───────────────────────────────────────────────

export const getVerificationStatusApi = () =>
  verificationApi.get<{ status: string; data: VerificationStatus }>("/verification");

export const submitVerificationApi = (payload: SubmitVerificationPayload) =>
  verificationApi.post<{ status: string; message: string; data: VerificationStatus }>(
    "/verification",
    payload
  );

export const cancelVerificationApi = () =>
  verificationApi.delete<{ status: string; message: string; data: VerificationStatus }>(
    "/verification"
  );

export interface OwnerTrustScore {
  total: number;
  details: {
    base: number;
    identiteVerifiee: number;
    annoncesPubliees: number;
    anciennete: number;
    bailsActifs: number;
  };
  badges: ("identite_verifiee" | "anciennete_1an")[];
  nbAnnonces: number;
  nbBailsActifs: number;
  moisAnciennete: number;
}

export const getOwnScoreApi = () =>
  verificationApi.get<{ status: string; data: { score: OwnerTrustScore } }>("/score");

export const forgotPasswordApi = (identifiant: string) =>
  ownerAuthApi.post<{ status: string; message: string }>("/forgot-password", { identifiant });

export const resetPasswordApi = (token: string, password: string) =>
  ownerAuthApi.post<{ status: string; message: string }>("/reset-password", { token, password });

// ─── Messages bail owner ──────────────────────────────────────────────────────

export interface MessageBail {
  id: string;
  bailId?: string | null;
  bienId?: string | null;
  titre: string;
  corps: string;
  type: string;
  lu: boolean;
  createdAt: string;
}

export const getMessagesBailOwnerApi = async (): Promise<MessageBail[]> => {
  const { data } = await ownerAuthApi.get<{ data: MessageBail[] }>("/messages-bail");
  return data.data;
};

export const marquerMessagesBailOwnerLusApi = async (): Promise<void> => {
  await ownerAuthApi.post("/messages-bail/lus");
};

export interface BienSansEdlItem {
  id: string;
  bienId: string;
  locataireId: string;
  dateDebutBail: string;
  bien: {
    titre: string | null;
    ville: string | null;
    region: string | null;
  };
  locataire: {
    prenom: string;
    nom: string;
  };
}

export interface BiensSansEdlData {
  count: number;
  items: BienSansEdlItem[];
}

export const getBiensSansEdlApi = async (): Promise<BiensSansEdlData> => {
  const { data } = await ownerAuthApi.get<{ data: BiensSansEdlData }>("/edl-manquants");
  return data.data;
};

// Upload d'une image de vérification vers Cloudinary
export const uploadVerificationImageApi = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  
  const response = await uploadApi.post<{ status: string; data: { url: string; publicId: string } }>(
    "/verification/upload",
    formData
  );
  
  return response.data.data.url;
};

// ─── Admin API pour la vérification ───────────────────────────────────────

const adminApi = axios.create({
  baseURL: `${API_URL}/api/admin`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export interface PendingVerification {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  statutVerification: "NOT_VERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  verification: {
    id: string;
    typePiece: string;
    pieceIdentiteRecto: string | null;
    pieceIdentiteVerso: string | null;
    selfie: string | null;
    conditionsAcceptees: boolean;
    motifRejet: string | null;
    traitePar: string | null;
    dateTraitement: string | null;
    createdAt: string;
  } | null;
}

export const getPendingVerificationsApi = () =>
  adminApi.get<{ status: string; data: PendingVerification[] }>("/verifications");

export const approveVerificationApi = (proprietaireId: string) =>
  adminApi.post<{ status: string; message: string }>(`/verifications/${proprietaireId}/approve`);

export const rejectVerificationApi = (proprietaireId: string, motif: string) =>
  adminApi.post<{ status: string; message: string }>(`/verifications/${proprietaireId}/reject`, { motif });

export const getPendingVerificationsCountApi = () =>
  adminApi.get<{ status: string; data: { count: number } }>("/verifications/count");
