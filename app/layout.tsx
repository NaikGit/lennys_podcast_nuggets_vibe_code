import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Nudge Store',
  description:
    'A category-first library of leadership and AI learnings from podcast conversations.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
