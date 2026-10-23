import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { creerAlerte } from "@/api/alerte";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";
import { useCreerAlerteCompte } from "@/hooks/useAlerte";
import { useLieux } from "@/hooks/useRecherche";
import { useTypeLogements } from "@/hooks/useTypeLogements";
import { formatNumeroSenegal, numeroInternational } from "@/lib/telephone";

const LIEU_SEPARATOR = "|";
const MESSAGE_NUMERO = "Numéro incomplet : saisissez 9 chiffres après +221.";
const MESSAGE_ECHEC = "L'alerte n'a pas été créée. Vérifiez votre connexion, puis réessayez.";

/** Formulaire « Soyez prévenu par SMS » : numéro, type et quartier. */
export function useAlerteSmsForm() {
  const { compte, isAuthenticated } = useComptePublicAuth();
  const { data: types = [] } = useTypeLogements();
  const { data: lieux } = useLieux();
  const creerAlerteCompte = useCreerAlerteCompte();

  const [telephone, setTelephone] = useState("");
  const [typeLogement, setTypeLogement] = useState("");
  const [quartier, setQuartier] = useState("");
  const [erreurTelephone, setErreurTelephone] = useState<string | null>(null);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && compte?.telephone) setTelephone(formatNumeroSenegal(compte.telephone));
  }, [isAuthenticated, compte?.telephone]);

  // Un même nom de quartier existe dans plusieurs villes : la valeur est "quartier|ville".
  const [quartierNom, quartierVille] = quartier ? quartier.split(LIEU_SEPARATOR) : [];

  const mutation = useMutation({
    mutationFn: async (numero: string) => {
      const criteres = {
        typeLogement: typeLogement || undefined,
        quartier: quartierNom || undefined,
        ville: quartierVille || undefined,
        canalPrefere: "SMS" as const,
      };
      if (isAuthenticated) return creerAlerteCompte.mutateAsync(criteres);
      return creerAlerte({ telephone: numero, ...criteres });
    },
    onError: () => setErreurEnvoi(MESSAGE_ECHEC),
  });

  const verifierTelephone = () => {
    const valide = numeroInternational(telephone) !== null;
    setErreurTelephone(valide ? null : MESSAGE_NUMERO);
    return valide;
  };

  const submit = () => {
    setErreurEnvoi(null);
    if (!verifierTelephone()) return;
    const numero = numeroInternational(telephone);
    if (numero) mutation.mutate(numero);
  };

  return {
    telephone,
    setTelephone,
    verifierTelephone,
    erreurTelephone,
    typeLogement,
    setTypeLogement,
    typeOptions: types.map((t) => ({ value: t.slug, label: t.nom })),
    quartier,
    setQuartier,
    quartierOptions: (lieux?.quartiers ?? []).map((q) => ({
      value: `${q.nom}${LIEU_SEPARATOR}${q.ville}`,
      label: `${q.nom}, ${q.ville}`,
    })),
    telephoneVerrouille: isAuthenticated,
    submit,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    reset: () => mutation.reset(),
    erreurEnvoi,
  };
}
