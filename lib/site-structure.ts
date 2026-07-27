export const SITE_COLUMNS = ["Welcome", "ACM", "游记", "集训", "关于"] as const;

export type ColumnName = (typeof SITE_COLUMNS)[number];

export type ColumnDirectoryConfig = {
    categoryOrder?: string[];
    postOrder?: Record<string, string[]>;
};

export type SiteDirectoryConfig = Partial<Record<ColumnName, ColumnDirectoryConfig>>;

// 侧边栏目录系统：可在这里手动控制栏目/分类/文章顺序。
// 规则：
// 1) categoryOrder 控制该栏目下分类顺序。
// 2) postOrder[分类名] 控制该分类下文章顺序（使用 slug，如 "游记/26ZJCPC"）。
// 3) 未写入配置的分类/文章会自动追加在后面（不会丢失）。
export const SITE_DIRECTORY_CONFIG: SiteDirectoryConfig = {
    Welcome: {
        categoryOrder: ["首页"],
        postOrder: {
            首页: ["Welcome/welcome"],
        },
    },
    ACM: {
        categoryOrder: [],
        postOrder: {},
    },
    游记: {
        categoryOrder: ["ZJCPC浙江省赛"],
        postOrder: {
            ZJCPC浙江省赛: ["游记/26ZJCPC"],
        },
    },
    集训: {
        categoryOrder: ["基础", "面向对象", "集合", "并发", "JVM", "实战"],
        postOrder: {
            基础: [],
            面向对象: [],
            集合: [],
            并发: [],
            JVM: [],
            实战: [],
        },
    },
    关于: {
        categoryOrder: ["关于作者"],
        postOrder: {
            关于作者: ["关于/关于"],
        },
    },
};
