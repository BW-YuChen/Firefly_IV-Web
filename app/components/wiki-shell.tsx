"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MDXContent } from "@content-collections/mdx/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import GithubSlugger from "github-slugger";
import {
  ChevronDown,
  List,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useState, useRef } from "react";
import type { CSSProperties } from "react";
import type { ColumnName, PostMeta } from "@/lib/content";
import { TagList } from "./tag-list";
import { SearchPopover, type SearchHit } from "./search-popover";
import { ViewCount } from "./view-count";

// 模块级变量：待处理的搜索关键词（客户端导航跨页面保留）
// handleNavigateFromSearch 设置后跳转，新页面挂载后 useSearchHighlight 读取并清除
// 避免依赖 useSearchParams（在 force-static 页面可能触发 Suspense）
let pendingSearchQuery: string | null = null;

// ============================================================
// 类型定义
// ============================================================

type SelectedPost = {
  slug: string;
  title: string;
  summary?: string;
  tags?: string[];
  date: string;
  content: string;
  code: string;
  // 服务端预算的标题列表；优先使用，避免客户端重复解析 content
  headings?: HeadingItem[];
  column: ColumnName;
  category: string;
};

type HeadingItem = {
  id: string;
  level: number;
  text: string;
};

type Props = {
  columns: readonly ColumnName[];
  metas: PostMeta[];
  selectedPost: SelectedPost;
};

type GroupedColumns = Array<{
  column: ColumnName;
  categories: Array<{ category: string; posts: PostMeta[] }>;
}>;

// ============================================================
// 工具函数
// ============================================================

// 用 github-slugger 生成 id，与 rehype-slug 插件完全一致
// rehype-slug 在编译时已经给标题生成 id，extractHeadings 用相同逻辑生成目录链接的 id
function extractHeadings(markdown: string): HeadingItem[] {
  const slugger = new GithubSlugger();
  // 用 /\r?\n/ 分割，兼容 Windows (\r\n) 和 Unix (\n) 换行符
  const lines = markdown.split(/\r?\n/);
  const result: HeadingItem[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) continue;
    const level = match[1].length;
    const text = match[2].trim();
    // github-slugger 会自动处理重复，生成 slug-1, slug-2 等
    const id = slugger.slug(text);
    result.push({ id, level, text });
  }
  return result;
}

// 语言名归一化（c++ -> cpp，大写 -> 小写等）
function normalizeLang(raw: string): string {
  if (!raw) return "";
  const lang = raw.replace(/^language-/, "").toLowerCase();
  if (lang === "c++") return "cpp";
  if (lang === "c#") return "csharp";
  if (lang === "js") return "javascript";
  return lang.replace(/[+]/g, "p");
}

// ============================================================
// 模块级常量：mdxComponents
// rehype-slug 在编译时已给标题生成 id，这里只覆盖 code 组件
// ============================================================

const mdxComponents = {
  code: ({ className, children, ...props }: { className?: string; children?: any }) => {
    const raw = className ?? "";
    const lang = normalizeLang(raw);
    const preClass = lang ? `language-${lang}` : raw;

    const isReactNodes =
      children &&
      typeof children === "object" &&
      !Array.isArray(
        children?.every ? children.every((c: any) => typeof c === "string" || typeof c === "number") : false
      );

    const content = isReactNodes
      ? children
      : Array.isArray(children)
        ? children.join("")
        : String(children ?? "");

    return (
      <code className={preClass} {...props}>
        {content}
      </code>
    );
  },
  // MDX 里 <img> 会被编译成字符串 "img"（原生 HTML 元素），不走 components 映射
  // 所以用 rehype 插件把 <img> 转成 <Img> 组件调用，这里提供 Img 组件用 next/image
  Img: ({
    src,
    alt = "",
    width = 800,
    height = 600,
    style,
    ...props
  }: {
    src?: string;
    alt?: string;
    width?: number;
    height?: number;
    style?: CSSProperties;
  } & Record<string, any>) => {
    if (!src || typeof src !== "string") return null;
    if (src.startsWith("/")) {
      // 用户传入的 style 直接作用于 Image 本身（含 borderRadius、margin 等），
      // 避免外层 span 拦截视觉样式导致头像椭圆等问题
      return (
        <span className="wiki-img-wrap" style={{ display: "block", textAlign: "center" }}>
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes="(max-width: 768px) 100vw, 768px"
            style={{
              width: "100%",
              height: "auto",
              maxWidth: width,
              borderRadius: "0.5rem",
              ...style,
            }}
            {...props}
          />
        </span>
      );
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" decoding="async" style={{ maxWidth: width, ...style }} {...props} />;
  },
};

// ============================================================
// 自定义 hook：主题管理（亮/暗）
// 主题已在 layout.tsx 的内联脚本中同步设置到 <html data-theme>，
// 这里从 dataset 读取初始值，避免 useState 默认 false 导致的二次切换闪烁
// ============================================================

function useTheme() {
  // lazy 初始：从 document.documentElement.dataset.theme 派生
  // 内联脚本已在 React hydration 前设置好，保证与服务端一致、无 FOUC
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dataset.theme === "dark";
  });

  // 单向同步：isDark 变化时同步更新 dataset + localStorage
  // 移除原先"读取 localStorage 设置 isDark"的 useEffect，避免双向触发错乱
  useEffect(() => {
    const next = isDark ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("wiki-theme", next);
    } catch {
      /* localStorage 不可用（隐私模式等）时静默忽略 */
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((v) => !v) };
}

