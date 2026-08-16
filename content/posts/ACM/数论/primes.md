---
title: "素数与质因数分解"
date: "2026-07-27"
summary: "素数判定与筛法、Miller-Rabin 素性测试、朴素分解与 Pollard-Rho 随机分解算法。"
tags: ["ACM", "数论", "素数", "筛法", "Pollard-Rho"]
published: true
category: "数论"
weight: 90
---

## 素数

大于 $1$ 的自然数 $p$ 若只有 $1$ 与 $p$ 两个正约数，则称 $p$ 为**素数**（质数）。否则称为合数。$1$ 既不是素数也不是合数。

素数的几个常用结论：

- 素数有无穷多个（欧几里得证明）。
- 不超过 $n$ 的素数个数 $\pi(n) \sim \dfrac{n}{\ln n}$。
- $n$ 的最小素因子不超过 $\sqrt{n}$（除 $n$ 本身为素数外）。

### 朴素判定

试除到 $\sqrt{n}$ 即可判定：

```cpp
bool is_prime(long long n) {
    if (n < 2) return false;
    for (long long i = 2; i * i <= n; i++)
        if (n % i == 0) return false;
    return true;
}
```

时间 $O(\sqrt{n})$，适用于 $n \leq 10^{12}$ 量级的单次判定。

## 埃氏筛

**是什么**：列出 $[1, n]$ 内所有素数的最简筛法。对每个素数 $p$，将它的倍数 $2p, 3p, \ldots$ 标记为合数。

```cpp
vector<int> sieve_eratosthenes(int n) {
    vector<bool> vis(n + 1, false);
    vector<int> primes;
    for (int i = 2; i <= n; i++) {
        if (vis[i]) continue;
        primes.push_back(i);
        for (long long j = (long long)i * i; j <= n; j += i)
            vis[j] = true;
    }
    return primes;
}
```

**复杂度**：调和级数 $\sum_{p \leq n} \dfrac{n}{p} = O(n \log \log n)$，空间 $O(n)$。从 $i^2$ 开始标记可避免重复，且保证不溢出。

## 线性筛

**是什么**：又称欧拉筛，每个合数只被其**最小素因子**标记一次，总操作数恰为 $O(n)$。

**原理**：维护当前素数表，对每个 $i$，用表中素数 $p$ 标记 $i \cdot p$。一旦 $i \bmod p = 0$ 就停止，因为后续 $p' > p$ 时 $p' \cdot i$ 的最小素因子是 $p$ 而非 $p'$，应留给 $p$ 在更大 $i$ 时标记。

```cpp
vector<int> sieve_linear(int n) {
    vector<bool> vis(n + 1, false);
    vector<int> primes;
    for (int i = 2; i <= n; i++) {
        if (!vis[i]) primes.push_back(i);
        for (int p : primes) {
            if ((long long)i * p > n) break;
            vis[i * p] = true;
            if (i % p == 0) break;   // p 是 i 的最小素因子
        }
    }
    return primes;
}
```

**复杂度**：时间 $O(n)$，空间 $O(n)$。$n$ 较大（$10^7$ 以上）时显著优于埃氏筛。

### 线性筛求积性函数

线性筛的优势在于每个合数恰好被访问一次（被其最小素因子筛掉），因此可用于线性预处理积性函数，如欧拉函数 $\varphi$、莫比乌斯函数 $\mu$、约数个数 $\tau$ 等。

## Miller-Rabin 素性测试

**是什么**：基于随机化的概率素性测试，用于大整数（$10^{18}$ 甚至更大）的快速判定。

**原理**：由费马小定理，若 $p$ 为素数，对任意 $\gcd(a, p) = 1$ 有 $a^{p-1} \equiv 1 \pmod p$。但满足此条件的合数（Carmichael 数）存在，需进一步加强为**二次探测**：

若 $p - 1 = 2^s \cdot d$（$d$ 为奇数），对随机选取的 $a$，考察序列

$$a^d,\ a^{2d},\ a^{4d},\ \ldots,\ a^{2^s d} = a^{p-1}$$

若 $p$ 为素数，则该序列要么首项为 $1$，要么某项为 $p - 1$（在模 $p$ 下即 $-1$）。不满足则 $p$ 一定是合数。

```cpp
using u128 = __int128;
long long mulmod(long long a, long long b, long long m) {
    return (u128)a * b % m;
}
long long qpow(long long a, long long n, long long m) {
    long long res = 1 % m;
    while (n) {
        if (n & 1) res = mulmod(res, a, m);
        a = mulmod(a, a, m);
        n >>= 1;
    }
    return res;
}
bool miller_test(long long a, long long d, long long n) {
    long long x = qpow(a, d, n);
    if (x == 1 || x == n - 1) return true;
    while (d != n - 1) {
        x = mulmod(x, x, n);
        d <<= 1;
        if (x == 1) return false;
        if (x == n - 1) return true;
    }
    return false;
}
// 对 64 位整数，固定一组 witness 即可确定性判定
bool miller_rabin(long long n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 == 0) return false;
    long long d = n - 1;
    while (d % 2 == 0) d >>= 1;
    for (long long a : {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}) {
        if (n == a) return true;
        if (!miller_test(a, d, n)) return false;
    }
    return true;
}
```

