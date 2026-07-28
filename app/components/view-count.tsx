"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

/**
 * 阅读量组件：眼睛图标 + 数字
 * - 基于 localStorage 计数（静态站点无后端，仅做浏览器侧统计）
 * - 同一篇文章 30 分钟内重复访问只计一次，避免刷新刷量
 * - 初次访问会显示一个基础值 + localStorage 累计值，让数字不至于一直是 1
 */
export function ViewCount({ slug }: { slug: string }) {
    const [count, setCount] = useState<number>(0);

    useEffect(() => {
        try {
            const key = `wiki-views-${slug}`;
            const timeKey = `wiki-views-time-${slug}`;
            const raw = window.localStorage.getItem(key);
            const lastVisit = window.localStorage.getItem(timeKey);
            const now = Date.now();

            // 基础阅读量：用 slug 长度生成一个稳定的初始值（5-50 之间）
            // 让新文章也有一定基础阅读量，不至于显示 1
            const base = 5 + (slug.charCodeAt(slug.length - 1) % 46);

            let current = raw ? parseInt(raw, 10) : base;
            // 如果从未记录过或者距上次访问超过 30 分钟，计数 +1
            if (!lastVisit || now - parseInt(lastVisit, 10) > 30 * 60 * 1000) {
                current += 1;
                window.localStorage.setItem(key, String(current));
                window.localStorage.setItem(timeKey, String(now));
            }
            setCount(current);
        } catch {
            // localStorage 不可用时显示一个固定值
            setCount(1);
        }
    }, [slug]);

    return (
        <span className="wiki-view-count" title="阅读量">
            <Eye size={14} className="wiki-view-icon" />
            <span>{count}</span>
        </span>
    );
}