// ============================================================
// 自定义 hook：scroll spy（监听滚动，返回当前活动标题 id）
// ============================================================

function useScrollSpy(itemIds: string[], offset = 120) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (itemIds.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY + offset;
      let current: string | null = null;
      for (const id of itemIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) {
          current = id;
        }
      }
      // 如果还没滚动到任何标题，激活第一个
      if (!current && itemIds.length > 0) {
        current = itemIds[0];
      }
      setActiveId(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [itemIds, offset]);

  return activeId;
}

// ============================================================
// 自定义 hook：代码块 UI 注入（工具栏 + 语言名规范化）
// 行号由 CSS counter 生成（见 globals.css）；高亮由 rehype-pretty-code 构建时完成
// ============================================================

function useCodeBlockUI(
  contentRef: React.RefObject<HTMLElement | null>,
  deps: Array<string>
) {
  useEffect(() => {
    let observer: MutationObserver | null = null;
    const blockSelector = ".rehype-pretty-code, [data-rehype-pretty-code-figure]";

    let isInjecting = false;
    const injectUI = () => {
      if (isInjecting) return;
      isInjecting = true;
      try {
        const container = contentRef.current as HTMLElement | null;
        if (!container) return;

        // 行号已改用 CSS counter 自动生成（见 globals.css），不再需要 JS 注入
        // prismjs 兜底高亮已移除：rehype-pretty-code 在构建时用 shiki 完成高亮，
        // 运行时再动态 import prismjs 会拖慢首次代码块渲染，且 shiki 已足够。

        // 规范化语言名 + 添加工具栏（会新增 DOM 元素，可能触发 MutationObserver）
        const blocks = Array.from(container.querySelectorAll(blockSelector));
        for (const blk of blocks) {
          const preEl = blk.querySelector("pre");
          if (preEl) {
            const lang = preEl.getAttribute("data-language");
            if (lang === "c++") preEl.setAttribute("data-language", "cpp");
            const codeEl = preEl.querySelector("code");
            if (codeEl && lang === "c++") codeEl.setAttribute("data-language", "cpp");
          }
          if (blk.querySelector(".code-toolbar")) continue;

          const toolbar = document.createElement("div");
          toolbar.className = "code-toolbar";

          const copyBtn = document.createElement("button");
          copyBtn.className = "code-btn code-copy-btn";
          copyBtn.textContent = "复制";
          copyBtn.title = "复制代码";

          toolbar.appendChild(copyBtn);
          blk.appendChild(toolbar);

          copyBtn.addEventListener("click", async () => {
            try {
              const codeEl = blk.querySelector("pre") ?? blk.querySelector("code");
              if (!codeEl) return;
              const text = codeEl.innerText;
              await navigator.clipboard.writeText(text);
              copyBtn.textContent = "已复制";
              setTimeout(() => (copyBtn.textContent = "复制"), 1500);
            } catch {
              /* ignore */
            }
          });
        }
      } catch {
        /* ignore */
      } finally {
        isInjecting = false;
      }
    };

    if (contentRef.current) injectUI();

    if (contentRef.current && typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(() => injectUI());
      observer.observe(contentRef.current, { childList: true, subtree: true });
    }

    return () => {
      if (observer) observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ============================================================
// 搜索关键字定位与闪烁
// 在 container 内文本节点中查找所有命中位置，包裹 <mark class="search-flash">
// 滚动到第一个命中位置，动画结束后自动清理 mark 元素
// 支持多关键词（空格分隔）：每个词都高亮，命中任一即闪烁
// ============================================================

// 在单个文本节点内查找所有命中位置并包裹 mark
function wrapTextNodeMarks(text: string, terms: string[]): { fragment: DocumentFragment; marks: HTMLElement[] } {
  const fragment = document.createDocumentFragment();
  const lowerText = text.toLowerCase();
  // 找出所有命中区间 [start, end)
  const ranges: Array<{ start: number; end: number }> = [];
  for (const term of terms) {
    const lowerTerm = term.toLowerCase();
    let idx = lowerText.indexOf(lowerTerm);
    while (idx !== -1) {
      ranges.push({ start: idx, end: idx + term.length });
      idx = lowerText.indexOf(lowerTerm, idx + term.length);
    }
  }
  if (ranges.length === 0) {
    fragment.appendChild(document.createTextNode(text));
    return { fragment, marks: [] };
  }
  // 按起始位置排序，合并重叠区间
  ranges.sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }
  const marks: HTMLElement[] = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.start > cursor) {
      fragment.appendChild(document.createTextNode(text.slice(cursor, r.start)));
    }
    // 用 span 代替 mark，避免浏览器/Tailwind 对 mark 元素的特殊处理导致样式不可见
    const mark = document.createElement("span");
    mark.className = "search-flash";
    mark.textContent = text.slice(r.start, r.end);
    fragment.appendChild(mark);
    marks.push(mark);
    cursor = r.end;
  }
  if (cursor < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(cursor)));
  }
  return { fragment, marks };
}

