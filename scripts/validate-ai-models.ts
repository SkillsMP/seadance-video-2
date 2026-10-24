/**
 * 【AI 模型注册表校验 / CI 核心脚本】
 * 
 * 作用：调用 `validateModels()` 全面校验 `src/config/ai/models.ts` 中声明的所有视频与图片模型，
 * 检查模型参数合法性、scene 覆盖、默认画幅、价格计算与 fallback 配置。
 * 
 * 运行方式：
 * pnpm ai:validate-models
 * 或作为契约测试的一环：pnpm test:video-contract
 */
import { validateModels } from '../src/config/ai/models';

const errors = validateModels();

if (errors.length > 0) {
  console.error(`Invalid AI model registry:\n${errors.join('\n')}`);
  process.exit(1);
}

console.log('AI model registry is valid.');
