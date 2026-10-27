import type { Metadata } from 'next';
import { Montserrat, Raleway } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/lib/session';

// Same fonts and variables as the sales CRM (dentobees-crm/frontend/src/app/layout.tsx).
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-head', weight: ['400', '500', '600'] });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'DentoBees Admin',
  description: 'Internal admin panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${raleway.variable}`}>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
