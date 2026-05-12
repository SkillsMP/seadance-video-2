import { validateModels } from '../src/config/ai/models';

const errors = validateModels();

if (errors.length > 0) {
  console.error(`Invalid AI model registry:\n${errors.join('\n')}`);
  process.exit(1);
}

console.log('AI model registry is valid.');
