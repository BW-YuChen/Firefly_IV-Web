// content-collections.ts
import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import rehypePrettyCode from "rehype-pretty-code";
import { z } from "zod";
import { SITE_COLUMNS } from "./lib/site-structure";

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
        content: z.string(),
    }),
    transform: async (document, context) => {
        const rawDirectory = String(document._meta?.directory ?? "");
        const dirSegment = rawDirectory.split(/[\\/]/)[0];
        const parsedColumn = columnSchema.safeParse(dirSegment);
        const column = parsedColumn.success ? parsedColumn.data : "Welcome";
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
            rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
        });

        return {
            ...document,
            column,
            code,
        };
    },
});

export default defineConfig({
    content: [posts],
});