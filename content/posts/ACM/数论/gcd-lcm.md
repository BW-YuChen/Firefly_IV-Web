---
title: "最大公约数与最小公倍数"
date: "2026-07-27"
summary: "从约数、倍数出发，介绍 GCD、LCM 的定义与性质，给出辗转相除法、扩展欧几里得算法的原理与实现。"
tags: ["ACM", "数论", "GCD", "欧几里得"]
published: true
category: "数论"
weight: 100
---

## 约数与倍数

设 $a, b \in \mathbb{Z}$，若存在 $k \in \mathbb{Z}$ 使 $b = ka$，则称 $a$ 整除 $b$，记作 $a \mid b$。此时 $a$ 是 $b$ 的**约数**（因数），$b$ 是 $a$ 的**倍数**。

几个常用性质：

- 传递性：$a \mid b \wedge b \mid c \implies a \mid c$
- 线性性：$a \mid b \wedge a \mid c \implies a \mid (xb + yc)$，$\forall x, y \in \mathbb{Z}$
- 若 $a \mid b$ 且 $b \mid a$，则 $a = \pm b$

$n$ 的正约数集合记作 $\{d : d \mid n,\ d > 0\}$。约数个数 $\tau(n)$ 与约数和 $\sigma(n)$ 是常用数论函数（见[数学基础](./number-theory-intro)）。朴素枚举约数只需枚举到 $\sqrt{n}$：

```cpp
// 枚举 n 的所有正约数
vector<long long> divisors(long long n) {
    vector<long long> res;
    for (long long i = 1; i * i <= n; i++) {
        if (n % i == 0) {
            res.push_back(i);
            if (i * i != n) res.push_back(n / i);
        }
    }
    sort(res.begin(), res.end());
    return res;
}
```

单次枚举为 $O(\sqrt{n})$。

## 最大公约数

设 $a, b \in \mathbb{Z}$，$a, b$ 不全为 $0$。$a$ 与 $b$ 的**最大公约数** $\gcd(a, b)$ 是同时整除 $a$ 与 $b$ 的最大正整数。约定 $\gcd(a, 0) = |a|$。

常用性质：

- $\gcd(a, b) = \gcd(b, a)$
- $\gcd(a, b) = \gcd(a, b - a)$（更相减损术的代数基础）
- $\gcd(ka, kb) = k \cdot \gcd(a, b)$，$k > 0$
- 若 $d = \gcd(a, b)$，则 $\gcd(a/d, b/d) = 1$

## 最小公倍数

$a$ 与 $b$ 的**最小公倍数** $\operatorname{lcm}(a, b)$ 是同时为 $a, b$ 倍数的最小正整数。它与 GCD 通过下式关联：

$$\gcd(a, b) \cdot \operatorname{lcm}(a, b) = |a \cdot b|$$

因此实现中常先算 $\gcd$ 再推导 $\operatorname{lcm}$，避免 $a \cdot b$ 溢出：

$$\operatorname{lcm}(a, b) = \frac{a}{\gcd(a, b)} \cdot b$$

## 辗转相除法

**是什么**：又称欧几里得算法，用于计算两个整数的最大公约数。

**原理**：基于关键等式 $\gcd(a, b) = \gcd(b, a \bmod b)$，配合边界 $\gcd(a, 0) = a$，递归化简直至余数为 $0$。

```cpp
// 递归写法
long long gcd(long long a, long long b) {
    return b == 0 ? a : gcd(b, a % b);
}

// 迭代写法（避免栈开销）
long long gcd(long long a, long long b) {
    while (b != 0) {
        a %= b;
        swap(a, b);
    }
    return a;
}

// 最小公倍数
long long lcm(long long a, long long b) {
    return a / gcd(a, b) * b;
}
```

**复杂度**：

- 时间：每两步余数至少减半，总迭代次数为 $O(\log \min(a, b))$；最坏情况是相邻斐波那契数，约 $1.44 \log n$ 步。
- 空间：递归版 $O(\log n)$ 栈空间，迭代版 $O(1)$。

