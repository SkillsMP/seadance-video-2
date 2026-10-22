import type { ReactNode } from 'react';

import type {
  Footer as FooterType,
  Header as HeaderType,
} from '@/shared/types/blocks/landing';

import { Footer } from '../blocks/footer';
import { Header } from '../blocks/header';

import '../styles/tokens.css';
import '../styles/flow.css';

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
    <div className="flow-shell">
      <Header header={header} />
      <div className="flow-main">{children}</div>
      <Footer footer={footer} />
    </div>
  );
}
