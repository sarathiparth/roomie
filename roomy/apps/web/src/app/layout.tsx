import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Roomy — Premium Roommate Matching',
  description: 'Find compatible roommates through data-driven matching',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-text antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
