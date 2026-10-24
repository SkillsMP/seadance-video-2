/**
 * 【核心数据库运维脚本 / Schema 守护】
 * 
 * 作用：在运行 Drizzle 数据表迁移前，检查 PostgreSQL 数据库中是否存在指定的 schema，不存在则自动创建。
 * 调用场景：被 `pnpm db:migrate` 自动链式调用。
 */
import postgres from 'postgres';

import { envConfigs } from '@/config';

async function main() {
  if (envConfigs.database_provider !== 'postgresql') {
    return;
  }

  const schema = (envConfigs.db_schema || 'public').trim();
  if (!schema || schema === 'public') {
    return;
  }

  if (!/^[A-Za-z0-9_-]+$/.test(schema)) {
    throw new Error(`Invalid DB_SCHEMA: ${schema}`);
  }

  if (!envConfigs.database_url) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = postgres(envConfigs.database_url, {
    prepare: false,
    max: 1,
  });

  try {
    await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error('ensure db schema failed:', error);
  process.exit(1);
});
