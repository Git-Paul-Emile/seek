const fs = require('fs');

const file = 'c:/xampp/htdocs/seek/front/src/components/layout/Navbar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /import \{ Menu, X, LogOut, User, ChevronDown \} from "lucide-react";/,
  `import { Menu, X, LogOut, User, ChevronDown, Home, Search, UserCheck, Heart, Shield, Key } from "lucide-react";`
);

content = content.replace(
  /const STATIC_NAV_LINKS = \[[\s\S]*?\];/,
  `const STATIC_NAV_LINKS = [\n  { to: "/", label: "Accueil", icon: Home },\n];`
);

content = content.replace(
  /const adminLink = \{[\s\S]*?label: "Admin",[\s\S]*?\};/,
  `const adminLink = {\n    to: isAuthenticated ? "/admin/dashboard" : "/admin/login",\n    label: "Admin",\n    icon: Shield,\n  };`
);

// Desktop navLinks map
content = content.replace(
  /\{navLinks\.map\(\(link\) => \([\s\S]*?\{link\.label\}\s*<\/Link>\s*\)\)\}/,
  `{navLinks.map((link) => {\n            const Icon = link.icon;\n            return (\n            <Link\n              key={link.to}\n              to={link.to}\n              className={\`group flex items-center text-sm font-medium transition-colors duration-200 \${\n                location.pathname === link.to\n                  ? "text-[#0C1A35] font-semibold"\n                  : "text-slate-500 hover:text-[#0C1A35]"\n              }\`}\n            >\n              <span className={\`mr-2 flex items-center justify-center w-7 h-7 rounded-full border transition-colors \${\n                location.pathname === link.to \n                  ? "bg-slate-100 border-slate-200" \n                  : "bg-slate-50 border-slate-100 group-hover:border-slate-300 group-hover:bg-slate-100"\n              }\`}>\n                <Icon className={\`w-3.5 h-3.5 transition-colors \${\n                  location.pathname === link.to ? "text-[#0C1A35]" : "text-slate-400 group-hover:text-[#0C1A35]"\n                }\`} />\n              </span>\n              {link.label}\n            </Link>\n          )})}`
);

