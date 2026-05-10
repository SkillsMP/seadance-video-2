// npx tsx scripts/grant_credits_to_user.ts
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
