/**
 * 该脚本用于将旧系统（如老版 seadance.video）导出的注册用户数据（CSV 格式）批量迁移导入到当前新系统中。
 * 
 * 主要功能与步骤包括：
 * 1. 解析 CSV 用户备份数据，校验邮箱格式并进行去重。
 * 2. 支持 `--dry-run` 命令行参数，可以只解析并验证数据，不写入数据库。
 * 3. 使用数据库事务（Transaction），批量插入数据到当前 Schema 的 `user` 表中（采用 `on conflict do nothing` 避免覆盖新用户）。
 * 4. 如果旧用户有绑定的第三方社交账号（如 Google 登录），则同步往 `account` 表中写入授权绑定关系。
 * 
 * 运行示例：
 * npx tsx scripts/import-legacy-users.ts --file=backup_users.csv [--dry-run]
 */
import fs from 'fs';
import postgres from 'postgres';

import { envConfigs } from '@/config';

type LegacyUser = {
  uuid: string;
  email: string;
  created_at?: string;
  nickname?: string;
  avatar_url?: string;
  locale?: string;
  signin_provider?: string;
  signin_openid?: string;
};

function parseArgs() {
  const fileArg = process.argv.find((arg) => arg.startsWith('--file='));
  const dryRun = process.argv.includes('--dry-run');

  return {
    file: fileArg?.slice('--file='.length),
    dryRun,
  };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(value);
      value = '';
      continue;
    }

    value += char;
  }

  values.push(value);
  return values;
}

function parseCsv(file: string): LegacyUser[] {
  const content = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const columns = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, columns[index]?.trim() || ''])
    ) as LegacyUser;
  });

  const byEmail = new Map<string, LegacyUser>();
  for (const row of rows) {
    const email = row.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      continue;
    }

    byEmail.set(email, {
      ...row,
      email,
      uuid: row.uuid || crypto.randomUUID(),
    });
  }

  return Array.from(byEmail.values());
}

function toDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toProviderId(provider?: string) {
  if (!provider) {
    return '';
  }

  if (provider === 'google' || provider === 'google-one-tap') {
    return 'google';
  }

  return provider;
}

async function main() {
  const { file, dryRun } = parseArgs();
  if (!file) {
    throw new Error('Usage: tsx scripts/import-legacy-users.ts --file=<csv>');
  }

  if (envConfigs.database_provider !== 'postgresql') {
    throw new Error('This import script only supports postgresql');
  }

  if (!envConfigs.database_url) {
    throw new Error('DATABASE_URL is not set');
  }

  const schema = (envConfigs.db_schema || 'public').trim();
  if (!schema || !/^[A-Za-z0-9_-]+$/.test(schema)) {
    throw new Error(`Invalid DB_SCHEMA: ${schema}`);
  }

  const users = parseCsv(file);
  console.log(`Parsed users: ${users.length}`);

  if (dryRun) {
    console.log('Dry run only. No database changes were made.');
    return;
  }

  const sql = postgres(envConfigs.database_url, {
    prepare: false,
    max: 1,
  });

  const userTable = `"${schema}"."user"`;
  const accountTable = `"${schema}"."account"`;
  let insertedUsers = 0;
  let skippedUsers = 0;
  let insertedAccounts = 0;
  let skippedAccounts = 0;

  try {
    await sql.begin(async (tx) => {
      for (const legacyUser of users) {
        const createdAt = toDate(legacyUser.created_at);
        const name =
          legacyUser.nickname?.trim() || legacyUser.email.split('@')[0];

        const userResult = await tx.unsafe(
          `
            insert into ${userTable}
              (id, name, email, email_verified, image, created_at, updated_at, utm_source, ip, locale)
            values
              ($1, $2, $3, true, $4, $5, $6, '', '', $7)
            on conflict (email) do nothing
            returning id
          `,
          [
            legacyUser.uuid,
            name,
            legacyUser.email,
            legacyUser.avatar_url || null,
            createdAt,
            createdAt,
            legacyUser.locale || '',
          ]
        );

        let userId = legacyUser.uuid;

        if (userResult.length > 0) {
          insertedUsers += 1;
        } else {
          skippedUsers += 1;
          const existingUser = await tx.unsafe(
            `select id from ${userTable} where email = $1 limit 1`,
            [legacyUser.email]
          );
          userId = existingUser[0]?.id || legacyUser.uuid;
        }

        const providerId = toProviderId(legacyUser.signin_provider);
        if (!providerId || !legacyUser.signin_openid) {
          continue;
        }

        const accountResult = await tx.unsafe(
          `
            insert into ${accountTable}
              (id, account_id, provider_id, user_id, created_at, updated_at)
            select $1, $2, $3, $4, $5, $6
            where not exists (
              select 1
              from ${accountTable}
              where account_id = $2 and provider_id = $3
            )
            returning id
          `,
          [
            crypto.randomUUID(),
            legacyUser.signin_openid,
            providerId,
            userId,
            createdAt,
            createdAt,
          ]
        );

        if (accountResult.length > 0) {
          insertedAccounts += 1;
        } else {
          skippedAccounts += 1;
        }
      }
    });
  } finally {
    await sql.end();
  }

  console.log(
    JSON.stringify(
      {
        insertedUsers,
        skippedUsers,
        insertedAccounts,
        skippedAccounts,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('import legacy users failed:', error);
  process.exit(1);
});