// Desktop annonces link
content = content.replace(
  /<button\s+className=\{\`flex items-center gap-1 text-sm font-medium transition-colors duration-200 \$\{[\s\S]*?Annonces\s*<ChevronDown className="w-3\.5 h-3\.5" \/>\s*<\/button>/,
  `<button\n              className={\`group flex items-center text-sm font-medium transition-colors duration-200 \${\n                location.pathname === "/annonces"\n                  ? "text-[#0C1A35] font-semibold"\n                  : "text-slate-500 hover:text-[#0C1A35]"\n              }\`}\n            >\n              <span className={\`mr-2 flex items-center justify-center w-7 h-7 bg-slate-50 border border-slate-100 rounded-full group-hover:border-slate-300 group-hover:bg-slate-100 transition-colors \${\n                location.pathname.startsWith('/annonce') ? 'bg-slate-100 border-slate-200' : ''\n              }\`}>\n                <Search className={\`w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C1A35] \${\n                  location.pathname.startsWith('/annonce') ? 'text-[#0C1A35]' : ''\n                }\`} />\n              </span>\n              Annonces\n              <ChevronDown className="w-3.5 h-3.5 ml-1" />\n            </button>`
);

// Desktop locataire link
content = content.replace(
  /<Link\s+to=\{isLocataireAuth \? "\/locataire\/dashboard" : "\/locataire\/login"\}[\s\S]*?Espace locataire\s*<\/Link>/,
  `<Link\n              to={isLocataireAuth ? "/locataire/dashboard" : "/locataire/login"}\n              className={\`group flex items-center text-sm font-medium transition-colors duration-200 \${\n                location.pathname.startsWith("/locataire")\n                  ? "text-[#0C1A35] font-semibold"\n                  : "text-slate-500 hover:text-[#0C1A35]"\n              }\`}\n            >\n              <span className="mr-2 flex items-center justify-center w-7 h-7 bg-slate-50 border border-slate-100 rounded-full group-hover:border-slate-300 group-hover:bg-slate-100 transition-colors">\n                <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C1A35]" />\n              </span>\n              Espace locataire\n            </Link>`
);

// Desktop favoris link
content = content.replace(
  /<Link\s+to="\/favoris"\s+className=\{\`relative text-sm font-medium transition-colors duration-200[\s\S]*?<\/Link>/,
  `<Link\n            to="/favoris"\n            className={\`group relative flex items-center text-sm font-medium transition-colors duration-200 \${\n              location.pathname === "/favoris"\n                ? "text-[#0C1A35] font-semibold"\n                : "text-slate-500 hover:text-[#0C1A35]"\n            }\`}\n          >\n            <span className="mr-2 flex items-center justify-center w-7 h-7 bg-slate-50 border border-slate-100 rounded-full group-hover:border-slate-300 group-hover:bg-slate-100 transition-colors">\n              <Heart className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C1A35]" />\n            </span>\n            Favoris\n            {favCount > 0 && (\n              <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">\n                {favCount > 9 ? "9+" : favCount}\n              </span>\n            )}\n          </Link>`
);

// Desktop mon compte public
content = content.replace(
  /<Link\s+to="\/mon-compte"\s+className="text-sm font-medium flex items-center gap-1 transition-colors text-slate-600 hover:text-\[#0C1A35\]"\s*>\s*<User className="w-3\.5 h-3\.5" \/>\s*\{comptePublic\.prenom\}\s*<\/Link>/,
  `<Link\n                to="/mon-compte"\n                className="group flex items-center text-sm font-medium text-slate-600 hover:text-[#0C1A35] transition-colors"\n              >\n                <span className="mr-2 flex items-center justify-center w-7 h-7 bg-slate-50 border border-slate-100 rounded-full group-hover:border-slate-300 group-hover:bg-slate-100 transition-colors">\n                  <User className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C1A35]" />\n                </span>\n                {comptePublic.prenom}\n              </Link>`
);

// Desktop mon compte not connected
content = content.replace(
  /<button\s+onClick=\{\(\) => openModal\(\)\}\s+className="text-sm font-medium transition-colors duration-200 text-slate-500 hover:text-\[#0C1A35\]"\s*>\s*Mon compte\s*<\/button>/,
  `<button\n              onClick={() => openModal()}\n              className="group flex items-center text-sm font-medium text-slate-500 hover:text-[#0C1A35] transition-colors"\n            >\n              <span className="mr-2 flex items-center justify-center w-7 h-7 bg-slate-50 border border-slate-100 rounded-full group-hover:border-slate-300 group-hover:bg-slate-100 transition-colors">\n                <User className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0C1A35]" />\n              </span>\n              Mon compte\n            </button>`
);

// Desktop proprietaire
content = content.replace(
  /<Link\s+to=\{isOwnerAuth \? "\/owner\/dashboard" : "\/proprietaires"\}\s+className=\{\`text-sm font-medium px-4 py-1\.5 rounded-full border transition-all duration-200[\s\S]*?Espace propriétaire\s*<\/Link>/,
  `<Link\n              to={isOwnerAuth ? "/owner/dashboard" : "/proprietaires"}\n              className={\`group flex items-center text-sm font-medium px-3 py-1.5 rounded-full border transition-all duration-200 \${\n                location.pathname === "/proprietaires" || location.pathname.startsWith("/owner")\n                  ? "border-[#D4A843] text-[#D4A843] bg-[#D4A843]/10"\n                  : "border-[#0C1A35]/20 text-[#0C1A35] hover:border-[#D4A843] hover:text-[#D4A843]"\n              }\`}\n            >\n              <span className="mr-2 flex items-center justify-center w-6 h-6 bg-white border border-slate-100 rounded-full group-hover:border-slate-300 transition-colors">\n                <Key className="w-3 h-3 text-slate-400 group-hover:text-[#D4A843]" />\n              </span>\n              Espace propriétaire\n            </Link>`
);

// Mobile links mapping
content = content.replace(
  /\{navLinks\.map\(\(link\) => \([\s\S]*?\{link\.label\}\s*<\/Link>\s*\)\)\}/,
  `{navLinks.map((link) => {\n                const Icon = link.icon;\n                return (\n                <Link\n                  key={link.to}\n                  to={link.to}\n                  onClick={() => setOpen(false)}\n                  className={\`flex items-center text-sm font-medium py-2.5 px-3 rounded-xl transition-colors \${\n                    location.pathname === link.to\n                      ? "text-[#D4A843] bg-white/5"\n                      : "text-white/65 hover:text-white hover:bg-white/5"\n                  }\`}\n                >\n                  <Icon className="w-4 h-4 mr-2" />\n                  {link.label}\n                </Link>\n              )})}`
);

// Mobile annonces
content = content.replace(
  /<button\s+onClick=\{\(\) => setMobileAnnoncesOpen\(\(v\) => !v\)\}\s+className=\{\`flex items-center justify-between text-sm font-medium py-2\.5 px-3 rounded-xl transition-colors w-full[\s\S]*?Annonces\s*<ChevronDown[\s\S]*?<\/button>/,
  `<button\n                onClick={() => setMobileAnnoncesOpen((v) => !v)}\n                className={\`flex items-center text-sm font-medium py-2.5 px-3 rounded-xl transition-colors w-full \${\n                  location.pathname === "/annonces"\n                    ? "text-[#D4A843] bg-white/5"\n                    : "text-white/65 hover:text-white hover:bg-white/5"\n                }\`}\n              >\n                <div className="flex items-center">\n                  <Search className="w-4 h-4 mr-2" />\n                  Annonces\n                </div>\n                <ChevronDown className={\`w-4 h-4 ml-auto transition-transform \${mobileAnnoncesOpen ? "rotate-180" : ""}\`} />\n              </button>`
);

// Mobile locataire
content = content.replace(
  /<Link\s+to=\{isLocataireAuth \? "\/locataire\/dashboard" : "\/locataire\/login"\}[\s\S]*?Espace locataire\s*<\/Link>/,
  `<Link\n                  to={isLocataireAuth ? "/locataire/dashboard" : "/locataire/login"}\n                  onClick={() => setOpen(false)}\n                  className={\`flex items-center text-sm font-medium py-2.5 px-3 rounded-xl transition-colors \${\n                    location.pathname.startsWith("/locataire")\n                      ? "text-[#D4A843] bg-white/5"\n                      : "text-white/65 hover:text-white hover:bg-white/5"\n                  }\`}\n                >\n                  <UserCheck className="w-4 h-4 mr-2" />\n                  Espace locataire\n                </Link>`
);

// Mobile favoris
content = content.replace(
  /<Link\s+to="\/favoris"\s+onClick=\{\(\) => setOpen\(false\)\}\s+className=\{\`text-sm font-medium py-2\.5 px-3 rounded-xl transition-colors flex items-center justify-between[\s\S]*?<\/Link>/,
  `<Link\n                to="/favoris"\n                onClick={() => setOpen(false)}\n                className={\`text-sm font-medium py-2.5 px-3 rounded-xl transition-colors flex items-center justify-between \${\n                  location.pathname === "/favoris"\n                    ? "text-[#D4A843] bg-white/5"\n                    : "text-white/65 hover:text-white hover:bg-white/5"\n                }\`}\n              >\n                <div className="flex items-center">\n                  <Heart className="w-4 h-4 mr-2" />\n                  Favoris\n                </div>\n                {favCount > 0 && (\n                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">\n                    {favCount > 9 ? "9+" : favCount}\n                  </span>\n                )}\n              </Link>`
);

// Mobile proprietaire
content = content.replace(
  /<Link\s+to=\{isOwnerAuth \? "\/owner\/dashboard" : "\/proprietaires"\}[\s\S]*?Espace propriétaire\s*<\/Link>/,
  `<Link\n                  to={isOwnerAuth ? "/owner/dashboard" : "/proprietaires"}\n                  onClick={() => setOpen(false)}\n                  className={\`flex items-center text-sm font-medium py-2.5 px-3 rounded-xl transition-colors \${\n                    location.pathname === "/proprietaires" || location.pathname.startsWith("/owner")\n                      ? "text-[#D4A843] bg-white/5"\n                      : "text-[#D4A843]/70 hover:text-[#D4A843] hover:bg-white/5"\n                  }\`}\n                >\n                  <Key className="w-4 h-4 mr-2" />\n                  Espace propriétaire\n                </Link>`
);


fs.writeFileSync(file, content, 'utf8');
console.log('Update complete');
