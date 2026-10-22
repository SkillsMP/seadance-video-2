import type { ReactNode } from 'react';

import type { Header as HeaderType, Footer as FooterType } from '@/shared/types/blocks/landing';

import { Header } from '../blocks/header';
import { Footer } from '../blocks/footer';
import styles from '../styles.module.css';

export default function LandingLayout({ children, header, footer }: {
  children: ReactNode;
  header: HeaderType;
  footer: FooterType;
}) {
  return (
    <div className={styles.shell}>
      <Header header={header} />
      {children}
      <Footer footer={footer} />
    </div>
  );
}
