import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Toast de la charte (planche « Alertes et fenêtres ») : aplat encre, action en Soleil.
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-control group-[.toaster]:border-0 group-[.toaster]:bg-encre group-[.toaster]:text-white group-[.toaster]:shadow-float group-[.toaster]:font-body",
          description: "group-[.toast]:text-white/75",
          actionButton: "group-[.toast]:!bg-transparent group-[.toast]:!text-soleil group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