function highlightInPlace(container: HTMLElement | null, rawTerm: string): boolean {
  if (!container || !rawTerm) return false;
  // 多关键词：按空白分隔，过滤空串
  const terms = rawTerm.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  if (terms.length === 0) return false;

  // 先清理已有的 mark，避免重复包裹
  container.querySelectorAll(".search-flash").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    const textNode = document.createTextNode(mark.textContent ?? "");
    parent.replaceChild(textNode, mark);
    parent.normalize();
  });

  // 判断节点是否应跳过（代码块、script、style、input 等）
  const shouldSkip = (node: Text): boolean => {
    let parent: Element | null = node.parentElement;
    while (parent && parent !== container) {
      const tag = parent.tagName;
      if (tag === "CODE" || tag === "PRE" || tag === "SCRIPT" || tag === "STYLE" || tag === "INPUT" || tag === "TEXTAREA") {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  };

  const lowerTerms = terms.map((t) => t.toLowerCase());
  const marks: HTMLElement[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!(node instanceof Text)) return NodeFilter.FILTER_REJECT;
      const text = node.nodeValue ?? "";
      if (!text) return NodeFilter.FILTER_REJECT;
      if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
      const lowerText = text.toLowerCase();
      // 任一关键词命中即接受
      for (const lt of lowerTerms) {
        if (lowerText.includes(lt)) return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_REJECT;
    },
  });

  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    if (current instanceof Text) textNodes.push(current);
    current = walker.nextNode();
  }

  // 内联样式常量：插入 DOM 前设置，避免 transition 导致淡入
  const HIGHLIGHT_STYLE = [
    "background-color: #f59e0b",
    "color: #ffffff",
    "padding: 2px 4px",
    "border-radius: 3px",
    "box-shadow: 0 0 0 2px rgba(245,158,11,0.5)",
    "font-weight: bold",
  ].join("; ");

  for (const textNode of textNodes) {
    const text = textNode.nodeValue ?? "";
    const { fragment, marks: nodeMarks } = wrapTextNodeMarks(text, terms);
    if (nodeMarks.length > 0) {
      // 插入 DOM 前设置内联样式，确保高亮立即可见（无 transition 淡入）
      nodeMarks.forEach((m) => { m.style.cssText = HIGHLIGHT_STYLE; });
      textNode.parentNode?.replaceChild(fragment, textNode);
      marks.push(...nodeMarks);
    }
  }

  if (marks.length === 0) {
    return false;
  }

  // 第一个匹配项设置 id 用于滚动定位
  marks[0].id = "search-flash-first";

  // 延迟滚动：确保 span 已插入 DOM 并完成布局
  // 同时避免 scrollIntoView 触发 useScrollSpy → setActiveId → 重渲染干扰
  setTimeout(() => {
    const first = container.querySelector("#search-flash-first") as HTMLElement | null;
    if (first) {
      first.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 150);

  // 3s 后清理 span 元素（恢复为纯文本节点）
  const cleanup = () => {
    const firstEl = container.querySelector("#search-flash-first");
    if (firstEl) firstEl.removeAttribute("id");
    const marksInDom = container.querySelectorAll(".search-flash");
    marksInDom.forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      const textNode = document.createTextNode(mark.textContent ?? "");
      parent.replaceChild(textNode, mark);
      parent.normalize();
    });
  };
  setTimeout(cleanup, 3000);
  return true;
}

// ============================================================
// 自定义 hook：搜索关键字定位与闪烁
// 优先从 module-level 变量 pendingSearchQuery 获取搜索词（客户端导航）
// 回退到 URL ?q= 参数（直接访问/刷新）
// 用 setTimeout 轮询重试，确保 MDX 内容渲染完成后再查找
// ============================================================

