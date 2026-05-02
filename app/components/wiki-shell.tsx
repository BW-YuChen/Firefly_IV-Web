"use client";

import Link from "next/link";
import { MDXContent } from "@content-collections/mdx/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { BookOpen, ChevronDown, Moon, Search, Sun } from "lucide-react";
import { ReactNode, useEffect, useMemo, useState, useRef } from "react";

type ColumnName = "Welcome" | "ACM" | "游记" | "游戏" | "关于";

type PostMeta = {
  slug: string;
  title: string;
  summary?: string;
  tags?: string[];
  date: string;
  column: ColumnName;
  category: string;
};

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
  columns: ColumnName[];
  metas: PostMeta[];
  selectedPost: SelectedPost;
};

function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5\-]/g, "");
}

function toPlainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((item) => toPlainText(item)).join("");
  }

  if (node && typeof node === "object" && "props" in node) {
    const value = node as { props?: { children?: ReactNode } };
    return toPlainText(value.props?.children ?? "");
  }

  return "";
}

function extractHeadings(markdown: string): HeadingItem[] {
  const lines = markdown.split("\n");
  const result: HeadingItem[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (!match) {
      continue;
    }
    const level = match[1].length;
    const text = match[2].trim();
    result.push({ id: slugifyHeading(text), level, text });
  }

  return result;
}

