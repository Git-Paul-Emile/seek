import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import PropertiesSection from "@/components/home/PropertiesSection";
import OwnerStepsSection from "@/components/home/OwnerStepsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import AlertSubscriptionSection from "@/components/home/AlertSubscriptionSection";

// Accueil de la charte : hero, catégories, annonces à la une, encart propriétaires,
// témoignages, alerte SMS. Le pied de page est porté par le layout public.
const Index = () => (
  <>
    <HeroSection />
    <CategoriesSection />
    <PropertiesSection />
    <OwnerStepsSection />
    <TestimonialsSection />
    <AlertSubscriptionSection />
  </>
);

export default Index;