function useSearchHighlight(
  contentRef: React.RefObject<HTMLElement | null>,
  slug: string
) {
  useEffect(() => {
    // 优先从 module-level 变量获取，回退到 URL 参数
    let term: string | null = pendingSearchQuery;
    pendingSearchQuery = null; // 读后清除，避免重复触发

    if (!term && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      term = params.get("q");
    }
    if (!term) return;

    // 从 URL 移除 ?q= 参数，避免刷新或分享时重复闪烁
    const cleanupUrl = () => {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has("q")) {
          url.searchParams.delete("q");
          window.history.replaceState(null, "", url.pathname + (url.hash || ""));
        }
      } catch {
        /* ignore */
      }
    };

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let observer: MutationObserver | null = null;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      if (observer) { observer.disconnect(); observer = null; }
      cleanupUrl();
    };

    const attempt = (): boolean => {
      if (cancelled || done) return false;
      const container = contentRef.current;
      if (!container) return false;
      // 容器必须有实际内容才尝试（避免空 DOM）
      if (container.textContent && container.textContent.trim().length > 0) {
        return highlightInPlace(container, term!);
      }
      return false;
    };

    // 立即尝试一次（同页搜索时容器已就绪）
    if (attempt()) {
      finish();
      return () => {};
    }

    // 未就绪：用 MutationObserver 监听 container 子树变化，一旦有内容就尝试
    const container = contentRef.current;
    if (container && typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(() => {
        if (attempt()) finish();
      });
      observer.observe(container, { childList: true, subtree: true, characterData: true });
    }

    // 兜底：定时轮询，防止 MutationObserver 未触发
    let attemptsLeft = 40; // 40 * 100ms = 4s
    const poll = () => {
      if (cancelled || done) return;
      if (attempt()) {
        finish();
        return;
      }
      attemptsLeft--;
      if (attemptsLeft > 0) {
        timer = setTimeout(poll, 100);
      } else {
        // 超时仍未找到，放弃
        finish();
      }
    };
    timer = setTimeout(poll, 100);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (observer) observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
}

// ============================================================
// 共用子组件：栏目 + 分类 + 文章列表
// （桌面端左侧栏与移动端抽屉复用）
// ============================================================

type ColumnCategoryListProps = {
  groupedColumns: GroupedColumns;
  activeColumn: ColumnName;
  selectedSlug: string;
  openColumns: Record<string, boolean>;
  openCategories: Record<string, Record<string, boolean>>;
  onToggleColumn: (column: string) => void;
  onToggleCategory: (column: string, category: string) => void;
  buildPostHref: (slug: string) => string;
  onNavigate?: () => void;
  variant: "desktop" | "mobile";
};