export default function WikiShell({ columns, metas, selectedPost }: Props) {
  const [keyword, setKeyword] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [openColumns, setOpenColumns] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columns.map((column) => [column, true]))
  );
  const [activeColumn, setActiveColumn] = useState<ColumnName | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("wiki-theme");
    const dark = saved === "dark";
    setIsDark(dark);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, []);

  useEffect(() => {
    // read ?column= query to preset active column
    try {
      const url = new URL(window.location.href);
      const col = url.searchParams.get("column");
      if (col) {
        setActiveColumn(col as ColumnName);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    window.localStorage.setItem("wiki-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Syntax highlighting: dynamically load Prism and languages on client
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const PrismModule = await import("prismjs");
        // load common language components
        // @ts-ignore - dynamic import of prism components (no declarations)
        await import("prismjs/components/prism-clike");
        // @ts-ignore
        await import("prismjs/components/prism-python");
        // @ts-ignore
        await import("prismjs/components/prism-cpp");
        // @ts-ignore
        await import("prismjs/components/prism-java");
        const Prism = PrismModule?.default ?? PrismModule;
        if (mounted && Prism && typeof Prism.highlightAll === "function") {
          // highlight after a short delay to allow MDX content to render
          setTimeout(() => Prism.highlightAll(), 50);
        }
      } catch (e) {
        // fail silently
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedPost.slug]);

  const filteredMetas = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) {
      return metas;
    }

    return metas.filter((post) => {
      const title = post.title.toLowerCase();
      const summary = (post.summary ?? "").toLowerCase();
      const tags = (post.tags ?? []).join(" ").toLowerCase();
      return title.includes(q) || summary.includes(q) || tags.includes(q);
    });
  }, [keyword, metas]);

  const grouped = useMemo(() => {
    const map: Record<string, Record<string, PostMeta[]>> = {};

    for (const column of columns) {
      map[column] = {};
    }

    for (const post of filteredMetas) {
      if (!map[post.column]) {
        map[post.column] = {};
      }
      if (!map[post.column][post.category]) {
        map[post.column][post.category] = [];
      }
      map[post.column][post.category].push(post);
    }

    return map;
  }, [columns, filteredMetas]);

  const tocItems = useMemo(() => extractHeadings(selectedPost.content), [selectedPost.content]);

  // Ensure Prism and required language definitions are loaded on the client.
  // Cache the loader on window to avoid duplicate imports across components.
  async function ensurePrism() {
    if (typeof window === "undefined") return null;
    const anyWin = window as any;
    if (anyWin.__prism) return anyWin.__prism;
    anyWin.__prism = (async () => {
      try {
        const PrismModule = await import("prismjs");
        // load common language components we use
        // @ts-ignore
        await import("prismjs/components/prism-clike");
        // @ts-ignore
        await import("prismjs/components/prism-cpp");
        // @ts-ignore
        await import("prismjs/components/prism-python");
        // @ts-ignore
        await import("prismjs/components/prism-javascript");
        // return default export if present
        return PrismModule?.default ?? PrismModule;
      } catch (e) {
        return null;
      }
    })();
    return anyWin.__prism;
  }

  // Normalize language id (e.g. "c++" -> "cpp", uppercase -> lowercase)
  function normalizeLang(raw?: string) {
    if (!raw) return "";
    let lang = raw.replace(/^language-/, "").toLowerCase();
    if (lang === "c++") return "cpp";
    if (lang === "c#") return "csharp";
    if (lang === "js") return "javascript";
    return lang.replace(/[+]/g, "p");
  }

  const mdxComponents = {
    h1: ({ children, ...props }: { children?: ReactNode }) => {
      const id = slugifyHeading(toPlainText(children));
      return (
        <h1 id={id} {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }: { children?: ReactNode }) => {
      const id = slugifyHeading(toPlainText(children));
      return (
        <h2 id={id} {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: { children?: ReactNode }) => {
      const id = slugifyHeading(toPlainText(children));
      return (
        <h3 id={id} {...props}>
          {children}
        </h3>
      );
    },
    // Custom code renderer: normalize language class and highlight after Prism is loaded
    code: ({ className, children, ...props }: { className?: string; children?: any }) => {
      const ref = useRef<HTMLElement | null>(null);

      // derive language early so server markup has correct class when possible
      const raw = className ?? "";
      const lang = normalizeLang(raw);
      const preClass = lang ? `language-${lang}` : raw;

      useEffect(() => {
        let mounted = true;
        (async () => {
          const Prism = await ensurePrism();
          if (!mounted || !Prism) return;

          const el = ref.current;
          if (!el) return;

          try {
            Prism.highlightElement(el);
          } catch (e) {
            // ignore highlighting errors
          }
        })();
        return () => {
          mounted = false;
        };
      }, [className, children]);

      // normalize children to plain text to ensure Prism sees raw code
      const text = Array.isArray(children) ? children.join("") : String(children ?? "");

      // if there's no language class, render inline code; otherwise render block
      if (!preClass) {
        return (
          <code className={preClass} {...props}>
            {text}
          </code>
        );
      }

      return (
        <pre>
          <code ref={ref} className={preClass} {...props}>
            {text}
          </code>
        </pre>
      );
    },
  };

  return (
    <div className="wiki-shell min-h-screen">
      <header className="wiki-topbar sticky top-0 z-50 border-b">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
          <Link href="/" className="wiki-brand flex items-center gap-2 font-semibold" title="回到首页">
            {/* 使用 public 下的静态 favicon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.svg" alt="Firefly" width={18} height={18} />
            <span>Firefly_IV's Blog</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {columns.map((column) => (
              <button
                key={column}
                onClick={() => {
                  const next = activeColumn === column ? null : (column as ColumnName);
                  setActiveColumn(next);
                  try {
                    const url = new URL(window.location.href);
                    if (next) url.searchParams.set("column", String(next));
                    else url.searchParams.delete("column");
                    window.history.replaceState({}, "", url.toString());
                  } catch (e) {}
                }}
                className={`wiki-column-tab rounded px-2 py-1 text-sm ${activeColumn === column ? "active" : ""}`}
              >
                {column}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="wiki-search-box flex items-center gap-2 rounded-md px-3 py-1.5">
              <Search size={16} className="opacity-70" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索标题、概要、标签"
                className="wiki-search-input w-48 bg-transparent text-sm outline-none md:w-64"
              />
            </div>
            <button
              onClick={() => setIsDark((prev) => !prev)}
              className="wiki-theme-btn rounded-md p-2"
              title="切换夜间模式"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-0 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
        <aside className="wiki-sidebar border-r p-4">
          {columns.map((column) => {
            if (activeColumn && activeColumn !== column) return null;
            const categories = grouped[column] ?? {};
            const categoryNames = Object.keys(categories).sort();
            const isOpen = openColumns[column] ?? true;

            return (
              <section key={column} className="mb-4">
                <button
                  className="wiki-column-row flex w-full items-center justify-between rounded px-2 py-1 text-left"
                  onClick={() =>
                    setOpenColumns((prev) => ({
                      ...prev,
                      [column]: !isOpen,
                    }))
                  }
                >
                  <span className="font-semibold">{column}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
                  />
                </button>

                {isOpen && (
                  <div className="mt-1 space-y-2">
                    {categoryNames.length === 0 && (
                      <div className="px-3 py-1 text-xs opacity-60">暂无分类</div>
                    )}

                    {categoryNames.map((category) => (
                      <div key={`${column}-${category}`} className="pl-2">
                        <div className="wiki-category text-sm font-medium">{category}</div>
                        <ul className="mt-1 space-y-1 pl-3">
                          {categories[category].map((post) => (
                            <li key={post.slug}>
                              <Link
                                href={`/blog/${post.slug}`}
                                className={`wiki-post-link block rounded px-2 py-1 text-sm ${
                                  post.slug === selectedPost.slug ? "is-active" : ""
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
                )}
              </section>
            );
          })}
        </aside>

        <main className="wiki-content min-h-[calc(100vh-56px)] px-6 py-8 lg:px-10">
          <article className="mx-auto max-w-4xl">
            <h1 className="mb-5 text-4xl font-semibold tracking-tight">{selectedPost.title}</h1>

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

            <div className="prose wiki-prose max-w-none">
              <MDXContent code={selectedPost.code} components={mdxComponents} />
            </div>
          </article>
        </main>

        <aside className="wiki-toc border-l p-4">
          <div className="sticky top-20">
            <h2 className="mb-2 text-base font-semibold">目录</h2>
            <ul className="space-y-1 text-sm">
              {tocItems.length === 0 && <li className="opacity-60">当前文章无标题目录</li>}
              {tocItems.map((item) => (
                <li key={`${item.id}-${item.text}`} style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
                  <a href={`#${item.id}`} className="wiki-toc-link inline-flex items-center gap-1">
                    <ChevronDown size={12} className="-rotate-90" />
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
