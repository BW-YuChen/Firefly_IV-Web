"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 开屏页：纯背景 + 主标题 + 逐字打字小字 + 自动跳转
 * - 主标题 "Firefly IV" 渐入显示
 * - 副标题 "我将，点燃星海！" 逐字打字
 * - 打字完成后约 4.8 秒淡出后跳转 /blog/Welcome/首页/welcome
 * - 任意鼠标点击立即淡出跳转
 */
export function SplashScreen() {
    const router = useRouter();
    const subtitle = "我将，点燃星海！";
    const [typed, setTyped] = useState("");
    const [titleVisible, setTitleVisible] = useState(false);
    const [fadingOut, setFadingOut] = useState(false);
    const redirectedRef = useRef(false);
    const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 跳转：先触发淡出动画，动画结束后再路由跳转，避免突兀
    const go = () => {
        if (redirectedRef.current) return;
        redirectedRef.current = true;
        setFadingOut(true);
        // 等待淡出动画完成（0.8s）后再跳转
        setTimeout(() => {
            router.replace(encodeURI("/blog/Welcome/首页/welcome"));
        }, 800);
    };

    useEffect(() => {
        // 主标题渐入
        const t1 = setTimeout(() => setTitleVisible(true), 150);

        // 副标题逐字打字（每字 180ms）
        let i = 0;
        const typeTimer = setInterval(() => {
            i++;
            setTyped(subtitle.slice(0, i));
            if (i >= subtitle.length) {
                clearInterval(typeTimer);
                // 打字完成后 4.8 秒淡出跳转（原 1.8s + 延长 3s）
                const redirectTimer = setTimeout(go, 4800);
                redirectTimerRef.current = redirectTimer;
            }
        }, 180);

        return () => {
            clearTimeout(t1);
            clearInterval(typeTimer);
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <button
            type="button"
            className={`splash-screen ${fadingOut ? "is-fading-out" : ""}`}
            onClick={go}
            aria-label="点击进入博客"
        >
            <h1 className={`splash-title ${titleVisible ? "is-visible" : ""}`}>
                Firefly IV
            </h1>
            <p className="splash-subtitle" data-text={subtitle}>
                {typed}
                <span className="splash-cursor" aria-hidden="true">|</span>
            </p>
        </button>
    );
}
