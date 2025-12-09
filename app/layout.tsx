import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pizzaria Zattera - Cardápio Digital',
  description: 'Peça suas pizzas favoritas online',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 font-sans text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
