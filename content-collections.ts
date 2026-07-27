// content-collections.ts
import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { z } from "zod";
import { SITE_COLUMNS } from "./lib/site-structure";
import rehypeImgToComponent from "./scripts/rehype-img-to-component";

const columnSchema = z.enum(SITE_COLUMNS);

const posts = defineCollection({
    name: "posts",
    directory: "content/posts",
    include: "**/*.{md,mdx}",
    schema: z.object({
        title: z.string(),
        date: z.string(),
        summary: z.string().optional(),
        tags: z.array(z.string()).optional(),
        published: z.boolean().default(true),
        category: z.string().default("默认分类"),
        weight: z.number().default(0),
        content: z.string(),
    }),
    transform: async (document, context) => {
        const rawDirectory = String(document._meta?.directory ?? "");
        const normalized = rawDirectory.replace(/\\/g, "/");
        const segments = normalized.split("/").filter(Boolean);
        const dirSegment = segments[0] ?? "";
        const parsedColumn = columnSchema.safeParse(dirSegment);
        const column = parsedColumn.success ? parsedColumn.data : "Welcome";
        // 分类从路径第二段推导；路径无第二段时回退到 frontmatter 的 category
        const categoryFromPath = segments[1] ?? document.category ?? "默认分类";
        const prettyCodeOptions = {
            // Use light/dark themes (shiki theme names)
            theme: { light: "github-light", dark: "github-dark" },
            // Enable line numbers
            keepBackground: false,
            onVisitLine(node: any) {
                // ensure empty lines keep height so copy/line numbers align
                if (node.children.length === 0) {
                    node.children = [{ type: "text", value: " " }];
                }
            },
            onVisitHighlightedLine(node: any) {
                node.properties = node.properties || {};
                node.properties.className = (node.properties.className || []).concat("line--highlighted");
            },
            onVisitHighlightedWord(node: any) {
                node.properties = node.properties || {};
                node.properties.className = (node.properties.className || []).concat("word--highlighted");
            },
        };

        const code = await compileMDX(context, document, {
            remarkPlugins: [remarkMath],
            rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions], rehypeKatex, rehypeImgToComponent],
        });

        return {
            ...document,
            column,
            category: categoryFromPath,
            code,
        };
    },
});

export default defineConfig({
    content: [posts],
});