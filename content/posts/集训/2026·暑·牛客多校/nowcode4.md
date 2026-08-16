---
title: "第四场"
date: "2026-08-09"
summary: "牛客多校第四场"
tags: ["集训", "牛客", "多校"]
published: true
category: "2026·暑·牛客多校"
weight: 96
---

## 比赛信息

- **比赛时间**：2026年7月29日 12:00-17:00
- **赛制**：ACM赛制
- **出题组**：浙江大学
- **链接**：[牛客多校第四场](https://ac.nowcoder.com/acm/contest/133879)

## 概况

- 入门：I
- 简单：B D
- 中等：C F 
- 较难：K E
- 困难：H J A G L
  
## 题解报告（I B D）
### I-Rounddog
#### 标签：字符串 **KMP**
#### 题意
定义字符串序列

$$T_1=Rounddog，T_i=T_{i-1}+g(i>1)$$

给定一个字符串$S$和一个整数 $k$。考虑$S$的所有**循环移位**，求其中有多少个循环移位包含$T_k$作为连续子串。  
$1\leq t\leq 10^5，1\leq |S|,\sum|S| \leq 10^5，1\leq k \leq 100$
#### 思路
模式串 $T_k$ = `"Rounddo"` + `'g'` $\times k$，长度 $m = 7 + k$。若 $m > |S|$，任何循环移位都不可能包含 $T_k$，直接输出 $0$。

用双倍字符串 $S' = S + S[0..m-2]$（长度 $n + m - 1$）覆盖所有 $n$ 个循环移位，然后用 KMP 在 $S'$ 中匹配 $T_k$：

- 若 $T_k$ 不在 $S'$ 中出现，答案为 $0$。
- 若 $T_k$ 恰好出现一次（找到首次匹配后，截去前缀再 KMP 无第二次匹配），则包含该匹配的循环移位有 $n - m + 1$ 个。
- 若 $T_k$ 出现至少两次，任意一个长度为 $n$ 的窗口都至少覆盖一次匹配，故所有 $n$ 个循环移位均合法，答案为 $n$。

时间复杂度 $O(|S|)$。
#### 代码
```cpp
#include <bits/stdc++.h>
#define ll long long
using namespace std;
const int MAXN = 2000007;
int nxt[MAXN] = {0};
int kmp(string a, string b)
{
    int n = a.size(), m = b.size();
    a = " " + a;
    b = "#" + b;
    int j = 0;
    for (int i = 1; i < m; i++)
    {
        while (j > 0 && b[j + 1] != b[i + 1])
            j = nxt[j];
        if (b[j + 1] == b[i + 1])
            j++;
        nxt[i + 1] = j;
    }
    j = 0;
    for (int i = 0; i < n; i++)
    {
        while (j > 0 && a[i + 1] != b[j + 1])
            j = nxt[j];
        if (a[i + 1] == b[j + 1])
            j++;
        if (j == m)
        {
            return 1;
        }
    }
    return 0;
}
void solve()
{
    string s;
    int k;
    cin >> s >> k;
    if (7 + k > s.size())
    {
        cout << 0 << '\n';
        return;
    }
    string t = "Rounddo";
    for (int i = 0; i < k; i++)
    {
        t += 'g';
    }
    string temp = s;
    temp += s.substr(0, t.size() - 1);
    if (!kmp(temp, t))
    {
        cout << 0 << '\n';
        return;
    }
    int pos = temp.find(t);
    temp = temp.substr(pos + t.size(), temp.size() - pos - t.size());
    if (!kmp(temp, t))
    {
        cout << s.size() - t.size() + 1 << '\n';
    }
    else
    {
        cout << s.size() << '\n';
    }
}
int main()
{
    ios::sync_with_stdio(false);
    cin.tie(0);
    cout.tie(0);
    int t;
    cin >> t;
    while (t--)
    {
        solve();
    }
}
```
### B-Quadratic Residue
#### 标签：数论 二次剩余
#### 题意
给定一个正整数$p$，需要寻找三个正整数$x_1,x_2,q$，满足
$$1\leq x_1<q,1\leq x_2<p$$，以及
$$x_1^2\equiv p\pmod q,x_2^2\equiv p\pmod q$$
$1\leq T \leq 10^4,2\leq p \leq 10^9,1 \leq q\leq 10^{12}$
#### 思路
构造法。取 $x_1 = 10^6$，令 $q = x_1^2 - p = 10^{12} - p$，则 $x_1^2 = q + p$，即 $x_1^2 \equiv p \pmod q$。此时 $q \approx 10^{12}$，满足 $x_1 < q$ 与 $q \leq 10^{12}$。

再取 $x_2 = x_1 \bmod p$。由 $x_2 \equiv x_1 \pmod p$ 得 $x_2^2 \equiv x_1^2 \pmod p$，而 $x_1^2 = q + p \equiv q \pmod p$，故 $x_2^2 \equiv q \pmod p$，且 $1 \leq x_2 < p$。

特判 $p \mid x_1$（即 $x_2 = 0$）时，改用 $x_1 = 10^6 - 1$，同理构造。
#### 代码
```cpp
#include <bits/stdc++.h>
#define ll long long
using namespace std;
ll p;
void solve(){
    ll q = (ll)1e12-p;
    ll x1 = (ll)1e6;
    ll x2 = x1%p;
    if(x2%p==0){
        q = ((ll)1e6-1)*((ll)1e6-1)-p;
        x1 = (ll)1e6-1;
        x2 = ((ll)1e6-1)%p;
    }
    cout<<x1<<" "<<x2<<" "<<q<<"\n";
}
int main(){
    ios::sync_with_stdio(false);
    cin.tie(0);
    cout.tie(0);
    int t;
    cin>>t;
    while(t--){
        cin>>p;
        solve();
    }
}
```
### D-The Game
#### 标签：博弈论
#### 题意
Alice和Bob轮流构造一个长度为$n$的排列。初始序列为空，Alice先手。每次当前玩家选择一个尚未出现的$1$到$n$之间的整数，并将其添加到序列末尾。经过恰好$n$次操作后，得到排列$p$。  
对于排列$p$，令$f(p)$表示排列$p$中的所有循环移位中字典序最小的一个。Alice希望让$f(p)$尽可能小，而Bob希望让$f(p)$尽可能大。  
假设两人都采取最优策略，求最终得到的排列$p$。
$1\leq T \leq 10^5,1\leq n,\sum n \leq 5\times 10^5$。
#### 思路
$f(p)$ 为排列所有循环移位中字典序最小者，即从最小元素 $1$ 所在位置开始的循环移位。Alice 想最小化 $f(p)$，Bob 想最大化。

关键在于 Alice 并非总先放 $1$，而是通过选择 $1$ 的放置时机来控制 $f(p)$ 中各位置的先后手归属，使自己在关键位获得更优选择权。经博弈分析，最优排列呈交错构造：

- **$n$ 为偶数**（$m = n/2$）：$1$ 在首位，之后交替放置上半区与下半区——$1, m{+}1, m, m{+}2, m{-}1, \ldots, n, 2$。
- **$n$ 为奇数**（$m = \lfloor n/2 \rfloor$）：$1$ 在首位，第二位放 $m{+}2$，第三位放 $2$，之后类似交替——$1, m{+}2, 2, m{+}1, m{+}3, 3, \ldots, n$。

该构造使 Bob 无法在 $f(p)$ 的靠前位置获得大数选择权，从而最小化 $f(p)$ 的字典序。
#### 代码
```cpp
#include <bits/stdc++.h>
using namespace std;
void solve()
{
    int n;
    cin >> n;
    vector<int> ans;
    if (n == 1)
    {
        ans.push_back(1);
    }
    else if (n % 2 == 0)
    {
        int m = n / 2;
        ans.push_back(1);
        for (int i = 1; i <= m; i++)
        {
            ans.push_back(m + i);
            if (i < m)
            {
                ans.push_back(m + 1 - i);
            }
        }
    }
    else
    {
        int m = n / 2;
        ans.push_back(1);
        for (int i = 1; i <= m; i++)
        {
            ans.push_back(m + 3 - i);
            if (i == 1)
            {
                ans.push_back(2);
            }
            else
            {
                ans.push_back(m + i + 1);
            }
        }
    }
    for (int i = 0; i < n; i++)
    {
        if (i)
            cout << ' ';
        cout << ans[i];
    }
    cout << '\n';
}
int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    while (T--)
    {
        solve();
    }
    return 0;
}
```

*最后更新：2026年8月9日*