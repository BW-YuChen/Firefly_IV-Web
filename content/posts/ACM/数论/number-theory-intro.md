---
title: "数学基础"
date: "2026-07-27"
summary: "数论是算法竞赛中非常重要的基础模块，涉及整除、同余、素数、欧拉函数等核心概念。本文汇总 ACM 常用数学符号与记号。"
tags: ["ACM", "数论", "竞赛"]
published: true
category: "数论"
weight: 999
---

## 一般学习路线

- **基础**：最大公约数（GCD）、最小公倍数（LCM）、扩展欧几里得算法
- **同余**：模运算、线性同余方程、中国剩余定理
- **素数**：埃氏筛、线性筛、Miller-Rabin 素性测试
- **数论函数**：欧拉函数、莫比乌斯函数、狄利克雷卷积
- **进阶**：BSGS、原根与离散对数

后续每篇笔记都会沿用本篇约定的符号记号，遇到不熟悉的记号可回到这里查阅。

## 数集

数论中常用花体字母表示特定数集，记号如下：

| 记号 | 含义 | 示例 |
|---|---|---|
| $\mathbb{N}$ | 自然数集（含 $0$） | $0, 1, 2, \ldots$ |
| $\mathbb{N}^{+}$ | 正整数集 | $1, 2, 3, \ldots$ |
| $\mathbb{Z}$ | 整数集 | $\ldots, -2, -1, 0, 1, 2, \ldots$ |
| $\mathbb{Q}$ | 有理数集 | $\frac{p}{q},\ p \in \mathbb{Z},\ q \in \mathbb{N}^{+}$ |
| $\mathbb{R}$ | 实数集 | $0.5,\ \sqrt{2},\ \pi$ |
| $\mathbb{C}$ | 复数集 | $1 + 2i$ |
| $\mathbb{P}$ | 素数集 | $2, 3, 5, 7, 11, \ldots$ |

不加说明时，本系列中变量默认取整数（$\mathbb{Z}$）。

## 整除与同余

整除记号写作 $a \mid b$，读作「$a$ 整除 $b$」，等价于存在整数 $k$ 使 $b = ka$。不整除记作 $a \nmid b$。

$$a \mid b \iff \exists\, k \in \mathbb{Z},\ b = ka$$

同余记号 $a \equiv b \pmod m$ 表示 $a$ 与 $b$ 模 $m$ 的余数相同，等价于 $m \mid (a - b)$。

$$a \equiv b \pmod m \iff m \mid (a - b)$$

带余除法是整除理论的基石：对任意 $a \in \mathbb{Z}$ 与 $b \in \mathbb{N}^{+}$，存在唯一的 $q, r \in \mathbb{Z}$ 满足

$$a = bq + r,\quad 0 \leq r < b$$

其中 $r = a \bmod b$ 是程序里取模运算的数学定义。

## 求和与求积

连加记号 $\sum$ 与连乘记号 $\prod$ 用于紧凑表达数列：

$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}, \qquad \prod_{i=1}^{n} i = n!$$

下标范围可省略（默认遍历所有使表达式有意义的整数），也可用条件限定：

$$\sum_{d \mid n} d \quad \text{表示} \quad n \text{ 的所有正约数之和}$$

## 阶乘与组合数

阶乘 $n! = \prod_{i=1}^{n} i$，约定 $0! = 1$。组合数与排列数：

$$\binom{n}{m} = \frac{n!}{m!\,(n-m)!}, \qquad A_{n}^{m} = \frac{n!}{(n-m)!}$$

组合数在模意义下的计算是竞赛常见需求，预处理阶乘及其逆元即可在 $O(1)$ 时间内回答单次查询。

## 逻辑与集合

| 记号 | 含义 |
|---|---|
| $\forall$ | 任意（全称量词） |
| $\exists$ | 存在（存在量词） |
| $\exists!$ | 存在唯一 |
| $\neg$ | 非（逻辑否定） |
| $\iff$ | 当且仅当 |
| $\cup,\ \cap$ | 并集、交集 |
| $\setminus$ | 差集 |
| $\subseteq,\ \in$ | 子集、属于 |

## 渐近记号

复杂度分析离不开大 $O$ 等渐近记号。设 $f, g$ 是正函数：

| 记号 | 含义 |
|---|---|
| $f = O(g)$ | 存在常数 $C, N$，$n > N$ 时 $f(n) \leq C \cdot g(n)$ |
| $f = \Omega(g)$ | 存在常数 $C, N$，$n > N$ 时 $f(n) \geq C \cdot g(n)$ |
| $f = \Theta(g)$ | $f = O(g)$ 且 $f = \Omega(g)$ |
| $f = o(g)$ | $\lim_{n \to \infty} \dfrac{f(n)}{g(n)} = 0$ |
| $f = \omega(g)$ | $\lim_{n \to \infty} \dfrac{f(n)}{g(n)} = +\infty$ |

竞赛中常用 $O$ 描述最坏复杂度上界，例如筛素数为 $O(n \log \log n)$，快速幂为 $O(\log n)$。

## 常用数论函数

| 函数 | 定义 |
|---|---|
| $\varphi(n)$ | 欧拉函数，$[1, n]$ 中与 $n$ 互素的正整数个数 |
| $\mu(n)$ | 莫比乌斯函数，平方因子数为 $0$，否则为 $(-1)^{\omega(n)}$ |
| $\tau(n)$ 或 $d(n)$ | 约数个数 |
| $\sigma(n)$ | 约数和 |
| $\pi(n)$ | 不超过 $n$ 的素数个数 |
| $\omega(n)$ | $n$ 的不同素因子个数 |

其中 $\omega(n)$ 是素因子计数函数，与渐近记号 $o$ 无关，需结合上下文区分。

## 取整与特殊运算

| 记号 | 含义 |
|---|---|
| $\lfloor x \rfloor$ | 下取整（地板函数） |
| $\lceil x \rceil$ | 上取整（天花板函数） |
| $\gcd(a, b)$ | 最大公约数 |
| $\operatorname{lcm}(a, b)$ | 最小公倍数 |
| $a \oplus b$ | 按位异或 |
| $a\ \&\ b$ | 按位与 |
| $a\ \|\ b$ | 按位或 |
| $a \bmod b$ | 取模（$a$ 除以 $b$ 的非负余数） |

注意 $a \bmod b$ 与 $a \equiv b \pmod m$ 的写法不同：前者是运算结果，后者是关系。

## 记号速查

下面把竞赛笔记里最常出现的符号集中列出，方便后续文章引用：

$$\sum_{i=1}^{n} i,\quad \prod_{d \mid n} d,\quad \binom{n}{m},\quad \gcd(a,b),\quad \operatorname{lcm}(a,b),\quad a \equiv b \pmod m,\quad \lfloor \tfrac{a}{b} \rfloor$$

$$\varphi(n),\quad \mu(n),\quad \pi(n),\quad O(n \log n),\quad \Theta(n)$$

掌握这些记号后，后续 GCD、模运算、素数、线性基等专题笔记都可直接引用，不再重复定义。

---

*最后更新：2026年7月29日*
