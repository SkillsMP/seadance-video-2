import assert from 'node:assert/strict';

import { buildVideoSchema } from '../src/shared/lib/schema';

assert.deepEqual(
  buildVideoSchema({
    name: 'SeaDance AI Video Generation Demo',
    description: 'Text to video generation using SeaDance 2.5.',
    contentUrl: 'https://seadance.video/videos/demo.webm',
    thumbnailUrl: 'https://seadance.video/images/demo.webp',
    uploadDate: '2026-09-04T09:54:16+08:00',
    duration: 'PT6.125S',
  }),
  {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'SeaDance AI Video Generation Demo',
    description: 'Text to video generation using SeaDance 2.5.',
    thumbnailUrl: 'https://seadance.video/images/demo.webp',
    uploadDate: '2026-09-04T09:54:16+08:00',
    duration: 'PT6.125S',
    contentUrl: 'https://seadance.video/videos/demo.webm',
  }
);

console.log('Video schema checks passed.');
