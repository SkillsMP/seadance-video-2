import { NextRequest, NextResponse } from 'next/server';

// Prompt mapping data (will be replaced with database later)
interface PromptData {
  prompt: string;
  previewImage: string;
}

const promptMappings: Record<string, PromptData> = {
  'hairstyles': {
    prompt: 'Make a 3x3 grid with different hairstyles.',
    previewImage: 'https://r2.trys.ai/ai/gemini/kqk9Chx1ef89znj2HlKES.jpeg',
  },
  '3d-digital-human-comics': {
    prompt: 'Create a realistic digital caricature painting of firgure 1 with a slightly oversized head, exuding charm and quiet confidence. He is dressed in space x. Underneath, he wears a warm-toned flannel shirt slightly visible at the collar and cuffs, paired with khaki cargo pants and black sneakers that ground the outfit with a casual yet confident energy. Completing his look, he wears a brown flat cap tilted slightly forward — a small detail that adds personality and flair. The man is portrayed in a mid-shot, adjusting his glasses with one hand while gazing directly at the viewer with a self-assured and composed expression. His head is slightly larger than normal, emphasizing his thoughtful character and giving the image a light caricature charm without losing realism. The facial expression radiates intelligence, humor, and approachability. The lighting is warm and soft, like that of a late afternoon sun filtering through a studio setup. Smooth gradual shadows enhance the contours of his face, while subtle highlights accentuate the texture of his bomber jacket and the reflection in his glasses. His skin tones glow naturally under the warm light, creating a pleasant sense of depth and realism. The background is a gradient of warm brown and beige hues, blending smoothly from light to dark. This background is simple yet elegant, allowing the subject to stand out while maintaining a professional, editorial quality. The art style should combine semi-realistic digital painting with the texture of oil brushstrokes, delivering a balanced fusion of realism and stylized charm. Clean outlines, smooth blending, and controlled highlights give the impression of a modern portrait illustration — detailed, expressive, and visually captivating.',
    previewImage: '/imgs/showcases/3d-digital-human-comics.png',
  },
  'vertical-fisheye-selfie': {
    prompt: 'A vertical fisheye selfie taken on September 16th, featuring the person in the photo posing with [Doraemon, Naruto, Nobita, Gojou Satoru, and Narumi (Ash from Pokémon)].',
    previewImage: 'https://nanobanana2.ai/imgs/showcases/vertical-fisheye-selfie.png',
  },
  'photo-restoration': {
    prompt: 'Faithfully restore this image with high fidelity to modern photograph quality, in full color, upscale to 4K.',
    previewImage: 'https://r2.trys.ai/imgs/652440f4b73d426b1f88ac7a3c2365fa.png',
  },
  '3d-caricature-of-celebrity': {
    prompt: 'A highly stylized 3D caricature of [celebrity], with an oversized head, expressive facial features, and playful exaggeration. Rendered in a smooth, polished style with clean materials and soft ambient lighting. Minimal background to emphasize the character\'s charm and presence.',
    previewImage: 'https://pbs.twimg.com/media/G61kfVQbAAEFdiu?format=jpg&name=360x360',
  },
  'selfie-with-nick-wilde': {
    prompt: 'Photorealistic 8K: the person from the uploaded photo stands side-by-side with Nick Wilde (Zootopia fox in his green shirt and tie, sly smile) in a dimly lit, crowded cinema; they pose together for a selfie, large movie screen behind them showing action scenes, cinematic lighting. The person is a woman with long black hair, white strapless top with black stars, silver necklace, smiling.',
    previewImage: 'https://pbs.twimg.com/media/G61kLLEWIAAJzhC?format=jpg&name=large',
  },
  'gta-vice-city': {
    prompt: 'Dressed like the GTA: Vice City main character, leaning against a retro 1980s sports car Ocean Drive.',
    previewImage: 'https://pbs.twimg.com/media/G6JBPImWsAAnUXM?format=jpg&name=900x900',
  },
  'zootopia-characters-selfie': {
    prompt: 'Photorealistic 8K: the person from the uploaded photo stands side-by-side with Judy Hopps (Zootopia rabbit officer in police uniform, smiling) in a dimly lit, crowded cinema; they pose together for a selfie, large movie screen behind them showing action scenes, cinematic lighting.',
    previewImage: 'https://pbs.twimg.com/media/G61kLLEWcAAj3_7?format=jpg&name=large',
  },
  'toy-story-thanksgiving-dinner': {
    prompt: 'Woody, Buzz, Jessie, and Rex having Thanksgiving dinner on the McCallister dining table. The house decorated exactly like Home Alone. Tiny toy-sized turkey. Kevin peeks from the stairs. Warm yellow Christmas lights, nostalgic 90s mood. A 4K photo of the scene.',
    previewImage: 'https://pbs.twimg.com/media/G60MtGdW4AARnel?format=jpg&name=4096x4096',
  },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const promptKey = searchParams.get('key');

  if (!promptKey) {
    return NextResponse.json({
      success: false,
      message: 'Prompt key is required',
    }, { status: 400 });
  }

  const promptData = promptMappings[promptKey];

  if (!promptData) {
    return NextResponse.json({
      success: false,
      message: 'Prompt not found',
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      key: promptKey,
      prompt: promptData.prompt,
      previewImage: promptData.previewImage,
    },
  });
}
