import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Manrope, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Tipografía de la versión PWA (diseno-pwa.md) — reemplaza a Plus Jakarta
// Sans únicamente en display-mode standalone, ver script inline más abajo.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

// Detecta si la app corre instalada (standalone/iOS) y lo marca ANTES del
// primer paint, para que CSS elija shell/tipografía sin flash ni mismatch
// de hidratación (mismo truco que usa next-themes para el tema claro/oscuro).
const SCRIPT_DETECCION_PWA = `(function(){try{var d=document.documentElement;var pwa=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;if(pwa){d.classList.add('pwa-mode');d.style.setProperty('--font-sans','var(--font-manrope)');}}catch(e){}})();`;

export const metadata: Metadata = {
  title: "SCBox",
  description: "Control de caja multiempresa",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SCBox",
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{ __html: SCRIPT_DETECCION_PWA }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