**复杂度**：单次测试 $O(\log n)$，$k$ 次测试 $O(k \log n)$。对 $n < 2^{64}$，使用固定 witness 集 $\{2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37\}$ 即可确定性判定，无需随机化。

## 质因数分解

每个大于 $1$ 的整数 $n$ 可唯一分解为

$$n = p_1^{e_1} p_2^{e_2} \cdots p_k^{e_k}, \quad p_1 < p_2 < \cdots < p_k$$

这是算术基本定理。分解结果在求 $\varphi, \mu, \tau, \sigma$ 等积性函数值时必不可少。

### 朴素试除

枚举到 $\sqrt{n}$，每除尽一个素因子就把它除干净：

```cpp
vector<pair<long long, int>> factor(long long n) {
    vector<pair<long long, int>> res;
    for (long long i = 2; i * i <= n; i++) {
        if (n % i == 0) {
            int e = 0;
            while (n % i == 0) n /= i, e++;
            res.push_back({i, e});
        }
    }
    if (n > 1) res.push_back({n, 1});
    return res;
}
```

**复杂度**：$O(\sqrt{n})$，适用于 $n \leq 10^{12}$。

## Pollard-Rho

**是什么**：随机化大整数分解算法，期望时间 $O(n^{1/4})$，适合分解 $10^{18}$ 级别的数。

**原理**：构造伪随机序列 $x_{i+1} = (x_i^2 + c) \bmod n$，由生日悖论，序列在 $O(\sqrt{n})$ 步内会进入环。环上的两点差值 $|x_i - x_j|$ 与 $n$ 有较大概率存在非平凡公因子。用 Floyd 判环即可在 $O(\sqrt{p})$ 步内找到 $n$ 的一个因子 $p$，其中 $p$ 是 $n$ 的最小素因子，故总复杂度 $O(n^{1/4})$。

```cpp
long long pollard_rho(long long n) {
    if (n % 2 == 0) return 2;
    long long x = rand() % (n - 2) + 2, y = x;
    long long c = rand() % (n - 1) + 1, d = 1;
    while (d == 1) {
        x = (mulmod(x, x, n) + c) % n;
        y = (mulmod(y, y, n) + c) % n;
        y = (mulmod(y, y, n) + c) % n;
        d = gcd(abs(x - y), n);
    }
    return d == n ? -1 : d;   // -1 表示失败，需换 c 重试
}

void factorize(long long n, vector<long long>& res) {
    if (n == 1) return;
    if (miller_rabin(n)) { res.push_back(n); return; }
    long long d = n;
    while (d == -1 || d == n) d = pollard_rho(n);
    factorize(d, res);
    factorize(n / d, res);
}
```

**复杂度**：期望 $O(n^{1/4})$ 分解出一个因子，递归分解即可得到全部素因子。结合 Miller-Rabin 判定可在 $10^{18}$ 范围内快速分解。

### 实战搭配

通常 Pollard-Rho 用于大整数分解，Miller-Rabin 用于素数判定，二者组合是处理 $10^{18}$ 范围数论题的标配：

```cpp
// 分解 n，返回 {素因子, 指数} 列表
vector<pair<long long, int>> factorize(long long n) {
    vector<long long> primes;
    factorize_all(n, primes);
    sort(primes.begin(), primes.end());
    vector<pair<long long, int>> res;
    for (long long p : primes) {
        int e = 0;
        while (n % p == 0) n /= p, e++;
        res.push_back({p, e});
    }
    return res;
}
```

## 小结

| 算法 | 作用 | 时间复杂度 | 适用场景 |
|---|---|---|---|
| 试除判定 | 单点素性判定 | $O(\sqrt{n})$ | $n \leq 10^{12}$ |
| 埃氏筛 | 区间筛素数 | $O(n \log \log n)$ | $n \leq 10^7$ |
| 线性筛 | 区间筛 + 积性函数 | $O(n)$ | $n \leq 10^8$ |
| Miller-Rabin | 大数素性判定 | $O(k \log n)$ | $n \leq 2^{64}$ |
| 朴素分解 | 质因数分解 | $O(\sqrt{n})$ | $n \leq 10^{12}$ |
| Pollard-Rho | 大数质因数分解 | 期望 $O(n^{1/4})$ | $n \leq 10^{18}$ |

筛法给出素数表，是预处理数论函数的基础；Miller-Rabin 与 Pollard-Rho 则是处理大整数问题的随机化利器，二者搭配可应对大多数 $10^{18}$ 量级的分解需求。

---

*最后更新：2026年7月29日*
