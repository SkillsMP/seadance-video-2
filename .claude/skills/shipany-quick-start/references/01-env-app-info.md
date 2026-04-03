# Step 1 — App basics (env-driven)

## Goal

Make app URL/name/description/logo consistent via env files (ShipAny Two follows env → `src/config/index.ts` → `envConfigs`).

## Files

- `.env.example` (source template)
- `.env.development` (local)
- `.env.production` (prod)

## Actions

- Copy `.env.example` → `.env.development` and `.env.production`. 注意：这一步Copy可以跳过，因为我会复制之前类似项目的.env文件
- Set at minimum:
  - `NEXT_PUBLIC_APP_URL` = **appUrl**
  - `NEXT_PUBLIC_APP_NAME` = **projectName**
  - `NEXT_PUBLIC_APPEARANCE` = `system` (unless user asks)
  - `NEXT_PUBLIC_THEME` = `default` (unless user uses a different theme folder)
  - `NEXT_PUBLIC_APP_LOGO` = `/logo.svg` or `/logo.png`
  - `NEXT_PUBLIC_APP_PREVIEW_IMAGE` = `/preview.png` (unless replaced)
  - `DB_SCHEMA` = **projectName** (e.g., `bananapro-org` converted from `bananapro.org`)
  - `R2_UPLOAD_PATH` = **projectName**
  - `PLAUSIBLE_DOMAIN` = **appUrl**
  - `AUTH_SECRET` = (要求 AI 通过 `openssl rand -base64 32` 生成。注意：`.env.development` 和 `.env.production` 两者的 `AUTH_SECRET` 必须互不相同，且严禁使用模板自带或之前的旧值)


## Notes

- Some environments may not allow reading `.env.example` directly; copying via shell is sufficient.
- 命名规范: Use the domain name, replacing dots (`.`) with hyphens (`-`) for `DB_SCHEMA` and `R2_UPLOAD_PATH`.
