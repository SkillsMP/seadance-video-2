import { eq, desc } from 'drizzle-orm';

import { db } from '@/core/db';
import { showcase } from '@/config/db/schema';

export interface Showcase {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  image: string;
  createdAt: Date;
}

export interface NewShowcase {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  image: string;
}

export async function addShowcase(data: NewShowcase): Promise<Showcase | null> {
  try {
    const result = await db().insert(showcase).values(data).returning();
    return result[0] || null;
  } catch (error) {
    console.error('Failed to add showcase:', error);
    return null;
  }
}

export async function getLatestShowcases(limit: number = 20): Promise<Showcase[]> {
  try {
    const result = await db()
      .select()
      .from(showcase)
      .orderBy(desc(showcase.createdAt))
      .limit(limit);
    return result;
  } catch (error) {
    console.error('Failed to get showcases:', error);
    return [];
  }
}

export async function getUserShowcases(userId: string): Promise<Showcase[]> {
  try {
    const result = await db()
      .select()
      .from(showcase)
      .where(eq(showcase.userId, userId))
      .orderBy(desc(showcase.createdAt));
    return result;
  } catch (error) {
    console.error('Failed to get user showcases:', error);
    return [];
  }
}
