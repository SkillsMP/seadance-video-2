import { getLatestShowcases } from '@/shared/models/showcase';

async function testQuery() {
  console.log('\n=== Testing Tags Query ===\n');

  // Test 1: All hairstyles
  console.log('1. All hairstyles (tags="hairstyles"):');
  const allHairstyles = await getLatestShowcases({
    tags: 'hairstyles',
    limit: 20,
  });
  console.log(`Found ${allHairstyles.length} items`);
  allHairstyles.forEach((item) => {
    console.log(`  - ${item.title} | Tags: ${item.tags}`);
  });

  // Test 2: Men hairstyles
  console.log('\n2. Men hairstyles (tags="hairstyles,men"):');
  const menHairstyles = await getLatestShowcases({
    tags: 'hairstyles,men',
    limit: 20,
  });
  console.log(`Found ${menHairstyles.length} items`);
  menHairstyles.forEach((item) => {
    console.log(`  - ${item.title} | Tags: ${item.tags}`);
  });

  // Test 3: Women hairstyles
  console.log('\n3. Women hairstyles (tags="hairstyles,women"):');
  const womenHairstyles = await getLatestShowcases({
    tags: 'hairstyles,women',
    limit: 20,
  });
  console.log(`Found ${womenHairstyles.length} items`);
  womenHairstyles.forEach((item) => {
    console.log(`  - ${item.title} | Tags: ${item.tags}`);
  });
}

testQuery()
  .then(() => {
    console.log('\n=== Test Complete ===\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
