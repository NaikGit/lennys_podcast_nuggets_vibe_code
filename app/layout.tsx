import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: "Insight Atlas: Lessons from Lenny's Podcast",
  description:
    "A category-first atlas of leadership and AI learnings from Lenny's Podcast conversations."
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
