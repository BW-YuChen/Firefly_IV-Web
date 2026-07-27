import { redirect } from "next/navigation";

export default function BlogPage() {
    redirect(encodeURI("/blog/Welcome/首页/welcome"));
}