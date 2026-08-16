---
title: "模运算与同余"
date: "2026-07-27"
summary: "模运算的基本性质、快速幂与逆元、线性同余方程、中国剩余定理（CRT）及其扩展形式。"
tags: ["ACM", "数论", "模运算", "CRT"]
published: true
category: "数论"
weight: 95
---

## 模运算

设 $m \in \mathbb{N}^{+}$，$a \bmod m$ 定义为 $a$ 除以 $m$ 的非负余数：

$$a \bmod m = a - m \left\lfloor \frac{a}{m} \right\rfloor$$

模运算对加、减、乘保持良好性质，是竞赛中最常见的「防溢出」手段：

$$(a + b) \bmod m = ((a \bmod m) + (b \bmod m)) \bmod m$$

$$(a - b) \bmod m = ((a \bmod m) - (b \bmod m)) \bmod m$$

$$(a \cdot b) \bmod m = ((a \bmod m) \cdot (b \bmod m)) \bmod m$$

注意除法不成立：$(a / b) \bmod m \neq ((a \bmod m) / (b \bmod m)) \bmod m$。除法需要借助逆元转化为乘法。

### 负数取模

C/C++ 中 `%` 运算结果的符号与被除数相同，可能得到负余数。竞赛代码常用统一化写法：

```cpp
long long mod(long long a, long long m) {
    return (a % m + m) % m;
}
```

## 快速幂

**是什么**：在 $O(\log n)$ 时间内计算 $a^n \bmod m$。

**原理**：利用指数二进制分解。若 $n$ 为偶数，$a^n = (a^{n/2})^2$；若 $n$ 为奇数，$a^n = a \cdot a^{n-1}$。

```cpp
long long qpow(long long a, long long n, long long m) {
    long long res = 1 % m;
    a %= m;
    while (n > 0) {
        if (n & 1) res = res * a % m;
        a = a * a % m;
        n >>= 1;
    }
    return res;
}
```

**复杂度**：时间 $O(\log n)$，空间 $O(1)$。

### 龟速乘

当 $m$ 接近 $10^{18}$ 时，`a * a % m` 会溢出 `long long`。此时可用「龟速乘」将乘法拆成二进制累加，每次加法后取模：

```cpp
long long mulmod(long long a, long long b, long long m) {
    long long res = 0;
    a %= m;
    while (b > 0) {
        if (b & 1) res = (res + a) % m;
        a = (a + a) % m;
        b >>= 1;
    }
    return res;
}
```

时间 $O(\log b)$，用加法换乘法避免溢出。或者使用 `__int128` 直接计算后取模。

## 逆元

**是什么**：若 $\gcd(a, m) = 1$，则存在唯一的 $x$ 使 $ax \equiv 1 \pmod m$，称 $x$ 为 $a$ 模 $m$ 的逆元，记作 $a^{-1}$。

**干什么**：把模意义下的除法转化为乘法，$\dfrac{a}{b} \bmod m = a \cdot b^{-1} \bmod m$。

### 三种求法

**1. 费马小定理**（$m$ 为素数）：

$$a^{m-1} \equiv 1 \pmod m \implies a^{-1} \equiv a^{m-2} \pmod m$$

```cpp
long long modinv(long long a, long long m) {
    return qpow(a, m - 2, m);   // 要求 m 为素数
}
```

**2. 扩展欧几里得**（$m$ 任意，要求 $\gcd(a, m) = 1$）：见 [GCD 与 LCM](./gcd-lcm) 一文。

**3. 线性递推**（批量求 $[1, m)$ 的逆元，$m$ 为素数）：

$$i^{-1} \equiv -(m/i) \cdot (m \bmod i)^{-1} \pmod m$$

```cpp
void compute_inv(vector<long long>& inv, int n, long long m) {
    inv[1] = 1;
    for (int i = 2; i < n; i++)
        inv[i] = (m - m / i) * inv[m % i] % m;
}
```

预处理 $O(n)$，单次查询 $O(1)$，是组合数取模的常用预处理方式。

## 线性同余方程

形如 $ax \equiv b \pmod m$ 的方程称为线性同余方程。令 $g = \gcd(a, m)$：

- 若 $g \nmid b$，无解；
- 若 $g \mid b$，恰有 $g$ 个模 $m$ 意义下不同的解。

