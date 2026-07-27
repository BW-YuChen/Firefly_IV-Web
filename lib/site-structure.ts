export const SITE_COLUMNS = ["Welcome", "ACM", "游记", "集训", "关于"] as const;

export type ColumnName = (typeof SITE_COLUMNS)[number];
