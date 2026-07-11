/**
 * 该脚本用于确保指定的 PostgreSQL 数据库 Schema 存在。
 * 在 PostgreSQL 数据库中，如果配置了自定义的 DB_SCHEMA（例如非 public 的 schema），
 * 该脚本会在数据库迁移（migration）前置调用，自动创建不存在的 Schema，防止因 Schema 缺失导致迁移失败。
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