**求解**：等价于解 $ax + my = b$，调用扩展欧几里得求得 $ax' + my' = g$ 的一组解后，令

$$x_0 = x' \cdot \frac{b}{g}$$

则通解为

$$x \equiv x_0 \pmod{\frac{m}{g}}$$

```cpp
// 解 ax ≡ b (mod m)，返回 {是否有解, 最小非负解}
pair<bool, long long> solve_congruence(long long a, long long b, long long m) {
    long long x, y;
    long long g = exgcd(a, m, x, y);
    if (b % g != 0) return {false, 0};
    long long mod = m / g;
    long long x0 = x * (b / g) % mod;
    return {true, (x0 % mod + mod) % mod};
}
```

## 中国剩余定理

**是什么**：给定一组两两互素的模数 $m_1, m_2, \ldots, m_k$ 与余数 $r_1, r_2, \ldots, r_k$，求解同余方程组

$$\begin{cases} x \equiv r_1 \pmod{m_1} \\ x \equiv r_2 \pmod{m_2} \\ \cdots \\ x \equiv r_k \pmod{m_k} \end{cases}$$

**干什么**：CRT 给出该方程组在模 $M = \prod m_i$ 意义下的唯一解，是合并同余信息、大数模运算分解的核心工具。

**构造**：令 $M = \prod_{i=1}^{k} m_i$，$M_i = M / m_i$，$t_i = M_i^{-1} \pmod{m_i}$，则

$$x \equiv \sum_{i=1}^{k} r_i M_i t_i \pmod{M}$$

```cpp
// CRT 合并：模数两两互素
long long crt(vector<long long> r, vector<long long> m) {
    long long M = 1, res = 0;
    for (long long mi : m) M *= mi;
    for (size_t i = 0; i < r.size(); i++) {
        long long Mi = M / m[i];
        long long ti = modinv(Mi, m[i]);
        res = (res + r[i] % m[i] * (Mi % M) % M * ti) % M;
    }
    return (res % M + M) % M;
}
```

**复杂度**：$O(k \log M)$（$k$ 次扩展欧几里得求逆元）。

### 扩展中国剩余定理

当模数**不两两互素**时，CRT 不直接适用，需要用扩展 CRT 逐次合并两方程。合并

$$x \equiv r_1 \pmod{m_1}, \qquad x \equiv r_2 \pmod{m_2}$$

等价于解 $x = r_1 + k m_1$ 代入第二式：

$$m_1 k \equiv r_2 - r_1 \pmod{m_2}$$

令 $g = \gcd(m_1, m_2)$。若 $g \nmid (r_2 - r_1)$ 则无解；否则用扩展欧几里得求 $k$，合并后新模为 $\operatorname{lcm}(m_1, m_2)$。

```cpp
// 合并 x ≡ r1 (mod m1) 与 x ≡ r2 (mod m2)，返回 {是否有解, {r, m}}
pair<bool, pair<long long, long long>> crt_merge(
    long long r1, long long m1, long long r2, long long m2) {
    long long g = gcd(m1, m2), l = m1 / g * m2;
    if ((r2 - r1) % g != 0) return {false, {}};
    long long x, y;
    exgcd(m1, m2, x, y);
    long long t = (r2 - r1) / g;
    long long r = (r1 + m1 * (__int128)t % l * x % l) % l;
    return {true, {(r % l + l) % l, l}};
}
```

合并时中间乘积可能达到 $10^{36}$，需要 `__int128` 或龟速乘防溢出。对所有方程依次合并即可得到全局解。

## 小结

| 模块 | 作用 | 时间复杂度 |
|---|---|---|
| 快速幂 | $a^n \bmod m$ | $O(\log n)$ |
| 费马小定理逆元 | 素数模下逆元 | $O(\log m)$ |
| 扩展欧几里得逆元 | 任意模逆元 | $O(\log m)$ |
| 线性递推逆元 | 批量逆元 | $O(n)$ 预处理 |
| 线性同余方程 | 解 $ax \equiv b \pmod m$ | $O(\log m)$ |
| CRT | 互素模方程组合并 | $O(k \log M)$ |
| 扩展 CRT | 任意模方程组合并 | $O(k \log M)$ |

模运算是数论题的通用工具，组合数取模、矩阵快速幂、多项式卷积都离不开它。逆元与 CRT 的灵活运用往往是题目能否化简的关键。

---

*最后更新：2026年7月29日*
