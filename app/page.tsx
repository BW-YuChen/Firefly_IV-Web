import { redirect } from "next/navigation";

export default function Home() {
  redirect(encodeURI("/blog/Welcome/首页/welcome"));
}