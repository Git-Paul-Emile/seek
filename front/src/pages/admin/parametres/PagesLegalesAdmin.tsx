import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ExternalLink, Loader2, Lock, Pencil, ScrollText, Shield, type LucideIcon } from "lucide-react";
import { fetchAllPagesLegalesAdmin, upsertPageLegale, type PageLegale } from "@/api/pageLegale";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/textarea";
import { BlocChargement, EnTeteAdmin } from "@/components/admin/table/Tableau";
import { messageErreurApi } from "@/lib/erreurApi";

// Pages légales (Configuration · Pages légales) : une carte par page, modification du HTML en
// fenêtre large avec un aperçu rendu comme sur le site public.

const QK = ["pages-legales-admin"];

const PAGE_META: Record<string, { icon: LucideIcon; path: string; description: string }> = {
  "politique-confidentialite": {
    icon: Lock,
    path: "/politique-confidentialite",
    description: "Données personnelles, loi n° 2008-12 et CDP Sénégal.",
  },
  "conditions-utilisation": {
    icon: ScrollText,
    path: "/conditions-utilisation",
    description: "Règles d'utilisation, lois n° 2008-10 et 2008-11.",
  },
  "conformite-donnees": {
    icon: Shield,
    path: "/conformite-donnees",
    description: "Conformité CDP, transferts internationaux, mesures de sécurité.",
  },
};

interface SaisiePage {
  titre: string;
  contenu: string;
  version: string;
  publie: boolean;
}

function FormulairePage({ page, onClose }: { page: PageLegale; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SaisiePage>({ titre: page.titre, contenu: page.contenu, version: page.version ?? "", publie: page.publie });
  const [erreurs, setErreurs] = useState<{ titre?: string; contenu?: string }>({});

  const enregistrement = useMutation({
    mutationFn: (data: SaisiePage) => upsertPageLegale(page.slug, data),
    onSuccess: () => {
      toast.success("Page enregistrée. Elle est à jour sur le site.");
      queryClient.invalidateQueries({ queryKey: QK });
      onClose();
    },
    onError: (error) => toast.error(messageErreurApi(error, "La page n'a pas pu être enregistrée. Réessayez.")),
  });

  const enregistrer = (event: FormEvent) => {
    event.preventDefault();
    const nouvelles = {
      titre: form.titre.trim() ? undefined : "Indiquez le titre de la page.",
      contenu: form.contenu.trim() ? undefined : "Le contenu ne peut pas être vide.",
    };
    setErreurs(nouvelles);
    if (nouvelles.titre || nouvelles.contenu) return;
    enregistrement.mutate(form);
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && !enregistrement.isPending && onClose()} title={`Modifier : ${page.titre}`} className="sm:max-w-4xl">
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
          <FormField label="Titre de la page" error={erreurs.titre}>
            <Input value={form.titre} onChange={(event) => setForm((f) => ({ ...f, titre: event.target.value }))} />
          </FormField>
          <FormField label="Version" hint="Facultatif">
            <Input value={form.version} placeholder="1.0" onChange={(event) => setForm((f) => ({ ...f, version: event.target.value }))} />
          </FormField>
        </div>
        <FormField label="Contenu HTML" help="Le HTML est affiché tel quel sur la page publique." error={erreurs.contenu}>
          <Textarea rows={16} className="font-mono text-ref" value={form.contenu} onChange={(event) => setForm((f) => ({ ...f, contenu: event.target.value }))} />
        </FormField>
        <section aria-label="Aperçu">
          <h3 className="mb-2 text-overline font-semibold uppercase text-texte2">Aperçu</h3>
          {/* Même rendu que la page publique : le HTML vient de l'administration. */}
          <div className="max-h-72 overflow-y-auto rounded-control border border-filet bg-surface p-5 text-body-m text-encre" dangerouslySetInnerHTML={{ __html: form.contenu }} />
        </section>
        <Switch label="Visible sur le site" checked={form.publie} onChange={(publie) => setForm((f) => ({ ...f, publie }))} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={enregistrement.isPending}>
            Annuler
          </Button>
          <Button type="submit" disabled={enregistrement.isPending}>
            {enregistrement.isPending && <Loader2 aria-hidden className="animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </SheetDialog>
  );
}

export default function PagesLegalesAdmin() {
  const [enEdition, setEnEdition] = useState<PageLegale | null>(null);
  const { data: pages = [], isLoading } = useQuery({ queryKey: QK, queryFn: fetchAllPagesLegalesAdmin });

  return (
    <div className="space-y-6">
      <EnTeteAdmin
        titre="Pages légales"
        description="Le contenu des pages légales publiques, conforme au droit sénégalais. Chaque enregistrement est visible tout de suite sur le site."
      />

      {isLoading ? (
        <BlocChargement label="Chargement des pages" />
      ) : (
        <ul className="grid gap-4">
          {pages.map((page) => {
            const meta = PAGE_META[page.slug];
            const Icone = meta?.icon ?? ScrollText;
            return (
              <li key={page.slug} className="grid gap-4 rounded-card border border-filet bg-white p-5 sm:grid-cols-[auto_1fr_auto] sm:items-start">
                <span className="flex size-12 items-center justify-center rounded-control bg-baobab-100 text-baobab">
                  <Icone aria-hidden className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-h3 font-bold text-encre">{page.titre}</h2>
                    {page.version && <span className="font-mono text-ref text-texte2">v{page.version}</span>}
                  </div>
                  {meta && <p className="mt-1 text-body-m text-texte2">{meta.description}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {page.publie ? <StatusBadge tone="positif" size="sm">Publiée</StatusBadge> : <StatusBadge tone="neutre" size="sm">Masquée</StatusBadge>}
                    <span className="text-caption text-texte2">
                      {page.updatedAt ? `Mise à jour le ${format(new Date(page.updatedAt), "d MMMM yyyy", { locale: fr })}` : "Jamais enregistrée"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {meta && (
                    <a
                      href={meta.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Voir ${page.titre} sur le site, dans un nouvel onglet`}
                      className={buttonVariants({ size: "icon-sm", variant: "outline" })}
                    >
                      <ExternalLink aria-hidden />
                    </a>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setEnEdition(page)}>
                    <Pencil aria-hidden />
                    Modifier
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {enEdition && <FormulairePage key={enEdition.slug} page={enEdition} onClose={() => setEnEdition(null)} />}
    </div>
  );
}
