"use client";

import { useEffect, useRef } from "react";

interface Meteor {
    x: number;
    y: number;
    len: number;
    speed: number;
    angle: number;
    opacity: number;
    life: number;
    maxLife: number;
}

/**
 * 动态背景组件：固定背景图 + Canvas 流星动画
 *
 * 性能优化：
 * - 限制流星数量（最多 3 条同时存在）
 * - 每帧只更新少量粒子
 * - 使用 requestAnimationFrame
 * - 页面不可见时暂停动画
 */
export function MeteorBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const meteorsRef = useRef<Meteor[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);

        const spawnMeteor = () => {
            // 从屏幕上方/右上方随机位置生成
            const startX = Math.random() * width * 1.3;
            const startY = Math.random() * height * 0.4;
            meteorsRef.current.push({
                x: startX,
                y: startY,
                len: 80 + Math.random() * 120,
                speed: 3 + Math.random() * 4,
                angle: Math.PI * 0.75 + (Math.random() - 0.5) * 0.2, // 向左下方
                opacity: 0,
                life: 0,
                maxLife: 60 + Math.random() * 40,
            });
        };

        let spawnTimer = 0;
        const spawnInterval = 80 + Math.random() * 60; // 约 1.3-2.3 秒生成一条

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // 生成新流星
            spawnTimer++;
            if (spawnTimer >= spawnInterval && meteorsRef.current.length < 3) {
                spawnMeteor();
                spawnTimer = 0;
            }

            // 更新和绘制流星
            meteorsRef.current = meteorsRef.current.filter((m) => {
                m.life++;
                m.x += Math.cos(m.angle) * m.speed;
                m.y += Math.sin(m.angle) * m.speed;

                // 淡入淡出
                if (m.life < 10) {
                    m.opacity = m.life / 10;
                } else if (m.life > m.maxLife - 15) {
                    m.opacity = Math.max(0, (m.maxLife - m.life) / 15);
                } else {
                    m.opacity = 1;
                }

                // 绘制流星拖尾
                const tailX = m.x - Math.cos(m.angle) * m.len;
                const tailY = m.y - Math.sin(m.angle) * m.len;

                const gradient = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
                gradient.addColorStop(0, `rgba(255, 240, 200, ${m.opacity * 0.9})`);
                gradient.addColorStop(0.3, `rgba(200, 220, 255, ${m.opacity * 0.5})`);
                gradient.addColorStop(1, "rgba(200, 220, 255, 0)");

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(m.x, m.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();

                // 流星头部光点
                ctx.fillStyle = `rgba(255, 255, 240, ${m.opacity})`;
                ctx.beginPath();
                ctx.arc(m.x, m.y, 1.5, 0, Math.PI * 2);
                ctx.fill();

                return m.life < m.maxLife && m.x > -200 && m.y < height + 200;
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        // 页面可见性检测：不可见时暂停
        const handleVisibility = () => {
            if (document.hidden) {
                cancelAnimationFrame(rafRef.current);
            } else {
                rafRef.current = requestAnimationFrame(animate);
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    return (
        <div className="meteor-bg">
            {/* 背景图：固定定位，cover 填充 */}
            <div className="meteor-bg-image" />
            {/* 半透明遮罩：确保内容可读性 */}
            <div className="meteor-bg-overlay" />
            {/* Canvas 流星层 */}
            <canvas ref={canvasRef} className="meteor-bg-canvas" />
        </div>
    );
}
