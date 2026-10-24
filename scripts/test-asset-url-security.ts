/**
 * 【外部资源 URL 安全防线单测 / 防 SSRF】
 * 
 * 作用：验证输入图片/视频 URL 的安全性，严格拦截内网保留 IP（127.0.0.1、localhost、169.254.x.x 等），
 * 杜绝利用生图生视频功能探测或攻击云服务器内网的 SSRF 漏洞。
 * 
 * 运行方式：
 * tsx scripts/test-asset-url-security.ts
 */
import assert from 'node:assert/strict';

import {
  assertSafeAssetInputUrls,
  validateAssetInputUrls,
} from '../src/config/ai/asset-url-security';

function assertRejected(finalOptions: unknown, pattern: RegExp): void {
  assert.throws(() => assertSafeAssetInputUrls(finalOptions), pattern);
}

assert.doesNotThrow(() =>
  assertSafeAssetInputUrls({
    image_input: ['https://example.com/reference.png'],
    video_input: ['https://cdn.example.com/reference.mp4?token=abc'],
  })
);

assertRejected(
  { image_input: ['http://example.com/reference.png'] },
  /image_input\[0\] must use https/
);
assertRejected(
  { image_input: ['not a url'] },
  /image_input\[0\] must be a valid URL/
);
assertRejected(
  { image_input: ['https://localhost/reference.png'] },
  /image_input\[0\] must not use localhost/
);
assertRejected(
  { image_input: ['https://127.0.0.1/reference.png'] },
  /image_input\[0\] must not use a private or reserved IP address/
);
assertRejected(
  { image_input: ['https://0.0.0.0/reference.png'] },
  /image_input\[0\] must not use a private or reserved IP address/
);
assertRejected(
  { image_input: ['https://[::1]/reference.png'] },
  /image_input\[0\] must not use a private or reserved IP address/
);
assertRejected(
  { image_input: ['https://169.254.169.254/latest/meta-data'] },
  /image_input\[0\] must not use a private or reserved IP address/
);
assertRejected(
  { image_input: ['https://192.168.1.10/reference.png'] },
  /image_input\[0\] must not use a private or reserved IP address/
);
assertRejected(
  { image_input: ['https://user:pass@example.com/reference.png'] },
  /image_input\[0\] must not include username or password/
);
assertRejected(
  { video_input: ['http://example.com/reference.mp4'] },
  /video_input\[0\] must use https/
);

assert.deepEqual(
  validateAssetInputUrls({
    image_input: ['https://localhost/reference.png'],
    video_input: ['http://example.com/reference.mp4'],
  }).map((issue) => issue.field),
  ['image_input', 'video_input']
);

console.log('asset URL security checks passed.');
