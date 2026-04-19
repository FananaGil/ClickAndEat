import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'CLICK&EAT - Delivery en Punto Fijo',
  description: 'Plataforma de delivery para comercios locales de comida en Punto Fijo, Estado Falcón, Venezuela',
  keywords: ['delivery', 'comida', 'punto fijo', 'falcón', 'venezuela', 'restaurantes'],
  authors: [{ name: 'CLICK&EAT Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#FF6B35',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍽️</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
  openGraph: {
    title: 'CLICK&EAT - Delivery en Punto Fijo',
    description: 'Encuentra y pide comida de los mejores restaurantes de Punto Fijo',
    type: 'website',
    locale: 'es_VE',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#00B894',
              },
            },
            error: {
              style: {
                background: '#E17055',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
