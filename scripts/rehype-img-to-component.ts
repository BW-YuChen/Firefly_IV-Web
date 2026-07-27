// rehype 插件：把 MDX 里的原生 <img> 元素转成 <Img> 组件调用
// 这样 mdxComponents 里的 Img 组件（基于 next/image）才能生效
// 原因：MDX 编译器把小写 HTML 标签（如 img）编译成字符串 "img"，
// 不走 components 映射；大写标签（如 Img）才会从 components 取
import type { Root } from "hast";

export default function rehypeImgToComponent() {
  return (tree: Root) => {
    visit(tree, (node: any) => {
      if (node.type === "element" && node.tagName === "img") {
        // 把小写 img 改成大写 Img，MDX 会把它当作组件，从 components 映射中取
        node.tagName = "Img";
      }
    });
  };
}

// 简易树遍历
function visit(node: any, fn: (node: any) => void) {
  fn(node);
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      visit(child, fn);
    }
  }
}
