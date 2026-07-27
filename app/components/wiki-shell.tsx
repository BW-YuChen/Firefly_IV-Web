"use client";

import Link from "next/link";
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
import { useEffect, useMemo, useState, useRef } from "react";
import type { ColumnName, PostMeta } from "@/lib/content";

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
};

// ============================================================
// 自定义 hook：主题管理（亮/暗）
// ============================================================

function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("wiki-theme");
    const dark = saved === "dark";
    setIsDark(dark);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    window.localStorage.setItem("wiki-theme", isDark ? "dark" : "light");
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
// 自定义 hook：代码块 UI 注入（工具栏 + 行号 + Prism 兜底高亮）
// ============================================================

function useCodeBlockUI(
  contentRef: React.RefObject<HTMLDivElement | null>,
  deps: Array<string>
) {
  useEffect(() => {
    let observer: MutationObserver | null = null;
    const blockSelector = ".rehype-pretty-code, [data-rehype-pretty-code-figure]";

    const ensurePrism = async () => {
      if (typeof window === "undefined") return null;
      const anyWin = window as any;
      if (anyWin.__prism) return anyWin.__prism;
      anyWin.__prism = (async () => {
        try {
          const PrismModule = await import("prismjs");
          // @ts-ignore
          await import("prismjs/components/prism-clike");
          // @ts-ignore
          await import("prismjs/components/prism-cpp");
          // @ts-ignore
          await import("prismjs/components/prism-python");
          // @ts-ignore
          await import("prismjs/components/prism-javascript");
          // @ts-ignore
          await import("prismjs/components/prism-bash");
          return PrismModule?.default ?? PrismModule;
        } catch {
          return null;
        }
      })();
      return anyWin.__prism;
    };

    let isInjecting = false;
    const injectUI = () => {
      if (isInjecting) return;
      isInjecting = true;
      try {
        const container = contentRef.current as HTMLElement | null;
        if (!container) return;

        // 行号已改用 CSS counter 自动生成（见 globals.css），不再需要 JS 注入

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

        // Fallback：仅当 rehype-pretty-code 未生成 token 时才用 Prism 高亮
        ensurePrism().then((Prism) => {
          if (!Prism || typeof Prism.highlightElement !== "function") return;
          const codeBlocks = Array.from(container.querySelectorAll(`${blockSelector} code`));
          for (const codeEl of codeBlocks) {
            if (codeEl.querySelector(".token")) continue;
            Prism.highlightElement(codeEl);
          }
        });
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
                          {post.title}
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
                                {post.title}
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

  // 搜索过滤
  const filteredMetas = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return metas;
    return metas.filter((post) => {
      const title = post.title.toLowerCase();
      const summary = (post.summary ?? "").toLowerCase();
      const tags = (post.tags ?? []).join(" ").toLowerCase();
      return title.includes(q) || summary.includes(q) || tags.includes(q);
    });
  }, [keyword, metas]);

  // 栏目 → 分类 → 文章 分组与排序
  const groupedColumns: GroupedColumns = useMemo(() => {
    const map: Record<string, Record<string, PostMeta[]>> = {};
    for (const column of columns) map[column] = {};

    for (const post of filteredMetas) {
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
  }, [columns, filteredMetas]);

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

  const tocItems = useMemo(() => extractHeadings(selectedPost.content), [selectedPost.content]);
  const tocIds = useMemo(() => tocItems.map((item) => item.id), [tocItems]);
  const activeTocId = useScrollSpy(tocIds);

  const contentRef = useRef<HTMLDivElement | null>(null);
  useCodeBlockUI(contentRef, [selectedPost.slug, selectedPost.code]);

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
    <div className="wiki-shell min-h-screen">
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
            <div className="wiki-search-box flex items-center gap-2 rounded-md px-3 py-1.5">
              <Search size={16} className="opacity-70" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索标题、概要、标签"
                className="wiki-search-input w-32 bg-transparent text-sm outline-none sm:w-48 md:w-64"
              />
            </div>
            <button
              onClick={toggleTheme}
              className="wiki-theme-btn rounded-md p-2"
              title="切换夜间模式"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
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
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-0 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
        {/* 桌面端左侧栏 */}
        <aside className="wiki-sidebar hidden border-r p-4 lg:block">
          <ColumnCategoryList {...columnListProps} variant="desktop" />
        </aside>

        {/* 中间内容区 */}
        <main className="wiki-content min-h-[calc(100vh-56px)] px-4 py-6 lg:px-10 lg:py-8">
          <article className="mx-auto max-w-4xl">
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
            </div>

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

            <div ref={contentRef} className="prose wiki-prose max-w-none">
              <MDXContent code={selectedPost.code} components={mdxComponents} />
            </div>
          </article>
        </main>

        {/* 桌面端右侧目录 */}
        <aside className="wiki-toc hidden border-l p-4 lg:block">
          <div className="sticky top-20">
            <h2 className="mb-2 text-base font-semibold">目录</h2>
            <ul className="space-y-1 text-sm">
              <TocList items={tocItems} activeId={activeTocId} />
            </ul>
          </div>
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