function ColumnCategoryList({
  groupedColumns,
  activeColumn,
  selectedSlug,
  openColumns,
  openCategories,
  onToggleColumn,
  onToggleCategory,
  buildPostHref,
  onNavigate,
  variant,
}: ColumnCategoryListProps) {
  return (
    <>
      {groupedColumns.map(({ column, categories }) => {
        if (activeColumn !== column) return null;
        const isOpen = openColumns[column] ?? true;

        // 移动端：不显示栏目折叠头（标题已在抽屉头部显示）
        if (variant === "mobile") {
          if (categories.length === 0) {
            return <div key={column} className="px-3 py-1 text-xs opacity-60">暂无分类</div>;
          }
          return (
            <div key={column}>
              {categories.map(({ category, posts }) => (
                <div key={`${column}-${category}`} className="mb-2">
                  <div className="px-3 py-1.5 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {category}
                  </div>
                  <ul className="space-y-1">
                    {posts.map((post) => (
                      <li key={post.slug}>
                        <Link
                          href={buildPostHref(post.slug)}
                          onClick={onNavigate}
                          className={`wiki-post-link block rounded px-3 py-1.5 text-sm ${
                            post.slug === selectedSlug ? "is-active" : ""
                          }`}
                        >
                          <span className="wiki-post-title">{post.title}</span>
                          {post.tags && post.tags.length > 0 && (
                            <span className="wiki-tag-dots" aria-hidden="true">
                              {post.tags.slice(0, 3).map((t) => (
                                <span key={t} className="wiki-tag-dot" title={t} />
                              ))}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          );
        }

        // 桌面端：可折叠栏目 + 可折叠分类
        return (
          <section key={column} className="mb-4">
            <button
              className="wiki-column-row flex w-full items-center justify-between rounded px-2 py-1 text-left"
              onClick={() => onToggleColumn(column)}
            >
              <span className="font-semibold">{column}</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
              />
            </button>

            {isOpen && (
              <div className="mt-1 space-y-2">
                {categories.length === 0 && (
                  <div className="px-3 py-1 text-xs opacity-60">暂无分类</div>
                )}
                {categories.map(({ category, posts }) => {
                  const catOpen = openCategories[column]?.[category] ?? true;
                  return (
                    <div key={`${column}-${category}`} className="pl-2">
                      <button
                        className="wiki-category flex w-full items-center justify-between text-sm font-medium"
                        onClick={() => onToggleCategory(column, category)}
                        aria-expanded={catOpen}
                      >
                        <span>{category}</span>
                        <ChevronDown
                          size={12}
                          className={`transition-transform ${catOpen ? "rotate-0" : "-rotate-90"}`}
                        />
                      </button>
                      {catOpen && (
                        <ul className="mt-1 space-y-1 pl-3">
                          {posts.map((post) => (
                            <li key={post.slug}>
                              <Link
                                href={buildPostHref(post.slug)}
                                className={`wiki-post-link block rounded px-2 py-1 text-sm ${
                                  post.slug === selectedSlug ? "is-active" : ""
                                }`}
                              >
                                <span className="wiki-post-title">{post.title}</span>
                                {post.tags && post.tags.length > 0 && (
                                  <span className="wiki-tag-dots" aria-hidden="true">
                                    {post.tags.slice(0, 3).map((t) => (
                                      <span key={t} className="wiki-tag-dot" title={t} />
                                    ))}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

// ============================================================
// 共用子组件：目录列表
// （桌面端右侧栏与移动端顶部折叠目录复用）
// ============================================================

type TocListProps = {
  items: HeadingItem[];
  activeId?: string | null;
  onNavigate?: () => void;
  emptyText?: string;
};

function TocList({ items, activeId, onNavigate, emptyText = "当前文章无标题目录" }: TocListProps) {
  if (items.length === 0) {
    return <li className="opacity-60">{emptyText}</li>;
  }
  return items.map((item) => {
    const isActive = activeId === item.id;
    return (
      <li
        key={`${item.id}-${item.text}`}
        style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
      >
        <a
          href={`#${item.id}`}
          className={`wiki-toc-link inline-flex items-center gap-1 ${isActive ? "is-active" : ""}`}
          onClick={onNavigate}
        >
          <ChevronDown size={12} className="-rotate-90" />
          {item.text}
        </a>
      </li>
    );
  });
}

// ============================================================
// 共用子组件：栏目导航（移动端抽屉头部 + 桌面端顶部按钮）
// ============================================================

type ColumnTabsProps = {
  columns: readonly ColumnName[];
  groupedColumns: GroupedColumns;
  activeColumn: ColumnName;
  buildPostHref: (slug: string) => string;
  onNavigate?: () => void;
  variant: "desktop" | "mobile";
};

function ColumnTabs({
  columns,
  groupedColumns,
  activeColumn,
  buildPostHref,
  onNavigate,
  variant,
}: ColumnTabsProps) {
  return (
    <>
      {columns.map((column) => {
        const group = groupedColumns.find((g) => g.column === column);
        const firstPost = group?.categories.flatMap((c) => c.posts)[0];
        const isActive = activeColumn === column;

        if (!firstPost) {
          if (variant === "mobile") {
            return (
              <div key={column} className="px-3 py-2 text-sm opacity-50 cursor-not-allowed">
                {column}
              </div>
            );
          }
          return (
            <button
              key={column}
              disabled
              className="wiki-column-tab rounded px-2 py-1 text-sm opacity-50 cursor-not-allowed"
              title="该栏目暂无文章"
            >
              {column}
            </button>
          );
        }

        if (variant === "mobile") {
          return (
            <Link
              key={column}
              href={buildPostHref(firstPost.slug)}
              onClick={onNavigate}
              className={`wiki-column-tab block rounded px-3 py-2 text-sm ${isActive ? "active" : ""}`}
            >
              {column}
            </Link>
          );
        }

        return (
          <Link
            key={column}
            href={buildPostHref(firstPost.slug)}
            className={`wiki-column-tab rounded px-2 py-1 text-sm ${isActive ? "active" : ""}`}
          >
            {column}
          </Link>
        );
      })}
    </>
  );
}

// ============================================================
// 主组件
// ============================================================

export default function WikiShell({ columns, metas, selectedPost }: Props) {
  const [keyword, setKeyword] = useState("");
  const { isDark, toggle: toggleTheme } = useTheme();
  const [openColumns, setOpenColumns] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columns.map((column) => [column, true]))
  );
  const [openCategories, setOpenCategories] = useState<Record<string, Record<string, boolean>>>({});

  // 移动端 UI 状态
  const [mobileNavOpen, setMobileNavOpen] = useState(false); // 栏目抽屉
  const [sidebarOpen, setSidebarOpen] = useState(false); // 文章列表抽屉
  const [tocOpen, setTocOpen] = useState(false); // 顶部折叠目录

  // 当前栏目由当前文章决定
  const activeColumn: ColumnName = selectedPost.column;
  const buildPostHref = (slug: string) => `/blog/${slug}`;

  // 判断是否为同栏目下的文章切换：与上次渲染栏目相同则禁用模块淡入动画
  // 首次进入（含开屏跳转、硬刷新）或跨栏目切换时保留淡入动画
  // 使用 useRef + useLayoutEffect 在 paint 前更新 state，
  // 避免在 render 阶段直接修改 ref 导致 SSR/CSR className 不一致（hydration mismatch）
  const lastColumnRef = useRef<ColumnName | null>(null);
  const [isSameColumnNav, setIsSameColumnNav] = useState(false);
  useLayoutEffect(() => {
    setIsSameColumnNav(lastColumnRef.current === activeColumn);
    lastColumnRef.current = activeColumn;
  }, [activeColumn]);

  // 搜索：独立跨栏目过滤，不再驱动左侧栏分组
  // 左侧栏始终展示完整 metas（按 activeColumn 过滤），搜索结果通过下拉弹层展示
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeHitIndex, setActiveHitIndex] = useState(0);
  const router = useRouter();

  const searchHits = useMemo<SearchHit[]>(() => {
    const rawQ = keyword.trim();
    const q = rawQ.toLowerCase();
    if (!q) return [];
    // 从正文匹配位置生成上下文片段，用于搜索结果显示
    const makeSnippet = (text: string, radius = 30): string => {
      const lower = text.toLowerCase();
      const idx = lower.indexOf(q);
      if (idx === -1) return "";
      const start = Math.max(0, idx - radius);
      const end = Math.min(text.length, idx + q.length + radius);
      const prefix = start > 0 ? "…" : "";
      const suffix = end < text.length ? "…" : "";
      return prefix + text.slice(start, end).trim() + suffix;
    };
    return metas
      .filter((post) => {
        const title = post.title.toLowerCase();
        const summary = (post.summary ?? "").toLowerCase();
        const tags = (post.tags ?? []).join(" ").toLowerCase();
        const searchText = (post.searchText ?? "").toLowerCase();
        return title.includes(q) || summary.includes(q) || tags.includes(q) || searchText.includes(q);
      })
      .map((p) => {
        // 优先显示 summary；若 summary 未命中但正文命中，则生成正文片段
        const summaryHit = (p.summary ?? "").toLowerCase().includes(q);
        const snippet = !summaryHit ? makeSnippet(p.searchText ?? "") : undefined;
        return {
          slug: p.slug,
          title: p.title,
          summary: p.summary,
          snippet,
          column: p.column,
          category: p.category,
          tags: p.tags,
        };
      })
      // 当前文章优先显示，方便在当前页内继续查找其他命中位置
      .sort((a, b) => {
        const aCurrent = a.slug === selectedPost.slug ? 0 : 1;
        const bCurrent = b.slug === selectedPost.slug ? 0 : 1;
        return aCurrent - bCurrent;
      });
  }, [keyword, metas, selectedPost.slug]);

  // 当搜索词变化时重置活动项并开关弹层
  useEffect(() => {
    setActiveHitIndex(0);
    setSearchOpen(keyword.trim().length > 0);
  }, [keyword]);

  // 键盘导航：↑↓ 移动、Enter 直接命中第一个、Esc 关闭
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!searchOpen) setSearchOpen(true);
      setActiveHitIndex((i) => Math.min(i + 1, Math.min(searchHits.length, 10) - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveHitIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      // 直接命中第一个匹配项；没有则不做操作
      if (searchHits.length > 0) {
        const hit = searchHits[0];
        if (hit) handleNavigateFromSearch(hit.slug);
      }
    } else if (e.key === "Escape") {
      setSearchOpen(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleNavigateFromSearch = (slug: string) => {
    const q = keyword.trim();
    setSearchOpen(false);
    setKeyword("");
    setActiveHitIndex(0);
    if (!q) return;
    // 同页搜索：直接用 setTimeout 在 React 状态更新和 DOM 提交后执行高亮
    // 不依赖 useLayoutEffect/useEffect，避免 React 渲染周期导致 timer 被清理
    // 延迟 100ms 确保 React 完成 DOM 提交后再操作
    if (slug === selectedPost.slug) {
      setTimeout(() => {
        const container = contentRef.current;
        if (container) {
          highlightInPlace(container, q);
        }
      }, 100);
      return;
    }
    // 跨页跳转
    pendingSearchQuery = q;
    const href = `${buildPostHref(slug)}?q=${encodeURIComponent(q)}`;
    router.push(href);
  };

  // 栏目 → 分类 → 文章 分组与排序（基于全量 metas，不再被搜索过滤）
  const groupedColumns: GroupedColumns = useMemo(() => {
    const map: Record<string, Record<string, PostMeta[]>> = {};
    for (const column of columns) map[column] = {};

    for (const post of metas) {
      if (!map[post.column]) map[post.column] = {};
      if (!map[post.column][post.category]) map[post.column][post.category] = [];
      map[post.column][post.category].push(post);
    }

    return columns.map((column) => {
      const categories = map[column] ?? {};
      const categoryNames = Object.keys(categories);

      // 每个分类内：weight 降序 → date 降序
      const sortedCategories = categoryNames.map((category) => {
        const posts = (categories[category] ?? []).slice().sort((a, b) => {
          const wa = a.weight ?? 0;
          const wb = b.weight ?? 0;
          if (wb !== wa) return wb - wa;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        return { category, posts };
      });

      // 分类顺序：按首篇文章 weight 降序 → 首篇 date 降序
      sortedCategories.sort((a, b) => {
        const pa = a.posts[0];
        const pb = b.posts[0];
        if (!pa && !pb) return 0;
        if (!pa) return 1;
        if (!pb) return -1;
        const wa = pa.weight ?? 0;
        const wb = pb.weight ?? 0;
        if (wb !== wa) return wb - wa;
        return new Date(pb.date).getTime() - new Date(pa.date).getTime();
      });

      return { column, categories: sortedCategories };
    });
  }, [columns, metas]);

  // 初始化分类折叠状态
  useEffect(() => {
    setOpenCategories((prev) => {
      const next: Record<string, Record<string, boolean>> = { ...prev };
      for (const group of groupedColumns) {
        if (!next[group.column]) next[group.column] = {};
        for (const { category } of group.categories) {
          if (next[group.column][category] === undefined) {
            next[group.column][category] = true;
          }
        }
      }
      return next;
    });
  }, [groupedColumns]);

  // 优先使用服务端预算的 headings；缺失时回退到客户端解析 content（兼容旧调用方）
  const tocItems = useMemo(
    () => selectedPost.headings ?? extractHeadings(selectedPost.content),
    [selectedPost.headings, selectedPost.content]
  );
  const tocIds = useMemo(() => tocItems.map((item) => item.id), [tocItems]);
  const activeTocId = useScrollSpy(tocIds);

  const contentRef = useRef<HTMLElement | null>(null);
  useCodeBlockUI(contentRef, [selectedPost.slug, selectedPost.code]);
  // 搜索跳转后定位并闪烁：从 pendingSearchQuery 或 URL ?q= 读取关键字
  useSearchHighlight(contentRef, selectedPost.slug);

  // 折叠处理函数
  const toggleColumn = (column: string) =>
    setOpenColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  const toggleCategory = (column: string, category: string) =>
    setOpenCategories((prev) => ({
      ...prev,
      [column]: {
        ...(prev[column] ?? {}),
        [category]: !(prev[column]?.[category] ?? true),
      },
    }));

  // 共用列表组件的 props
  const columnListProps = {
    groupedColumns,
    activeColumn,
    selectedSlug: selectedPost.slug,
    openColumns,
    openCategories,
    onToggleColumn: toggleColumn,
    onToggleCategory: toggleCategory,
    buildPostHref,
  };

  return (
    <div className={`wiki-shell min-h-screen ${isSameColumnNav ? "no-module-fade" : ""}`}>
      {/* ============ 顶部导航栏 ============ */}
      <header className="wiki-topbar sticky top-0 z-50 border-b">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
          {/* 移动端汉堡菜单 */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden rounded-md p-2"
            aria-label="打开栏目导航"
          >
            <Menu size={20} />
          </button>

          <Link href="/" className="wiki-brand flex items-center gap-2 font-semibold" title="回到首页">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.svg" alt="Firefly" width={40} height={40} />
            <span>Firefly_IV&apos;s Blog</span>
          </Link>

          {/* 桌面端栏目按钮 */}
          <div className="hidden items-center gap-1 lg:flex">
            <ColumnTabs
              columns={columns}
              groupedColumns={groupedColumns}
              activeColumn={activeColumn}
              buildPostHref={buildPostHref}
              variant="desktop"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="wiki-search-box relative flex items-center gap-2 rounded-md px-3 py-1.5">
              <Search size={16} className="opacity-70" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onFocus={() => {
                  if (keyword.trim()) setSearchOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="搜索文章..."
                className="wiki-search-input w-32 bg-transparent text-sm outline-none sm:w-48 md:w-64"
                role="combobox"
                aria-expanded={searchOpen}
                aria-controls="wiki-search-popover"
                aria-autocomplete="list"
              />
              <SearchPopover
                query={keyword}
                hits={searchHits}
                open={searchOpen}
                activeIndex={activeHitIndex}
                currentSlug={selectedPost.slug}
                onNavigate={handleNavigateFromSearch}
                onClose={() => setSearchOpen(false)}
              />
            </div>
            <button
              onClick={toggleTheme}
              className="wiki-theme-btn rounded-md p-2"
              title={isDark ? "当前：暗色模式（点击切换到亮色）" : "当前：亮色模式（点击切换到暗色）"}
              aria-pressed={isDark}
              aria-label={isDark ? "切换到亮色模式" : "切换到暗色模式"}
              suppressHydrationWarning
            >
              {/* 同时渲染两个图标，由 CSS [data-theme] 控制显隐，避免 hydration mismatch
                  图标语义：显示当前状态（亮色显 Sun、暗色显 Moon），点击切换到另一模式 */}
              <Sun size={16} className="wiki-theme-icon-light" />
              <Moon size={16} className="wiki-theme-icon-dark" />
            </button>
          </div>
        </div>
      </header>

      {/* ============ 移动端栏目抽屉（顶部下滑） ============ */}
      {mobileNavOpen && (
        <div className="mobile-drawer lg:hidden" role="dialog" aria-modal="true">
          <div className="mobile-drawer-mask" onClick={() => setMobileNavOpen(false)} />
          <div className="mobile-drawer-panel mobile-drawer-panel--top">
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-semibold">栏目</span>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md p-1.5"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-2">
              <ColumnTabs
                columns={columns}
                groupedColumns={groupedColumns}
                activeColumn={activeColumn}
                buildPostHref={buildPostHref}
                onNavigate={() => setMobileNavOpen(false)}
                variant="mobile"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============ 三栏主体布局 ============ */}
      <div className="wiki-main-grid mx-auto grid max-w-[1600px] grid-cols-1 gap-6 p-6 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
        {/* 桌面端左侧栏 */}
        <aside className="wiki-sidebar hidden p-5 lg:block">
          <ColumnCategoryList {...columnListProps} variant="desktop" />
        </aside>

        {/* 中间内容区 */}
        <main className="wiki-content min-h-[calc(100vh-56px)] px-6 py-8 lg:px-12 lg:py-10">
          <article ref={contentRef} key={selectedPost.slug} className="mx-auto max-w-3xl">
            <h1 className="mb-5 text-3xl font-semibold tracking-tight lg:text-4xl">
              {selectedPost.title}
            </h1>

            <div className="mb-6 flex flex-wrap items-center gap-4 text-sm opacity-80">
              <span>{format(new Date(selectedPost.date), "yyyy年MM月dd日", { locale: zhCN })}</span>
              <span>•</span>
              <span>{Math.max(1, Math.ceil((selectedPost.content?.length ?? 0) / 300))} 分钟阅读</span>
              <span>•</span>
              <span>{selectedPost.column}</span>
              <span>•</span>
              <span>{selectedPost.category}</span>
              <span>•</span>
              <ViewCount slug={selectedPost.slug} />
            </div>

            {selectedPost.tags && selectedPost.tags.length > 0 && (
              <TagList tags={selectedPost.tags} size="md" />
            )}

            {selectedPost.summary && (
              <div className="wiki-summary mb-8 rounded border-l-4 px-4 py-3 italic">
                {selectedPost.summary}
              </div>
            )}

            {/* 移动端顶部折叠目录 */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setTocOpen((v) => !v)}
                className="mobile-toc-toggle flex w-full items-center justify-between rounded-md px-3 py-2 text-sm"
                aria-expanded={tocOpen}
              >
                <span className="font-semibold">目录（{tocItems.length}）</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${tocOpen ? "rotate-0" : "-rotate-90"}`}
                />
              </button>
              {tocOpen && (
                <ul className="mt-2 space-y-1 text-sm pl-2">
                  <TocList items={tocItems} activeId={activeTocId} />
                </ul>
              )}
            </div>

            <div className="prose wiki-prose max-w-none">
              <MDXContent code={selectedPost.code} components={mdxComponents} />
            </div>
          </article>
        </main>

        {/* 桌面端右侧目录 */}
        <aside className="wiki-toc hidden p-5 lg:block">
          <h2 className="mb-2 text-base font-semibold">目录</h2>
          <ul className="space-y-1 text-sm">
            <TocList items={tocItems} activeId={activeTocId} />
          </ul>
        </aside>
      </div>

      {/* ============ 移动端文章列表抽屉（右侧滑入） ============ */}
      {sidebarOpen && (
        <div className="mobile-drawer lg:hidden" role="dialog" aria-modal="true">
          <div className="mobile-drawer-mask" onClick={() => setSidebarOpen(false)} />
          <div className="mobile-drawer-panel mobile-drawer-panel--right">
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-semibold">{activeColumn}</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-md p-1.5"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 56px)" }}>
              <ColumnCategoryList
                {...columnListProps}
                onNavigate={() => setSidebarOpen(false)}
                variant="mobile"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============ 移动端浮动按钮：打开文章列表抽屉 ============ */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="mobile-fab lg:hidden"
        aria-label="打开文章列表"
      >
        <List size={22} />
      </button>
    </div>
  );
}
