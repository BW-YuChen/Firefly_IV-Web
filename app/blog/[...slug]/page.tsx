import { notFound } from "next/navigation";
import WikiShell from "@/app/components/wiki-shell";
import {
    SITE_COLUMNS,
    extractHeadings,
    getAllPostSlugs,
    getPostBySlug,
    getPostMetas,
} from "@/lib/content";

// 显式静态化：避免任何动态判定，客户端导航走预渲染的 RSC payload
export const dynamic = "force-static";
export const revalidate = false;

interface PageProps {
    params: Promise<{ slug: string[] }>;
}

// 生成静态参数
export async function generateStaticParams() {
    const slugs = await getAllPostSlugs();
    return slugs.map((item) => ({
        slug: item.slug.split("/"),
    }));
}

export default async function PostPage({ params }: PageProps) {
    const { slug } = await params;
    const slugPath = slug.join("/");
    const [metas, post] = await Promise.all([getPostMetas(), getPostBySlug(slugPath)]);

    if (!post) {
        notFound();
    }

    // 服务端预算 headings：避免把 content 原文传到客户端再二次解析
    const headings = extractHeadings(post.content);

    return (
        <WikiShell
            columns={SITE_COLUMNS}
            metas={metas}
            selectedPost={{
                slug: slugPath,
                title: post.title,
                summary: post.summary,
                tags: post.tags,
                date: post.date,
                content: post.content,
                code: post.code,
                headings,
                column: post.column,
                category: post.category,
            }}
        />
    );
}