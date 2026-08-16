---
title: "第三场"
date: "2026-08-02"
summary: "牛客多校第三场"
tags: ["集训", "牛客", "多校"]
published: true
category: "2026·暑·牛客多校"
weight: 97
---

## 比赛信息

- **比赛时间**：2026年7月24日 12:00-17:00
- **赛制**：ACM赛制
- **出题组**：小羊肖恩
- **链接**：[牛客多校第三场](https://ac.nowcoder.com/acm/contest/133878)

## 概况

- 入门：K L
- 简单：A G B F
- 中等：E I J
- 较难：M D
- 困难：C H
  
## 题解报告（K L A G B）
### K-转向导航
#### 标签：数学
#### 题意
给定平面上$n$个整点航点$P_1,...,P_n$，汽车依次沿直线段行驶。在每个中间航点，比较到达方向$\colon P_iP_{i+1}$与离开方向$\colon P_{i-1}P_i$，判断左转、右转或是直线。保证不会掉头。
#### 思路
对每个中间航点计算到达与离开方向的向量，然后求叉积，判断叉积的正负。
#### 代码
```cpp
#include<bits/stdc++.h>
#define ll long long
using namespace std;
void solve()
{
    int n;
    cin>>n;
    vector<pair<ll,ll>> a(n);
    for(int i=0;i<n;i++)
    {
        cin>>a[i].first>>a[i].second;

    }
    for(int i=1;i<n-1;i++)
    {
        auto [x,y]=a[i];
        auto [lstx,lsty]=a[i-1];
        auto [nxtx,nxty]=a[i+1];
        ll dx1=x-lstx;
        ll dx2=nxtx-x;
        ll dy1=y-lsty;
        ll dy2=nxty-y;
        if(dx1*dy2==dx2*dy1) cout<<"STRAIGHT ";
        else if(dx1*dy2>dx2*dy1) cout<<"LEFT ";
        else cout<<"RIGHT ";
    }
    cout<<"\n";
}
int main()
{
    ios::sync_with_stdio(false);
    cin.tie(0);
    cout.tie(0);
    int t=1;
    cin>>t;
    while(t--)
    {
        solve();
    }
}
```
### L-登山对决
#### 标签：动态规划
#### 题意
给定$n \times m$的网格，每个格子有互不相同的高度。两位玩家交替移动一面旗帜，每次必须移动到四相邻且高度**严格更高**的格子；无路可走的玩家输。给$q$个独立询问，每个询问指定起始格子，判断在最优博弈下先手胜还是后手胜。
#### 思路
从高到低对每个格子标记先手必胜态和先手必败态，当且仅当存在一个相邻的格子是先手必败态时，当前格子是先手必胜态。
#### 代码
```cpp
#include <bits/stdc++.h>
#define ll long long
using namespace std;
const int dx[4] = {-1, 1, 0, 0};
const int dy[4] = {0, 0, -1, 1};
void solve()
{
    int n, m;
    cin >> n >> m;
    vector<vector<ll>> h(n, vector<ll>(m));
    vector<tuple<ll, int, int>> cells;

    for (int i=0; i < n;i++) {
        for (int j=0; j < m;j++) {
            cin>>h[i][j];
            cells.emplace_back(h[i][j],i,j);
        }
    }
    sort(cells.rbegin(), cells.rend());
    vector<vector<bool>> dp(n, vector<bool>(m, false));
    for (auto [height,r,c] : cells)
    {
        bool f = false;
        for (int k = 0; k < 4;k++)
        {
            int nr = r + dx[k];
            int nc = c + dy[k];
            if (nr >= 0 && nr < n && nc >= 0 && nc < m && h[nr][nc] > height)
            {
                if (!dp[nr][nc])
                {
                    f = true;
                    break;
                }
            }
        }
        dp[r][c] = f;
    }
    int q;
    cin >> q;
    while (q--) {
        int r, c;
        cin >> r >> c;
        r--;
        c--;
        if (dp[r][c]) {
            cout << "First" << endl;
        } else {
            cout << "Second" << endl;
        }
    }
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(0);
    cout.tie(0);
    int T;
    cin >> T;
    while (T--)
    {
        solve();
    }
    return 0;
}
```
### A-比特掩码
#### 标签：位运算 数学
#### 题意
定义$f(x)$为$x$的二进制表示中$1$的极长连续段的个数。  
给定$n$个整数$a_1,...,a_n$。对于$m$个操作，每个操作有$type$和$x$描述：
- $type=1$：$a_i=a_i \And x$
- $type=2$：$a_i=a_i | x$
- $type=3$：$a_i=a_i\oplus x$
#### 思路
维护每个二进制位上的局部状态来动态计算 $f(x)$。使用 `cnt[i][p][q]` 统计第 $i$ 位值为 $p$ 且第 $i+1$ 位值为 $q$ 的总出现次数。由于 $f(x)$ 等于所有“当前位为1且前一位为0”的位置数，即 $\sum cnt[i][1][0]$，只需维护该值。  
对于每种操作（`AND`/`OR`/`XOR`），遍历每一位，枚举该位及其高位的原始状态组合 $(p,q)$，根据位运算规则模拟得到新状态 $(np,nq)$，并将原计数迁移至临时数组。每轮更新时，先从答案中减去该位旧的贡献 $cnt[i][1][0]$，再加上新状态的贡献 $tmp[1][0]$，最后同步更新 $cnt$ 数组。  
该方法避免了重复计算整个数组的 $f(x)$，将单点修改优化为 $O(B)$（B为位数）的位状态转移。  
#### 代码
```cpp
#include<bits/stdc++.h>
#define ll long long
using namespace std;
void solve()
{
    int n;
    cin>>n;
    ll cnt[30][2][2]={0};
    for(int i=0;i<n;i++)
    {
        int val;
        cin>>val;
        bitset<31> v(val);
        for(int j=29;j>=0;j--)
        {
            cnt[j][v[j]][v[j+1]]++;
        }
    }
    ll ans=0;
    for(int i=0;i<30;i++) ans+=cnt[i][1][0];
    int m;
    cin>>m;
    while(m--)
    {
        int op, x;
        cin>>op>>x;
        bitset<31> bs(x);
        for(int i=29;i>=0;i--)
        {
            int c1=bs[i];
            int c2=bs[i+1];
            int tmp[2][2]={0};
            for(int p=0;p<2;p++)
            {
                for(int q=0;q<2;q++)
                {
                    int np,nq;
                    if(op==1) np=p&c1,nq=q&c2;
                    if(op==2) np=p|c1,nq=q|c2;
                    if(op==3) np=p^c1,nq=q^c2;
                    tmp[np][nq]+=cnt[i][p][q];
                }
            }
            ans-=cnt[i][1][0];
            ans+=tmp[1][0];
            cnt[i][0][0]=tmp[0][0];
            cnt[i][0][1]=tmp[0][1];
            cnt[i][1][0]=tmp[1][0];
            cnt[i][1][1]=tmp[1][1];
        }
        cout<<ans<<"\n";
    }
}
int main()
{
    ios::sync_with_stdio(false);
    cin.tie(0);
    cout.tie(0);
    int t=1;
    while(t--) solve();
}
```
### G-矩阵标记
#### 标签：数学
#### 题意
给定一个$n\times m$的数字网格，每个格子中包含一个正整数。如果存在两个格子$(r_1,c_1)$和$(r_2,c_2)$满足$r_1<r_2$且$c_1<c_2$,若这两个格子中的数字相等，则将满足$r_1 \leq r\leq r_2$且$c_1 \leq c\leq c_2$的格子标记。  
输出格子标记情况，每个格子用$1$表示标记，否则用$0$表示。
#### 思路
对每个数值分别处理，收集其所有出现位置并按行排序。同行合并列区间得每行最小/最大列坐标，再预处理前缀最小列与前缀最大列。  
枚举相邻行对 $(r_1, r_2)$，若左边界 $L$（前一行及之前的最小列）严格小于右边界 $R$（后一行及之后的最大列），则以 $(r_1,L)$ 为左上角、$(r_2,R)$ 为右下角的矩形需被标记。  
利用二维差分维护标记区域，最后通过二维前缀和恢复答案矩阵。核心在于将“点对决定矩形”转化为“行间列区间覆盖”，避免直接枚举点对。
#### 代码
```cpp
#include<bits/stdc++.h>
using namespace std;
void solve() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> a(n, vector<int>(m));
    unordered_map<int, vector<pair<int,int>>> pos;
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < m; ++j) {
            cin >> a[i][j];
            pos[a[i][j]].emplace_back(i, j);
        }
    }
    vector<vector<int>> diff(n + 2, vector<int>(m + 2, 0));
    for (auto &[val, vec] : pos) {
        if (vec.size() <= 1) continue;
        sort(vec.begin(), vec.end());

        vector<int> rows;
        for (auto &p : vec) {
            if (rows.empty() || p.first != rows.back())
                rows.push_back(p.first);
        }
        int k = rows.size();
        vector<int> row_min(k), row_max(k);
        int idx = 0; 
        row_min[0] = row_max[0] = vec[0].second;
        for (int i = 1; i < (int)vec.size(); ++i) {
            if (vec[i].first == rows[idx]) {
                row_max[idx] = vec[i].second;
            } else {
   
                ++idx;
                row_min[idx] = row_max[idx] = vec[i].second;
            }
        }
        vector<int> pre_min(k);
        pre_min[0] = row_min[0];
        for (int i = 1; i < k; ++i)
            pre_min[i] = min(pre_min[i-1], row_min[i]);


        vector<int> suf_max(k);
        suf_max[k-1] = row_max[k-1];
        for (int i = k-2; i >= 0; --i)
            suf_max[i] = max(suf_max[i+1], row_max[i]);
        for (int t = 0; t < k-1; ++t) {
            int L = pre_min[t];     
            int R = suf_max[t+1];   
            if (L < R) {
                int r1 = rows[t];
                int r2 = rows[t+1];

                diff[r1][L] += 1;
                diff[r1][R+1] -= 1;
                diff[r2+1][L] -= 1;
                diff[r2+1][R+1] += 1;
            }
        }
    }
    vector<vector<char>> ans(n, vector<char>(m, '0'));
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < m; ++j) {
            if (i > 0) diff[i][j] += diff[i-1][j];
            if (j > 0) diff[i][j] += diff[i][j-1];
            if (i > 0 && j > 0) diff[i][j] -= diff[i-1][j-1];
            if (diff[i][j] > 0) ans[i][j] = '1';
        }
    }
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < m; ++j)
            cout << ans[i][j];
        cout << "\n";
    }
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t = 1;
    while (t--) solve();
    return 0;
}
```
### B-再买一瓶
#### 标签：数学 Raney引理
#### 题意
每瓶饮料售价$1$元，初始有$n$元，每次喝完都有一次中奖概率为$\frac{a}{b}$，中奖后可以获得$c$元。试问恰好喝完$m$瓶饮料且余额为0的概率（概率对$998244353$取模）。
#### 思路
中奖概率为$p=\frac{a}{b}$，未中奖的概率为$q=1-p=\frac{b-a}{b}$。  
设恰好喝完$m$瓶饮料时一共中奖了$w$次，则剩余钱为：  
$$n-m+cw$$
又因为题目要求余额为$0$，所以有： 

$$m-n=cw$$  

所以当$m<n$或者$m-n$不是$c$ 的倍数时，答案为 $0$ 。否则中奖次数为：  

$$w=\frac{m-n}{c}$$
确定中奖次数后，问题转化为：在 $m$ 次独立试验中，恰好中奖 $w$ 次，且在整个过程中余额始终非负（即任意时刻累计中奖获得的钱数 $c \cdot w_i$ 不能低于已花费的钱数 $i-n$）。  
由 Raney 引理（或广义卡特兰数模型），满足该约束的序列数为

$$\frac{n}{m} \binom{m}{w}$$

因此，合法序列的概率为

$$\frac{n}{m} \binom{m}{w} p^w q^{m-w}$$

预处理阶乘及逆元以支持 $O(1)$ 组合数查询，特判 $a=0$（永不中奖）、$n=m$（全未中奖）及 $n>m$ 等边界情况，最终利用费马小定理将除法转为乘法逆元，在模 $998244353$ 下输出结果。

#### 代码
```cpp
#include<bits/stdc++.h>
#define ll long long
#define M 998244353
#define MAXN 2000000
using namespace std;
ll fact[MAXN+1], inv[MAXN+1];
ll ksm(ll x,ll p)
{
    ll ans=1;
    while(p!=0)
    {
        if(p&1) ans=ans*x%M;
        x=x*x%M;
        p>>=1;
    }
    return ans;
}
void init() 
{
    fact[0] = 1;
    for (int i = 1; i <= MAXN; i++) 
	{
        fact[i] = fact[i-1] * i % M;
    }
    inv[MAXN] = ksm(fact[MAXN], M-2);
    for (int i = MAXN-1; i >= 0; i--) 
	{
        inv[i] = inv[i+1]*(i+1) % M;
    }
}
ll ni(ll a,ll b)
{
    return a*ksm(b,M-2)%M;
}
// 组合数 C(n, k) mod M
ll comb(ll n, ll k) 
{
    if (k<0||k>n) return 0;
    return fact[n]*inv[k]%M*inv[n-k]%M;
}
void solve()
{
    ll n,m,c,a,b;

    cin>>n>>m>>c>>a>>b;
    if(a==0)
    {
        if(n!=m) cout<<0<<"\n";
        else cout<<1<<"\n";
        return;
    }
    if(n>m) {cout<<0<<"\n";return;}
    if(n==m)
    {
        cout<<ni(ksm(b-a,n),ksm(b,n))<<"\n";
        return;
    }
    if(n<m)
    {
        ll t=m-n; 
        if(t%c!=0) {cout<<0<<"\n";return;}

        ll cj=t/c;
        ll wcj=m-cj;
        
        ll ans=ni(n,m)*comb(m,cj)%M;
        cout<<ans*ni(ksm(a,cj)*(ksm(b-a,wcj))%M,ksm(b,cj)*ksm(b,wcj)%M)%M<<"\n";
        return;
    }
}
int main()
{
    ios::sync_with_stdio(false);
    cin.tie(0);
    cout.tie(0);
    init();
    int t=1;
    cin>>t;
    while(t--)
    {
        solve();
    }
}
```

---

*最后更新：2026年8月2日*