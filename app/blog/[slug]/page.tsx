import { notFound } from "next/navigation";
import WikiShell from "@/app/components/wiki-shell";
import { SITE_COLUMNS, getAllPostSlugs, getPostBySlug, getPostMetas } from "@/lib/content";

interface PageProps {
    params: Promise<{ slug: string }>;
}

// 生成静态参数
export async function generateStaticParams() {
    const slugs = await getAllPostSlugs();
    return slugs;
}

export default async function PostPage({ params }: PageProps) {
    const { slug } = await params;
    const [metas, post] = await Promise.all([getPostMetas(), getPostBySlug(slug)]);

    if (!post) {
        notFound();
    }

    return (
        <WikiShell
            columns={SITE_COLUMNS}
            metas={metas}
            selectedPost={{
                slug: post._meta.path,
                title: post.title,
                summary: post.summary,
                tags: post.tags,
                date: post.date,
                content: post.content,
                code: post.code,
                column: post.column,
                category: post.category,
            }}
        />
    );
}