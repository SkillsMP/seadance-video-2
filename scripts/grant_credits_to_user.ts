/**
 * 【用户积分手动发放 / 临时运维脚本】
 * 
 * 作用：为指定邮箱用户手动增加积分额度。
 * 注意：目前内部邮箱硬编码，修改脚本内的 email 和 credits 后执行。
 * 
 * 运行方式：
 * npx tsx scripts/grant_credits_to_user.ts
 */
import { getUsers } from '@/shared/models/user';
import { grantCreditsForUser } from '@/shared/models/credit';

async function run() {
  const email = 'panleipanlei.qq@gmail.com';
  // 根据邮箱查询用户
  const users = await getUsers({ email });
  if (!users.length) {
    console.error(`未找到邮箱为 ${email} 的用户`);
    return;
  }

  const user = users[0];
  // 为用户授予 100 积分
  await grantCreditsForUser({
    user,
    credits: 100,
    description: '手动授予积分',
  });

  console.log(`已成功为 ${email} 授予 100 积分`);
}

run().catch((err) => {
  console.error('执行出错：', err);
});
