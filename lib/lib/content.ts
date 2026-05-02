// lib/content.ts
import { allPosts, type Post as GeneratedPost } from "../../.content-collections/generated/index.js";

export type Post = GeneratedPost;
export type ColumnName = "Welcome" | "ACM" | "游记" | "游戏" | "关于";

export type PostMeta = {
    slug: string;
    title: string;
    summary?: string;
    tags?: string[];
    date: string;
    column: ColumnName;
    category: string;
};

export const SITE_COLUMNS: ColumnName[] = ["Welcome", "ACM", "游记", "游戏", "关于"];

// 获取所有已发布的文章，按日期降序排列
export async function getAllPosts(): Promise<Post[]> {
    const posts = allPosts.filter(
        (doc) => doc.published === undefined || doc.published === true
    );

    return posts.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    ) as Post[];
}

// 根据 slug 获取单篇文章
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
    const posts = await getAllPosts();
    return posts.find(post => post._meta.path === slug);
}

// 获取所有文章的 slug
export async function getAllPostSlugs(): Promise<Array<{ slug: string }>> {
    const posts = await getAllPosts();
    return posts.map(post => ({
        slug: post._meta.path,
    }));
}

// 仅供目录/搜索使用的轻量元数据
export async function getPostMetas(): Promise<PostMeta[]> {
    const posts = await getAllPosts();
    return posts.map((post) => ({
        slug: post._meta.path,
        title: post.title,
        summary: post.summary,
        tags: post.tags,
        date: post.date,
        column: (post.column as ColumnName) ?? "Welcome",
        category: post.category ?? "默认分类",
    }));
}

export async function getWelcomePost(): Promise<Post | undefined> {
    return getPostBySlug("welcome");
}