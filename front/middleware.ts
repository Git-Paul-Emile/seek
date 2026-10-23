// Vercel Edge Middleware — détecte les crawlers sociaux et sert les balises OG
export const config = { matcher: ["/annonce/:id*"] };

const BOT_UA = [
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "linkedinbot",
  "whatsapp",
  "telegrambot",
  "slackbot",
  "discordbot",
  "pinterest",
];

export default function middleware(req: Request): Response | undefined {
  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();
  const isBot = BOT_UA.some((b) => ua.includes(b));

  if (isBot) {
    const url = new URL(req.url);
    const match = url.pathname.match(/^\/annonce\/([^/]+)$/);
    if (match) {
      const ogUrl = new URL(`/api/og/${match[1]}`, url.origin);
      return Response.redirect(ogUrl.toString(), 302);
    }
  }

  return undefined; // laisse passer les vraies requêtes
}
