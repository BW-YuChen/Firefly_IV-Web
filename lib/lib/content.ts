// lib/content.ts
// 动态加载由 content-collections 生成的内容，避免在部署时因生成文件缺失导致构建崩溃
type GeneratedPost = any;
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
let _cachedGeneratedAllPosts: Post[] | null = null;

async function loadGeneratedAllPosts(): Promise<Post[]> {
    if (_cachedGeneratedAllPosts) return _cachedGeneratedAllPosts;
    try {
        // 动态导入，如果生成文件存在则返回 allPosts
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = await import("../../.content-collections/generated/index.js");
        const posts: Post[] = (mod.allPosts ?? mod.default?.allPosts) as Post[];
        _cachedGeneratedAllPosts = posts || [];
        return _cachedGeneratedAllPosts;
    } catch (err) {
        throw new Error(
            "内容生成文件缺失：未找到 .content-collections/generated。请在部署前生成内容（例如在构建前运行生成脚本），或将生成目录提交到仓库。"
        );
    }
}

export async function getAllPosts(): Promise<Post[]> {
    const posts = (await loadGeneratedAllPosts()).filter(
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