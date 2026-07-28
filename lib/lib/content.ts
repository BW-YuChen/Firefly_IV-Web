// lib/content.ts
// 动态加载由 content-collections 生成的内容，避免在部署时因生成文件缺失导致构建崩溃
import { SITE_COLUMNS } from "../site-structure";
import type { ColumnName } from "../site-structure";
import GithubSlugger from "github-slugger";

type GeneratedPost = any;
export type Post = GeneratedPost;
export type { ColumnName };

export type PostMeta = {
    slug: string;
    title: string;
    summary?: string;
    tags?: string[];
    date: string;
    column: ColumnName;
    category: string;
    weight: number;
    // 预处理后的纯文本（去掉 markdown 语法、代码块，保留正文和数学公式内容）
    // 用于客户端全文搜索，覆盖普通文字、数学公式、符号等
    searchText?: string;
};

// 预处理 markdown 为纯文本，用于搜索索引
// - 去掉代码块（```...```）和行内代码（`...`）：代码通常不需要被搜索
// - 去掉图片语法 ![alt](src)，保留 alt 文本
// - 去掉链接语法 [text](url)，保留 text
// - 去掉标题符号 #
// - 去掉数学公式定界符 $，保留公式内容（如 $f(p)$ -> f(p)）
// - 去掉加粗/斜体语法符号，保留文本
// 保留普通文本和数学公式内容，使搜索能覆盖到正文字符和公式符号
export function buildSearchText(markdown: string): string {
    if (!markdown) return "";
    return markdown
        // 去掉 frontmatter（如果存在）
        .replace(/^---[\s\S]*?---\n/, "")
        // 去掉代码块（```...``` 或 ~~~...~~~）
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/~~~[\s\S]*?~~~/g, " ")
        // 去掉行内代码（`...`）
        .replace(/`[^`]+`/g, " ")
        // 去掉图片语法 ![alt](src)，保留 alt 文本
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        // 去掉链接语法 [text](url)，保留 text
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        // 去掉标题符号 #
        .replace(/^#{1,6}\s+/gm, "")
        // 去掉数学公式定界符 $$ 和 $，保留公式内容
        .replace(/\$\$/g, " ")
        .replace(/\$/g, " ")
        // 去掉加粗/斜体语法符号，保留文本
        .replace(/\*\*([^*]*)\*\*/g, "$1")
        .replace(/__([^_]*)__/g, "$1")
        // 压缩空白
        .replace(/\s+/g, " ")
        .trim();
}

// 文章标题项（用于 TOC）；与服务端 extractHeadings 输出一致
export type HeadingItem = {
    id: string;
    level: number;
    text: string;
};

// 从 markdown 原文提取标题列表（服务端预算，避免客户端重复解析）
// 用 GithubSlugger 生成 id，与 rehype-slug 编译时生成、wiki-shell 客户端回退逻辑完全一致
// 用 /\r?\n/ 分割，兼容 Windows (\r\n) 和 Unix (\n) 换行符
export function extractHeadings(markdown: string): HeadingItem[] {
    const slugger = new GithubSlugger();
    const lines = markdown.split(/\r?\n/);
    const result: HeadingItem[] = [];
    for (const line of lines) {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (!match) continue;
        const level = match[1].length;
        const text = match[2].trim();
        const id = slugger.slug(text);
        result.push({ id, level, text });
    }
    return result;
}

// 获取全站所有不重复标签（用于 /tag/[tag] 路由的 generateStaticParams）
export async function getAllTags(): Promise<string[]> {
    const posts = await getAllPosts();
    const tags = new Set<string>();
    for (const p of posts) {
        if (Array.isArray(p.tags)) {
            for (const t of p.tags) tags.add(String(t));
        }
    }
    return Array.from(tags);
}

export { SITE_COLUMNS };

function deriveColumnFromPath(pathValue: unknown): ColumnName {
    const raw = String(pathValue ?? "");
    const normalized = raw.replace(/\\/g, "/");
    const seg = normalized.split("/")[0];
    if (SITE_COLUMNS.includes(seg as ColumnName)) {
        return seg as ColumnName;
    }
    return "Welcome";
}

function normalizeSlug(pathValue: unknown): string {
    return String(pathValue ?? "").replace(/\\/g, "/");
}

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
    // Try direct match first
    let found = posts.find(post => normalizeSlug(post._meta.path) === slug);
    if (found) return found;

    // Try decoding/encoding variants to improve matching for non-ASCII slugs
    try {
        const decoded = decodeURIComponent(slug);
        found = posts.find(post => normalizeSlug(post._meta.path) === decoded);
        if (found) return found;
    } catch (e) {
        // ignore
    }

    try {
        const encoded = encodeURIComponent(slug);
        found = posts.find(post => {
            const normalized = normalizeSlug(post._meta.path);
            return normalized === encoded || normalized === decodeURIComponent(encoded);
        });
        if (found) return found;
    } catch (e) {
        // ignore
    }

    // fallback: try lowercase comparison
    const lower = slug.toLowerCase();
    return posts.find(post => normalizeSlug(post._meta.path).toLowerCase() === lower);
}

// 获取所有文章的 slug
export async function getAllPostSlugs(): Promise<Array<{ slug: string }>> {
    const posts = await getAllPosts();
    return posts.map(post => ({
        slug: normalizeSlug(post._meta.path),
    }));
}

// 仅供目录/搜索使用的轻量元数据
export async function getPostMetas(): Promise<PostMeta[]> {
    const posts = await getAllPosts();
    return posts.map((post) => ({
        slug: normalizeSlug(post._meta.path),
        title: post.title,
        summary: post.summary,
        tags: post.tags,
        date: post.date,
        column: (post.column as ColumnName) ?? deriveColumnFromPath(post._meta?.path),
        category: post.category ?? "默认分类",
        weight: post.weight ?? 0,
        searchText: buildSearchText(post.content ?? ""),
    }));
}

export async function getWelcomePost(): Promise<Post | undefined> {
    return getPostBySlug("Welcome/首页/welcome");
}