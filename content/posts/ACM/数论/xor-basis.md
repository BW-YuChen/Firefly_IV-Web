---
title: "线性基"
date: "2026-07-27"
summary: "异或空间线性基的构造与性质，覆盖最大异或和、第 k 小异或、前缀线性基区间查询与 GF2 博弈论四个模板。"
tags: ["ACM", "数论", "线性基", "异或"]
published: true
category: "数论"
weight: 85
---

## 是什么

线性基是线性代数中「基」的概念在竞赛中的具体应用。本文讨论的是 $\mathbb{F}_2$（即模 $2$ 域）上的线性基，用于处理一串整数在**异或运算**下的线性表示问题。

给定数列 $a_1, a_2, \ldots, a_n$，定义其**异或张成**为所有形如

$$a_{i_1} \oplus a_{i_2} \oplus \cdots \oplus a_{i_k}, \quad i_1 < i_2 < \cdots < i_k$$

的数构成的集合（含空集，值为 $0$）。线性基就是该张成的一组「极小生成集」——用最少的基向量表示出整个异或空间。

## 干什么

线性基常用于以下问题：

- 求一组数的**最大异或和**（子集异或的最大值）
- 求异或张成中的**第 $k$ 小**值
- 判断某个数能否被表示为子集的异或
- 求区间 $[l, r]$ 的最大异或和（前缀线性基）
- 在博弈论中通过 GF2 线性基求解 Nim 类博弈

## 基本性质

设基向量为 $b_0, b_1, \ldots, b_{B-1}$（$B$ 为位数，`long long` 取 $60$），常用约定如下：

- 每个基向量 $b_i$ 的最高位为第 $i$ 位，且互不相同。
- 基向量之间**线性无关**：任意基向量的异或组合都不为 $0$（除非全部不取）。
- 插入失败（线性相关）当且仅当该数可被现有基表示。
- $n$ 个数的线性基大小不超过 $B$，因此空间为 $O(B)$。

## 构造与插入

插入一个数 $x$ 时，从高位向低位扫描。若 $x$ 的第 $i$ 位为 $1$：

- 若 $b_i$ 为空，则 $b_i = x$，插入成功；
- 否则 $x \oplus= b_i$，消去该位后继续。

最终 $x = 0$ 表示 $x$ 可由现有基线性表示，插入失败。

```cpp
struct XorBasis
{
    static const int B = 60; // 最大位数（long long）
    long long b[B + 1];

    void clear()
    {
        fill(b, b + B + 1, 0);
    }

    // 插入一个数
    bool insert(long long x)
    {
        for (int i = B; i >= 0; i--)
        {
            if (!(x >> i & 1))
                continue;
            if (!b[i])
            {
                b[i] = x;
                return true; // 插入成功（线性无关）
            }
            x ^= b[i];
        }
        return false; // 插入失败（线性相关）
    }

    // 求最大异或和
    long long maxXor()
    {
        long long res = 0;
        for (int i = B; i >= 0; i--)
            if ((res ^ b[i]) > res)
                res ^= b[i];
        return res;
    }

    // 查询 x 能否被表示
    bool canGet(long long x)
    {
        for (int i = B; i >= 0; i--)
        {
            if (!(x >> i & 1))
                continue;
            if (!b[i])
                return false;
            x ^= b[i];
        }
        return x == 0;
    }
};
```

**复杂度**：单次插入与查询均为 $O(B) = O(\log V)$，其中 $V$ 为值域上界。空间 $O(B)$。

最大异或和的查询利用了贪心思想：从高位到低位，若异或上 $b_i$ 能使结果变大就异或。由于每个 $b_i$ 控制不同高位，该贪心是正确的。

## 第 k 小异或和

**是什么**：在异或张成中求第 $k$ 小的值（$k$ 从 $1$ 开始）。

**关键步骤**：先对基进行**重构**，让每个基只控制一位（即 $b_i$ 的第 $i$ 位为 $1$，其余位为 $0$）。具体做法是对每个 $b_i$，用所有低位基消去它的低位。重构后，基向量构成对角线上 $1$ 的形式，张成中第 $k$ 小值就是 $k$ 二进制表示对应基的异或组合。

**空集处理**：若基的大小不足 $B$，说明存在未被表示的位，空集（值为 $0$）在张成中。第 $1$ 小为 $0$，其余情况 $k$ 减 $1$ 后再映射。

```cpp
struct XorBasisKth {
    static const int B = 60;
    long long b[B + 1];
    int cnt = 0;

    void clear() {
        fill(b, b + B + 1, 0);
        cnt = 0;
    }

    void insert(long long x) {
        for (int i = B; i >= 0; i--) {
            if (!(x >> i & 1)) continue;
            if (!b[i]) {
                b[i] = x;
                cnt++;
                break;
            }
            x ^= b[i];
        }
    }

    // 重构：让每个基只控制一位
    void rebuild() {
        for (int i = B; i >= 0; i--) {
            for (int j = i - 1; j >= 0; j--) {
                if (b[i] >> j & 1)
                    b[i] ^= b[j];
            }
        }
    }

    // 第 k 小（k 从 1 开始，若不存在返回 -1）
    long long kth(long long k) {
        if (cnt < 60 && k == 1) return 0; // 存在空集
        if (cnt < 60) k--;

        long long res = 0;
        int p = 0;
        for (int i = 0; i <= B; i++) {
            if (!b[i]) continue;
            if (k >> p & 1)
                res ^= b[i];
            p++;
        }
        return (k >> p) ? -1 : res;
    }
};
```

