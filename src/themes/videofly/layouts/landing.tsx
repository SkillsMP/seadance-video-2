import { ReactNode } from 'react';

import {
  Footer as FooterType,
  Header as HeaderType,
} from '@/shared/types/blocks/landing';
import { Footer, Header } from '@/themes/default/blocks';

import '../tokens.css';

export default async function LandingLayout({
  children,
  header,
  footer,
}: {
  children: ReactNode;
  header: HeaderType;
  footer: FooterType;
}) {
  return (
    <div className="videofly-shell min-h-screen w-full bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <Header header={header} />
      <main className="relative">{children}</main>
      <Footer footer={footer} />
    </div>
  );
}
