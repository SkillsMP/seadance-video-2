import { PERMISSIONS } from '@/core/rbac';
import { respData, respErr } from '@/shared/lib/resp';
import { getUserInfo } from '@/shared/models/user';
import { getAnalyticsReport } from '@/shared/services/analytics-events';
import { hasPermission } from '@/shared/services/rbac';

function parseDate(value: unknown): Date | undefined | null {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  try {
    const user = await getUserInfo();
    if (!user) return respErr('no auth, please sign in');

    if (!(await hasPermission(user.id, PERMISSIONS.ADMIN_ACCESS))) {
      return respErr('no permission');
    }

    const body = await request.json().catch(() => ({}));
    const from = parseDate(body?.from);
    const to = parseDate(body?.to);
    if (from === null || to === null) {
      return respErr('invalid report date');
    }
    if (from && to && from > to) {
      return respErr('invalid report range');
    }

    const report = await getAnalyticsReport({
      from,
      to,
      limit: typeof body?.limit === 'number' ? body.limit : undefined,
    });

    return respData(report);
  } catch (error) {
    console.error('Failed to query analytics report:', error);
    return respErr('failed to query analytics report');
  }
}