**复杂度**：重构 $O(B^2)$，单次查询 $O(B)$。

## 前缀线性基

**是什么**：支持在线查询原数列区间 $[l, r]$ 的最大异或和。

**原理**：对每个前缀 $[1, i]$ 维护一组基。为了让基只用到 $[l, r]$ 内的数，给每个基附加一个 `pos` 字段记录该基的来源下标。插入时若新数能贡献到某位，且其下标更大，就把基向量与下标一起交换，保证每个基的 `pos` 尽量大。查询时跳过 `pos < l` 的基即可。

```cpp
struct PrefixXorBasis {
    static const int B = 30;
    int b[50005][B + 1], pos[50005][B + 1];

    void insert(int idx, int x) {
        for (int i = 0; i <= B; i++) {
            b[idx][i] = b[idx - 1][i];
            pos[idx][i] = pos[idx - 1][i];
        }
        int p = idx;
        for (int i = B; i >= 0; i--) {
            if (!(x >> i & 1)) continue;
            if (!b[idx][i]) {
                b[idx][i] = x;
                pos[idx][i] = p;
                break;
            }
            if (pos[idx][i] < p) {
                swap(b[idx][i], x);
                swap(pos[idx][i], p);
            }
            x ^= b[idx][i];
        }
    }

    // [l, r] 最大异或和
    int query(int l, int r) {
        int res = 0;
        for (int i = B; i >= 0; i--) {
            if (pos[r][i] >= l && (res ^ b[r][i]) > res)
                res ^= b[r][i];
        }
        return res;
    }
};
```

**复杂度**：插入 $O(B)$，单次查询 $O(B)$，空间 $O(nB)$。下标交换技巧保证前缀 $r$ 处的基始终由「尽量靠后」的数贡献，从而使区间查询可行。

## GF2 线性基与博弈论

**是什么**：将线性基从「数值异或」推广到「$\mathbb{F}_2$ 上的线性方程组」。每个基向量是一个 `bitset`，记录一组等式约束；每个基附带一个值（如 SG 值），用于查询该约束组合对应的解。

**应用场景**：Nim 类博弈中，若每条链的 SG 值只与其长度的奇偶性相关，则整个局面的 SG 可由 GF2 线性基求解。每插入一个局面（系数向量 $v$，SG 值 $s$），相当于加入方程 $v \cdot G = s$。查询时若 $v$ 在基的张成中，则 SG 值唯一确定。

```cpp
struct GF2Basis {
    static const int DIM = 101;   // 链长
    bitset<DIM> base[DIM];       // 基向量
    int val[DIM];                 // 基对应的右端值（SG 值）
    bool exist[DIM];              // 该位是否存在基

    // 清空线性基
    void clear() {
        for (int i = 0; i < DIM; ++i) {
            base[i].reset();
            val[i] = 0;
            exist[i] = false;
        }
    }

    /**
     * 插入一个方程：v · G = s
     * @param v 系数向量（第 L 位 = 1 表示链长 L 出现奇数次）
     * @param s 该局面的 SG 值
     * @return true 插入成功（新增基），false 冗余
     */
    bool insert(const bitset<DIM>& v, int s) {
        bitset<DIM> cur_v = v;
        int cur_s = s;

        // 从高位向低位消元
        for (int i = DIM - 1; i >= 1; --i) {
            if (!cur_v[i]) continue;

            if (exist[i]) {
                // 已有基，消去当前位
                cur_v ^= base[i];
                cur_s ^= val[i];
            } else {
                // 新建基
                base[i] = cur_v;
                val[i] = cur_s;
                exist[i] = true;
                return true;
            }
        }

        // 若最终 cur_v = 0，但 cur_s ≠ 0，说明矛盾
        // 本题保证数据合法，不会出现
        return cur_s == 0;
    }

    /**
     * 查询一个局面的 SG 值
     * @param v 查询向量
     * @return 唯一确定则返回 SG 值，否则返回 -1
     */
    int query(const bitset<DIM>& v) {
        bitset<DIM> cur_v = v;
        int res = 0;

        for (int i = DIM - 1; i >= 1; --i) {
            if (!cur_v[i]) continue;

            if (!exist[i]) {
                // 该维度不在历史张成空间中
                return -1;
            }

            cur_v ^= base[i];
            res ^= val[i];
        }

        return res;
    }
};
```

**复杂度**：插入与查询均为 $O(D)$，其中 $D$ 为向量维数（链长上界），空间 $O(D^2)$。相比朴素异或线性基，区别在于基向量从单个 `long long` 变为 `bitset`，并附带右端值。

## 小结

| 模板 | 作用 | 时间复杂度 | 空间复杂度 |
|---|---|---|---|
| 基本插入 + 最大异或 | 子集异或最大值、存在性查询 | $O(B)$ 单次 | $O(B)$ |
| 第 $k$ 小异或 | 异或张成第 $k$ 小 | 重构 $O(B^2)$，查询 $O(B)$ | $O(B)$ |
| 前缀线性基 | 区间最大异或和 | $O(B)$ 单次 | $O(nB)$ |
| GF2 线性基 | 方程组约束下的 SG 求解 | $O(D)$ 单次 | $O(D^2)$ |

其中 $B = \log V$（值域位数），$D$ 为 GF2 向量维数。线性基的核心思想是「消元构造对角基」，理解了插入时的从高到低消元，其余应用都是在此基础上的变形。

---

*最后更新：2026年7月29日*
