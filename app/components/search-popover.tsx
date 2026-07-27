"use client";

import { useEffect, useRef } from "react";

export type SearchHit = {
    slug: string;
    title: string;
    summary?: string;
    column: string;
    category: string;
    tags?: string[];
};

type Props = {
    query: string;
    hits: SearchHit[];
    open: boolean;
    activeIndex: number;
    onNavigate: (slug: string) => void;
    onClose: () => void;
};

// 转义正则特殊字符，用于安全匹配
function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 高亮匹配关键词：把文本按命中位置切分，匹配部分包裹 <mark>
function highlight(text: string, query: string): React.ReactNode {
    const q = query.trim();
    if (!q) return text;
    const escaped = escapeRegExp(q);
    const re = new RegExp(`(${escaped})`, "ig");
    const parts = text.split(re);
    return parts.map((part, i) =>
        re.test(part) && part.toLowerCase() === q.toLowerCase() ? (
            <mark key={i}>{part}</mark>
        ) : (
            <span key={i}>{part}</span>
        )
    );
}

// 截断摘要到指定长度
function truncate(s: string, max: number): string {
    if (s.length <= max) return s;
    return s.slice(0, max) + "…";
}

export function SearchPopover({
    query,
    hits,
    open,
    activeIndex,
    onNavigate,
    onClose,
}: Props) {
    const ref = useRef<HTMLDivElement | null>(null);

    // 点击外部关闭
    useEffect(() => {
        if (!open) return;
        const handlePointerDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [open, onClose]);

    // 活动项滚动到可见区域
    useEffect(() => {
        if (!open) return;
        const el = ref.current?.querySelector<HTMLElement>(
            `.wiki-search-hit[data-index="${activeIndex}"]`
        );
        el?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, open]);

    if (!open) return null;

    const visibleHits = hits.slice(0, 10);

    return (
        <div
            ref={ref}
            className="wiki-search-popover"
            role="listbox"
            id="wiki-search-popover"
        >
            {visibleHits.length === 0 ? (
                <div className="wiki-search-empty">
                    {query.trim() ? "无匹配结果" : "输入关键词搜索"}
                </div>
            ) : (
                <>
                    <ul className="wiki-search-hit-list">
                        {visibleHits.map((hit, i) => (
                            <li key={hit.slug}>
                                <button
                                    type="button"
                                    data-index={i}
                                    className={`wiki-search-hit ${i === activeIndex ? "is-active" : ""}`}
                                    onMouseEnter={() => {
                                        // 鼠标悬停时不直接 setActive（由父组件管理），但保留 hover 视觉
                                    }}
                                    onClick={() => onNavigate(hit.slug)}
                                    role="option"
                                    aria-selected={i === activeIndex}
                                >
                                    <div className="wiki-search-hit-title">
                                        {highlight(hit.title, query)}
                                    </div>
                                    <div className="wiki-search-hit-meta">
                                        <span>{hit.column}</span>
                                        <span className="wiki-search-hit-sep">/</span>
                                        <span>{hit.category}</span>
                                    </div>
                                    {hit.summary && (
                                        <div className="wiki-search-hit-summary">
                                            {highlight(truncate(hit.summary, 60), query)}
                                        </div>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                    {hits.length > 0 && (
                        <div className="wiki-search-hit-count">
                            共 {hits.length} 条结果{hits.length > 10 ? "，仅显示前 10 条" : ""}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
