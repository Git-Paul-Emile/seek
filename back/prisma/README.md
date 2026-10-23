Fichier	Rôle
src/api/auth.ts	Appels API (login, refresh, logout, me)
src/context/AuthContext.tsx	State global + refresh silencieux au montage
src/pages/admin/Login.tsx	Formulaire de connexion
src/components/admin/ProtectedRoute.tsx	Guard de route React
src/pages/admin/Dashboard.tsx	Page dashboard (placeholder)
src/App.tsx	Routes /admin/login + /admin/dashboar



Fichier	Rôle
prisma/schema.prisma	Modèles Admin + RefreshToken
src/repositories/auth.repository.ts	Accès BDD (find, create, revoke tokens)
src/services/auth.service.ts	Logique métier isolée (login, refresh, logout, verify)
src/controllers/auth.controller.ts	Handlers HTTP + gestion cookies
src/routes/auth.routes.ts	Router /api/auth/* avec rate limiting
src/middlewares/auth.middleware.ts	Guard JWT (authenticate)
src/validators/auth.validator.ts	Schéma Zod login
src/config/app.ts	Enregistrement du router auth
prisma/seed.ts	Admin par défaut admin@seek.sn / Admin@2024!
