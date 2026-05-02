// content-collections.ts
import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import { z } from "zod";

const columnSchema = z.enum(["Welcome", "ACM", "游记", "游戏", "关于"]);

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
        column: columnSchema.default("Welcome"),
        category: z.string().default("默认分类"),
        content: z.string(),
    }),
    transform: async (document, context) => {
        const code = await compileMDX(context, document);
        return {
            ...document,
            code,
        };
    },
});

export default defineConfig({
    content: [posts],
});