import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getAllTags, getPostMetas } from "@/lib/content";
import { TagBadge } from "@/app/components/tag-badge";
import { TagList } from "@/app/components/tag-list";

// 显式静态化：所有标签页在构建时预渲染
export const dynamic = "force-static";
export const revalidate = false;

interface PageProps {
    params: Promise<{ tag: string }>;
}

// 生成所有标签的静态参数
export async function generateStaticParams() {
    const tags = await getAllTags();
    return tags.map((tag) => ({ tag: encodeURIComponent(tag) }));
}

// 估算阅读时长（粗略：按 300 字/分钟）
function estimateReadingTime(content?: string): number {
    if (!content) return 1;
    const chars = content.length;
    return Math.max(1, Math.ceil(chars / 300));
}

export default async function TagPage({ params }: PageProps) {
    const { tag } = await params;
    const decoded = decodeURIComponent(tag);
    const allMetas = await getPostMetas();
    const metas = allMetas.filter((m) => m.tags?.includes(decoded));

    return (
        <div className="wiki-tag-page">
            <header className="wiki-tag-header">
                <div className="wiki-tag-breadcrumb">
                    <Link href="/" className="wiki-tag-crumb">
                        首页
                    </Link>
                    <span className="wiki-tag-sep">/</span>
                    <span className="wiki-tag-current">标签</span>
                </div>
                <h1 className="wiki-tag-title">
                    <TagBadge tag={decoded} size="md" variant="solid" />
                </h1>
                <p className="wiki-tag-count">共 {metas.length} 篇文章</p>
            </header>

            {metas.length === 0 ? (
                <div className="wiki-tag-empty">该标签下暂无文章</div>
            ) : (
                <ul className="wiki-tag-post-list">
                    {metas.map((post) => {
                        const href = `/blog/${encodeURI(post.slug)}`;
                        return (
                            <li key={post.slug} className="wiki-tag-post-card">
                                <Link href={href} className="wiki-tag-post-title-link">
                                    <h2 className="wiki-tag-post-title">{post.title}</h2>
                                </Link>
                                {post.summary && (
                                    <p className="wiki-tag-post-summary">{post.summary}</p>
                                )}
                                <div className="wiki-tag-post-meta">
                                    <time>
                                        {format(new Date(post.date), "yyyy年MM月dd日", {
                                            locale: zhCN,
                                        })}
                                    </time>
                                    <span className="wiki-tag-post-sep">·</span>
                                    <span>
                                        {post.column} / {post.category}
                                    </span>
                                    <span className="wiki-tag-post-sep">·</span>
                                    <span>{estimateReadingTime(post.summary)} 分钟阅读</span>
                                </div>
                                <TagList tags={post.tags} size="sm" />
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
