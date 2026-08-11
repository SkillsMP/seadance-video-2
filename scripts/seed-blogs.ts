import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "fs";
import path from "path";
import { db } from "@/core/db";
import { post, taxonomy, user } from "@/config/db/schema";
import { eq, and } from "drizzle-orm";
import { getUuid } from "@/shared/lib/hash";

interface BlogSeed {
  slug: string;
  title: string;
  description: string;
  categoryName: string;
  categoryTitle: string;
  filePath: string;
  coverUrl: string;
  authorName: string;
  authorAvatarUrl: string;
  locale: string;
}

const blogsToSeed: BlogSeed[] = [
  {
    slug: "seedance-2-5-release-date-and-overview",
    title: "Seedance 2.5 Announced: ByteDance Next-Gen AI Video Generator Release Date, Specs & Access",
    description: "Discover the latest announcement on ByteDance Seedance 2.5. Explore expected release dates, early access details, 30-second 4K video capabilities, and how to test Seedance video generators today.",
    categoryName: "news-updates",
    categoryTitle: "News & Updates",
    filePath: path.join(process.cwd(), "content", "posts", "seedance-2-5-release-date-and-overview.md"),
    coverUrl: "/preview.png",
    authorName: "Seadance AI Editorial",
    authorAvatarUrl: "/seadance-logo.svg",
    locale: "en",
  },
  {
    slug: "seedance-2-5-prompt-engineering-guide",
    title: "Ultimate Seedance 2.5 Prompt Engineering Guide: Master Cinematic AI Video Generation",
    description: "Learn how to write high-performing text-to-video and image-to-video prompts for Seedance 2.5. Includes camera movement syntax, lighting formulas, negative prompts, and template examples.",
    categoryName: "tutorials-guides",
    categoryTitle: "Tutorials & Guides",
    filePath: path.join(process.cwd(), "content", "posts", "seedance-2-5-prompt-engineering-guide.md"),
    coverUrl: "/preview.png",
    authorName: "Seadance AI Editorial",
    authorAvatarUrl: "/seadance-logo.svg",
    locale: "en",
  },
  {
    slug: "seedance-2-5-features-vs-sora-runway",
    title: "ByteDance Seedance 2.5 Features Breakdown: How It Compares to Sora and Runway Gen-3",
    description: "Compare Seedance 2.5 against OpenAI Sora, Runway Gen-3 Alpha, and MiniMax H3. Explore multimodal reference scalability, physical dynamics, resolution, and production workflows.",
    categoryName: "technical-deep-dive",
    categoryTitle: "Technical Deep Dive",
    filePath: path.join(process.cwd(), "content", "posts", "seedance-2-5-features-vs-sora-runway.md"),
    coverUrl: "/preview.png",
    authorName: "Seadance AI Editorial",
    authorAvatarUrl: "/seadance-logo.svg",
    locale: "en",
  },
];

async function seed() {
  console.log("Starting Blog Seeding Script for ShipAny2...");

  // Get or create a valid user
  let [currentUser] = await db().select().from(user).limit(1);
  if (!currentUser) {
    const newUserId = getUuid();
    await db().insert(user).values({
      id: newUserId,
      name: "System Admin",
      email: "admin@seadance.video",
    });
    [currentUser] = await db().select().from(user).where(eq(user.id, newUserId)).limit(1);
  }

  const systemUserId = currentUser.id;
  console.log(`Using user ID: ${systemUserId}`);

  for (const blog of blogsToSeed) {
    if (!fs.existsSync(blog.filePath)) {
      console.error(`File not found: ${blog.filePath}`);
      continue;
    }

    const content = fs.readFileSync(blog.filePath, "utf-8");

    // 1. Ensure category exists in taxonomy
    let [existingCategory] = await db()
      .select()
      .from(taxonomy)
      .where(eq(taxonomy.slug, blog.categoryName))
      .limit(1);

    let categorySlug: string;
    if (!existingCategory) {
      const catId = getUuid();
      await db().insert(taxonomy).values({
        id: catId,
        userId: systemUserId,
        slug: blog.categoryName,
        type: "category",
        title: blog.categoryTitle,
        description: `${blog.categoryTitle} for Seedance AI Video Generator`,
        status: "online",
        sort: 10,
      });
      categorySlug = blog.categoryName;
      console.log(`Created taxonomy category: ${blog.categoryTitle} (${blog.categoryName})`);
    } else {
      categorySlug = existingCategory.slug;
      console.log(`Using existing taxonomy category: ${existingCategory.title}`);
    }

    // 2. Check if post already exists
    const [existingPost] = await db()
      .select()
      .from(post)
      .where(eq(post.slug, blog.slug))
      .limit(1);

    if (existingPost) {
      await db()
        .update(post)
        .set({
          title: blog.title,
          description: blog.description,
          content: content,
          status: "online",
          image: blog.coverUrl,
          categories: categorySlug,
          authorName: blog.authorName,
          authorImage: blog.authorAvatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(post.id, existingPost.id));
      console.log(`Updated existing post: ${blog.slug}`);
    } else {
      const postId = getUuid();
      await db().insert(post).values({
        id: postId,
        userId: systemUserId,
        slug: blog.slug,
        type: "post",
        title: blog.title,
        description: blog.description,
        content: content,
        categories: categorySlug,
        status: "online",
        image: blog.coverUrl,
        authorName: blog.authorName,
        authorImage: blog.authorAvatarUrl,
        sort: 0,
      });
      console.log(`Inserted new post: ${blog.slug} (${postId})`);
    }
  }

  console.log("Blog Seeding Completed Successfully for ShipAny2!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error during blog seeding:", err);
  process.exit(1);
});
