const DEFAULT_DEV_FRONTEND_URL = "http://localhost:5173";
const DEFAULT_PROD_FRONTEND_URL = "https://seek-front-plum.vercel.app";

const normalizeUrl = (value: string): string => value.replace(/\/+$/, "");

const isLocalhostUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return ["localhost", "127.0.0.1"].includes(parsed.hostname);
  } catch {
    return false;
  }
};

const unique = (values: string[]): string[] => Array.from(new Set(values));

export const getFrontendBaseUrl = (): string => {
  const envCandidates =
    process.env.NODE_ENV === "production"
      ? [process.env.FRONTEND_URL, process.env.FRONT_URL_PROD, process.env.FRONT_URL]
      : [process.env.FRONTEND_URL, process.env.FRONT_URL, process.env.FRONT_URL_PROD];

  const normalizedCandidates = envCandidates
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => normalizeUrl(value.trim()));

  if (process.env.NODE_ENV === "production") {
    const publicCandidate = normalizedCandidates.find((value) => !isLocalhostUrl(value));
    return publicCandidate ?? DEFAULT_PROD_FRONTEND_URL;
  }

  return normalizedCandidates[0] ?? DEFAULT_DEV_FRONTEND_URL;
};

export const getAllowedFrontendOrigins = (): string[] =>
  unique([
    getFrontendBaseUrl(),
    ...[
      process.env.FRONTEND_URL,
      process.env.FRONT_URL,
      process.env.FRONT_URL_PROD,
      DEFAULT_PROD_FRONTEND_URL,
      DEFAULT_DEV_FRONTEND_URL,
      "http://127.0.0.1:5173",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => normalizeUrl(value.trim())),
  ]);
