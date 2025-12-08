import { extractHairstyleTags } from '@/shared/lib/tags';

console.log('\n=== Testing Edge Cases ===\n');

// Test that "women" doesn't match "men"
const result1 = extractHairstyleTags('women hairstyle', 'Women Style');
console.log(`women hairstyle -> ${result1}`);
console.log(`Should be "hairstyles,women", not include "men": ${!result1.split(',').includes('men') ? '✅' : '❌'}`);

// Test that "gentleman" matches "men"
const result2 = extractHairstyleTags('gentleman hairstyle', 'Gentleman Style');
console.log(`\ngentleman hairstyle -> ${result2}`);
console.log(`Should include "men": ${result2.includes('men') ? '✅' : '❌'}`);

// Test multiple categories
const result3 = extractHairstyleTags('woman with her dog', 'Woman and Pet');
console.log(`\nwoman with her dog -> ${result3}`);
console.log(`Should include both "women" and "animal": ${result3.includes('women') && result3.includes('animal') ? '✅' : '❌'}`);

console.log('\n=== Test Complete ===\n');