C++17 起 `<numeric>` 提供 `std::gcd` 与 `std::lcm`，可直接调用。

## 扩展欧几里得算法

**是什么**：在求 $\gcd(a, b)$ 的同时求出裴蜀等式

$$ax + by = \gcd(a, b)$$

的一组整数解 $(x, y)$。

**干什么**：用于求解线性丢番图方程 $ax + by = c$（当 $\gcd(a, b) \mid c$ 时有解），也是求模逆元、解线性同余方程的基础工具。

**原理**：递归到边界 $\gcd(a, 0) = a$ 时显然有 $a \cdot 1 + 0 \cdot 0 = a$。回溯时利用递推关系：若已求得 $bx' + (a \bmod b)y' = \gcd(a, b)$，代入 $a \bmod b = a - \lfloor a/b \rfloor \cdot b$ 整理可得

$$x = y', \qquad y = x' - \left\lfloor \frac{a}{b} \right\rfloor \cdot y'$$

```cpp
// 返回 gcd(a, b)，并求出 ax + by = gcd(a, b) 的一组解
long long exgcd(long long a, long long b, long long &x, long long &y) {
    if (b == 0) {
        x = 1;
        y = 0;
        return a;
    }
    long long x1, y1;
    long long g = exgcd(b, a % b, x1, y1);
    x = y1;
    y = x1 - (a / b) * y1;
    return g;
}
```

**复杂度**：与辗转相除法一致，时间 $O(\log \min(a, b))$，空间 $O(\log n)$（递归栈）。

### 裴蜀定理

对任意 $a, b \in \mathbb{Z}$，存在整数 $x, y$ 使 $ax + by = \gcd(a, b)$。推论：$ax + by = c$ 有整数解当且仅当 $\gcd(a, b) \mid c$。

通解形式：设 $g = \gcd(a, b)$，$x_0, y_0$ 为一组特解，则

$$x = x_0 + k \cdot \frac{b}{g}, \qquad y = y_0 - k \cdot \frac{a}{g}, \quad k \in \mathbb{Z}$$

### 应用：模逆元

求 $a$ 在模 $m$ 下的逆元等价于解 $ax \equiv 1 \pmod m$，即 $ax + my = 1$。当 $\gcd(a, m) = 1$ 时调用扩展欧几里得即可得到 $x$，再对 $m$ 取模得非负逆元。

```cpp
// 求 a 在模 m 下的逆元，要求 gcd(a, m) = 1
long long modinv(long long a, long long m) {
    long long x, y;
    exgcd(a, m, x, y);
    return (x % m + m) % m;
}
```

## 多数 GCD

对序列 $a_1, a_2, \ldots, a_n$，整体 GCD 满足结合律，可依次归约：

$$\gcd(a_1, a_2, \ldots, a_n) = \gcd(\gcd(a_1, a_2), a_3, \ldots, a_n)$$

```cpp
long long gcd_all(const vector<long long>& a) {
    long long g = 0;
    for (long long x : a) g = gcd(g, x);
    return g;
}
```

对 $n$ 个数的 GCD 为 $O(n \log V)$，其中 $V$ 为值域上界。LCM 类似归约，但需注意中间结果可能溢出，必要时改用高精度或取模。

## 小结

| 算法 | 作用 | 时间复杂度 |
|---|---|---|
| 枚举约数 | 求 $n$ 的所有正约数 | $O(\sqrt{n})$ |
| 辗转相除法 | 求 $\gcd(a, b)$ | $O(\log \min(a, b))$ |
| 扩展欧几里得 | 求 $ax + by = \gcd(a, b)$ 的解 | $O(\log \min(a, b))$ |
| 模逆元 | 解 $ax \equiv 1 \pmod m$ | $O(\log m)$ |

GCD 与 LCM 是数论的基石工具，模运算、分数取模、中国剩余定理等都依赖它们。扩展欧几里得的回溯技巧尤其重要，是衔接初等数论与竞赛算法的关键一环。

---

*最后更新：2026年7月29日*
