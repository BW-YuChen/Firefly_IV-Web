import Link from "next/link";

type Props = {
    tag: string;
    size?: "sm" | "md";
    variant?: "solid" | "outline";
};

// 标签胶囊：点击跳转到 /tag/[tag] 列表页
// size: sm 用于列表项色点，md 用于文章详情页头部
// variant: outline 默认描边，solid 实心（用于标签页当前标签高亮）
export function TagBadge({ tag, size = "md", variant = "outline" }: Props) {
    return (
        <Link
            href={`/tag/${encodeURIComponent(tag)}`}
            className={`wiki-tag wiki-tag-${variant} wiki-tag-${size}`}
        >
            <span className="wiki-tag-hash">#</span>
            {tag}
        </Link>
    );
}
