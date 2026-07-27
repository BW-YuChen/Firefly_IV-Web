import { TagBadge } from "./tag-badge";

type Props = {
    tags?: string[];
    size?: "sm" | "md";
};

// 标签列表：flex wrap 布局，自动换行
export function TagList({ tags, size = "md" }: Props) {
    if (!tags || tags.length === 0) return null;
    return (
        <div className="wiki-tag-list">
            {tags.map((t) => (
                <TagBadge key={t} tag={t} size={size} />
            ))}
        </div>
    );
}
