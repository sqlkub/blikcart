import type { Metadata } from 'next';
import './globals.css';
import AdminLayout from '@/components/AdminLayout';

export const metadata: Metadata = { title: 'Blikcart Admin' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdminLayout>{children}</AdminLayout>
      </body>
    </html>
  );
}
