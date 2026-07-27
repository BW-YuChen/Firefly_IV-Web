---
title: "第一场"
date: "2026-07-27"
summary: "牛客多校第一场"
tags: ["集训", "牛客", "多校"]
published: true
category: "2026·暑·牛客多校"
weight: 99
---

## 比赛信息

- **比赛时间**：2026年7月17日 12:00-17:00
- **赛制**：ACM赛制
- **出题组**：quailty, Gromah, Sooke
- **链接**：[牛客多校第一场](https://ac.nowcoder.com/acm/contest/133876)

## 概况

- 入门：A E
- 简单：F G J
- 中等：C H L
- 较难：D I B
- 困难：K
  
## 题解报告（A E F G J）
### A-2090 Virus
#### 标签：模拟 字符串 分支结构
#### 题意
给定一个字符串 s，判断它是否为“梗语言”。梗语言需同时满足：

- 长度恰好为 8；
- 第 1, 3, 5, 7 位为辅音（非 ‘a/e/i/o/u‘）；
- 第 2, 4, 6, 8 位为元音（‘a/e/i/o/u‘）。  
若是梗语言则视为已感染，否则为幸存者。  
$1\leq T\leq 10^5$,$1\leq P\leq 10^6$,$\sum |s| \leq 10^6$
#### 思路
按照题意模拟即可
#### 代码
```cpp
#include<bits/stdc++.h>
using namespace std;
void solve()
{
        string s;
        cin>>s;
        if(s.length()!=8)
        {
            cout<<"Well-Being"<<endl;
            return;
        }
        int f=1;
        for(int i=0;i<s.size();i++)
        {
            char a=s[i];
            if(i%2==0&&(a=='a'||a=='e'||a=='i'||a=='o'||a=='u'))
            {
                cout<<"Well-Being"<<endl;
                return;
            }
            if(i%2==1&& (!(a=='a'||a=='e'||a=='i'||a=='o'||a=='u')))
            {
                cout<<"Well-Being"<<endl;
                return;
            }
        }
        cout<<"Suspected Virus"<<endl;
}
int main()
{
    int t;
    cin>>t;
    while(t--)
        solve();
}
```
### E-Permutation Evaluation
#### 标签：数学 模拟
#### 题意
对于$0$到$n-1$的排列$P$，定义权值：
$$
f(P)=\sum_{0\leq i<j<n}(P[j]-P[i])
$$
给定排列$P$，输出权值
$1\leq n\leq 2\times 10^5$ 
#### 思路
按照题意模拟即可，注意$P[i]$的取值范围为$[0,n-1]$，所以$P[i]-P[j]$的取值范围为$[-n+1,n-1]$，所以$f(P)$的取值范围为$[-n^2,n^2]$
#### 代码
```cpp
#include<bits/stdc++.h>
using namespace std;
using ll = long long ;
int main(){
    int n;
    cin>>n;
    vector<int> a(n+1);
    for(int i=1;i<=n;i++){
        cin>>a[i];
    }
    ll ans =0 ;
    for(int i=1;i<=n;i++){
        ans += (i-1)*a[i];
    }
    for(int i=1;i<=n;i++){
        ans -= (n-i)*a[i];
    }
    cout<<ans<<"\n";
}
```
### F-Permutation Generation
#### 标签：数学 构造
#### 题意
延续E题中提出的权值函数$f(P)$。构造一个排列$P'$，对于给定的$P$及整数$k,x (0\leq k,x<n$),满足：

- $P_k'$=x;
- $f(P')\equiv f(P)\pmod n$

若有解输出任意$P'$，否则输出-1.
$1\leq n\leq 2\times 10^5$
#### 思路
考虑将排列中每个数字在模 $n$ 下同时加 $1$，权值模 $n$ 不变。
$(P_j+1) - (P_i+1) \equiv P_j - P_i \pmod n$
因此，如果我们知道一个排列的权值，就可以通过模 $n$ 平移得到 $n-1$ 个其他排列的权值。
考虑原排列 $P$ 和目标排列 $P'$，我们需要将 $P$ 变成 $P'$。
假设我们将 $P_k$ 变成 $x$，那么所有元素都需要加上 $d = (x - P_k) \pmod n$，即：
$$P_i' \equiv P_i + d \pmod n, \quad \text{其中 } d=(x-P_k)\pmod n$$

#### 代码
```cpp
#include<bits/stdc++.h>
#define int long long
using namespace std;

signed main()
{
    int n, k, x;
    cin >> n >> k >> x;
    vector<int> p(n);
    int pos=0;
    for(int i=0;i<n;i++)
    {
        cin>>p[i];
    }
    int move=(x-p[k]+n)%n;

    for(int i=0;i<n;i++)
    {
        cout<<(p[i]+move)%n<<' ';
    }
}
```
### G-Precision Error?!
#### 标签：数学 几何
#### 题意
给定正整数$n$，构造不超过$2n+2$个三维点，使得任意两个点之间的欧氏距离$>\epsilon$,对每个点恰好有$n$个点与它的欧式距离在$(1-\epsilon,1+\epsilon)$之间。这里$\epsilon=0.01$。有$T$组数据。
$1\leq n\leq 100,1\leq T \leq 100$
#### 思路
一个思路是将点放置在$z=0$和$z=1$两个平面上,每个平面上有$n$个点,每个点的坐标为$(x,y,z)$,其中$x,y$在$[0,1)$之间,且$x,y$的取值范围为$[0,1)$,所以欧氏距离为$\sqrt{x^2+y^2}$,满足$>\epsilon$.
#### 代码
```cpp
#include<bits/stdc++.h>
using namespace std;
struct p
{
    double x,y,z;
};
void solve()
{
    int n;
    cin>>n;
    vector<p> ps;
    for(int i=1;i<=n;i++)
    {
        ps.push_back({i/10*0.0101,i%10*0.0101,0.0});
    }
    for(int i=1;i<=n;i++)
    {
        ps.push_back({i/10*0.0101,i%10*0.0101,1.0});
    }
    cout<<2*n<<endl;
    for(auto [x,y,z]:ps)
    {
        cout<<fixed<<setprecision(9);
        cout<<x<<" "<<y<<" "<<z<<endl;
    }
}
int main()
{
    int t=1;
    cin>>t;
    while(t--)
    {
        solve();
    }
}
```
### J-Show Hand
#### 标签：模拟 枚举
#### 题意
给定去掉大小王的$52$张扑克牌，牌面为$A,2,3,4,5,6,7,8,9,10,J,Q,K$，每种花色各有一张。  
你和法国赌神各持有四张明牌和一张暗牌。法国赌神先将暗牌变为除八张明牌外的任意一张牌。随后你同样操作（除九张明牌外，即你知道法国赌神的暗牌）。

- 若你有必胜策略，则输出"我要验牌"；
- 否则输出"给我擦皮鞋"。
- 平局输出"牌没有问题"。

$1\leq T \leq 10^4$
#### 思路
枚举所有可能的暗牌（44张），对每种暗牌分别计算你和对手的完整牌型（等级+排序后点数）。然后遍历对手的每一种暗牌选择，检查你是否总能找到一种暗牌使自己严格获胜；同时检查对手是否存在某种暗牌让你所有选择都失败。根据结果输出。
#### 代码
```cpp
#include<bits/stdc++.h>
using namespace std;

int score(int y[], int f[]) {
    for (int i = 0; i < 5; i++)
        for (int j = i + 1; j < 5; j++)
            if (y[i] < y[j]) {
                swap(y[i], y[j]);
                swap(f[i], f[j]);
            }

    bool flush = (f[0] == f[1] && f[1] == f[2] && f[2] == f[3] && f[3] == f[4]);
    bool straight = (y[0] - y[1] == 1 && y[1] - y[2] == 1 && y[2] - y[3] == 1 && y[3] - y[4] == 1);
    bool wheel = (y[0] == 14 && y[1] == 5 && y[2] == 4 && y[3] == 3 && y[4] == 2);
    if (wheel) straight = true;


    if (wheel) {
        int ty = y[0], tf = f[0];
        for (int i = 0; i < 4; i++) {
            y[i] = y[i + 1];
            f[i] = f[i + 1];
        }
        y[4] = ty;
        f[4] = tf;
    }

    int grpCnt[5], grpRank[5], ngrp = 0;
    int i = 0;
    while (i < 5) {
        int j = i;
        while (j < 5 && y[j] == y[i]) j++;
        grpCnt[ngrp] = j - i;
        grpRank[ngrp] = y[i];
        ngrp++;
        i = j;
    }

    for (int a = 0; a < ngrp; a++)
        for (int b = a + 1; b < ngrp; b++)
            if (grpCnt[a] < grpCnt[b] || (grpCnt[a] == grpCnt[b] && grpRank[a] < grpRank[b])) {
                swap(grpCnt[a], grpCnt[b]);
                swap(grpRank[a], grpRank[b]);
            }

    int type;
    if (flush && straight) {
        // 同花顺：皇家同花顺(A-K-Q-J-10)为10
        type = (y[0] == 14 && y[1] == 13 && y[2] == 12 && y[3] == 11 && y[4] == 10) ? 10 : 9;
    } else if (grpCnt[0] == 4) {
        type = 8; // 四条
    } else if (grpCnt[0] == 3 && ngrp >= 2 && grpCnt[1] == 2) {
        type = 7; // 葫芦
    } else if (flush) {
        type = 6; // 同花
    } else if (straight) {
        type = 5; // 顺子
    } else if (grpCnt[0] == 3) {
        type = 4; // 三条
    } else if (ngrp >= 2 && grpCnt[0] == 2 && grpCnt[1] == 2) {
        type = 3; // 两对
    } else if (grpCnt[0] == 2) {
        type = 2; // 一对
    } else {
        type = 1; // 高牌
    }
    if (!straight) {
        int ny[5], nf[5], idx = 0;
        for (int g = 0; g < ngrp; g++) {
            for (int k = 0; k < 5; k++) {
                if (y[k] == grpRank[g]) {
                    ny[idx] = y[k];
                    nf[idx] = f[k];
                    idx++;
                }
            }
        }
        for (int k = 0; k < 5; k++) {
            y[k] = ny[k];
            f[k] = nf[k];
        }
    }

    return type;
}
void solve()
{
    string c1, c2, c3, c4, p1, p2, p3, p4;
    cin >> c1 >> c2 >> c3 >> c4 >> p1 >> p2 >> p3 >> p4;

    auto getRank = [](const string& s) -> int {
        char c = s[0];
        if (c == 'A') return 14;
        if (c == 'K') return 13;
        if (c == 'Q') return 12;
        if (c == 'J') return 11;
        if (c == 'T') return 10;
        return c - '0';
    };
    auto getSuit = [](const string& s) -> int {
        char c = s[1];
        if (c == 'C') return 0;
        if (c == 'D') return 1;
        if (c == 'H') return 2;
        return 3; // S
    };
    int yr[4] = {getRank(c1), getRank(c2), getRank(c3), getRank(c4)};
    int ys[4] = {getSuit(c1), getSuit(c2), getSuit(c3), getSuit(c4)};
    int fr[4] = {getRank(p1), getRank(p2), getRank(p3), getRank(p4)};
    int fs[4] = {getSuit(p1), getSuit(p2), getSuit(p3), getSuit(p4)};
    bool used[15][4] = {};
    for (int i = 0; i < 4; i++) {
        used[yr[i]][ys[i]] = true;
        used[fr[i]][fs[i]] = true;
    }
    int avail_r[44], avail_s[44], navail = 0;
    for (int r = 2; r <= 14; r++)
        for (int s = 0; s < 4; s++)
            if (!used[r][s]) {
                avail_r[navail] = r;
                avail_s[navail] = s;
                navail++;
            }
    int your_type[44], your_rank[44][5];
    int opp_type[44], opp_rank[44][5];
    for (int i = 0; i < navail; i++) {
        int yy[5] = {yr[0], yr[1], yr[2], yr[3], avail_r[i]};
        int yf[5] = {ys[0], ys[1], ys[2], ys[3], avail_s[i]};
        your_type[i] = score(yy, yf);
        for (int k = 0; k < 5; k++) your_rank[i][k] = yy[k];

        int oy[5] = {fr[0], fr[1], fr[2], fr[3], avail_r[i]};
        int of[5] = {fs[0], fs[1], fs[2], fs[3], avail_s[i]};
        opp_type[i] = score(oy, of);
        for (int k = 0; k < 5; k++) opp_rank[i][k] = oy[k];
    }
    bool youWin = true;
    bool oppWin = false;
    for (int oi = 0; oi < navail; oi++) {
        bool oppBeatsAll = true;
        bool youCanBeat = false;
        for (int yi = 0; yi < navail; yi++) {
            if (yi == oi) continue;

            int cmp;
            if (your_type[yi] != opp_type[oi]) {
                cmp = (your_type[yi] > opp_type[oi]) ? 1 : -1;
            } else {
                cmp = 0;
                for (int k = 0; k < 5; k++) {
                    if (your_rank[yi][k] != opp_rank[oi][k]) {
                        cmp = (your_rank[yi][k] > opp_rank[oi][k]) ? 1 : -1;
                        break;
                    }
                }
            }
            if (cmp >= 0) oppBeatsAll = false;
            if (cmp > 0) youCanBeat = true;
        }
        if (oppBeatsAll) oppWin = true;
        if (!youCanBeat) youWin = false;
    }
    if (youWin) cout << "WoYaoYanPai\n";
    else if (oppWin) cout << "GeiWoCaPiXie\n";
    else cout << "PaiMeiYouWenTi\n";
}
int main()
{
    int t=1;
    cin>>t;
    while(t--)
    {
        solve();
    }
}

```
*最后更新：2026年7月27日*