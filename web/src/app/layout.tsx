import type { Metadata, Viewport } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Florece",
  description: "Reservá tu cita y descubrí nuestros servicios",
};

export const viewport: Viewport = {
  themeColor: "#935060",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        {/* Bloqueante a propósito: aplica el tema guardado ANTES del primer
            paint. Sin esto, la página siempre carga en claro un instante y
            "salta" a oscuro después — molesto y notorio en cada navegación. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tema');if(t==='claro'||t==='oscuro'){document.documentElement.setAttribute('data-theme',t==='oscuro'?'dark':'light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
