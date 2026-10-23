import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    // Charte Seek : gouttière 16 px mobile, 24 px desktop, contenu limité à 1 200 px.
    container: {
      center: true,
      padding: { DEFAULT: "16px", lg: "24px" },
      screens: {
        "2xl": "1248px",
      },
    },
    extend: {
      fontFamily: {
        display: ["'Bricolage Grotesque Variable'", "'Bricolage Grotesque'", "system-ui", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      // Échelle typographique de la charte (taille / interligne).
      fontSize: {
        "display-xl": ["72px", { lineHeight: "72px", letterSpacing: "-0.03em" }],
        display: ["56px", { lineHeight: "60px", letterSpacing: "-0.03em" }],
        "display-m": ["40px", { lineHeight: "44px", letterSpacing: "-0.025em" }],
        h1: ["36px", { lineHeight: "44px", letterSpacing: "-0.02em" }],
        h2: ["28px", { lineHeight: "36px", letterSpacing: "-0.015em" }],
        "price-l": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em" }],
        h3: ["20px", { lineHeight: "28px" }],
        title: ["16px", { lineHeight: "22px" }],
        price: ["18px", { lineHeight: "24px" }],
        "body-l": ["16px", { lineHeight: "24px" }],
        "body-m": ["14px", { lineHeight: "20px" }],
        caption: ["12px", { lineHeight: "16px" }],
        overline: ["11px", { lineHeight: "16px", letterSpacing: "0.08em" }],
        ref: ["13px", { lineHeight: "20px" }],
      },
      transitionDuration: {
        hover: "150ms",
        tab: "200ms",
        drawer: "300ms",
      },
      colors: {
        // Couleurs de marque, valeurs exactes de la charte.
        baobab: {
          100: "#E3EFE9",
          700: "#0A5C43",
          900: "#084A36",
          DEFAULT: "#0A5C43",
          dark: "#45C08E",
        },
        soleil: {
          100: "#FFF1CC",
          500: "#FFC233",
          600: "#F2B01E",
          DEFAULT: "#FFC233",
        },
        encre: "#0C1F18",
        texte2: "#4B5B55",
        "bord-champ": "#7F908A",
        filet: "#DCE4E0",
        surface: "#F3F7F5",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        featured: {
          DEFAULT: "hsl(var(--featured))",
          foreground: "hsl(var(--featured-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Rayons de la charte.
        marker: "8px",
        control: "12px",
        card: "20px",
        sheet: "28px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(12, 31, 24, 0.04), 0 4px 16px rgba(12, 31, 24, 0.06)",
        float: "0 8px 24px rgba(12, 31, 24, 0.14)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "modal-in": {
          "0%": { opacity: "0", transform: "scale(0.94) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "overlay-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "page-data": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "slide-up": "slide-up 0.25s ease-out both",
        "modal-in": "modal-in 0.22s cubic-bezier(0.34, 1.3, 0.64, 1) both",
        "overlay-in": "overlay-in 0.18s ease-out both",
        "page-data": "page-data 0.2s ease-out both",
        "pop-in": "pop-in 0.22s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
