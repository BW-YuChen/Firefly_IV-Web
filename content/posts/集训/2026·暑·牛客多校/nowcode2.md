---
title: "第二场"
date: "2026-08-02"
summary: "牛客多校第二场"
tags: ["集训", "牛客", "多校"]
published: true
category: "2026·暑·牛客多校"
weight: 98
---

## 比赛信息

- **比赛时间**：2026年7月22日 12:00-17:00
- **赛制**：ACM赛制
- **出题组**：小羊肖恩
- **链接**：[牛客多校第二场](https://ac.nowcoder.com/acm/contest/133877)

## 概况

- 入门：M N
- 简单：B L G H
- 中等：A E F K
- 神秘：C
- 较难：D I J
  
## 题解报告（M N B L G）
### M-Maybe Connected
#### 标签：图论
#### 题意
一个大小为$n$的无向图，添加$m$条边，求连通但不相连的点对的个数的最大值。不允许重边或自环。  
$1\leq n\leq 10^5,0\leq m\leq \min(10^9,\frac{n(n-1)}{2})$
#### 思路
考虑连通块的数量，其越小，连通但不相连的点对越多。
- 当$m\geq n$时，连通块数量为1，最大点对数为$\frac{n(n-1)}{2}-m$。
- 当$m<n$时，连通块数量为$n-m$，最大点对数为$\frac{(m+1)m}{2}-m$。
#### 代码
```cpp
#include<bits/stdc++.h>
#define int long long
using namespace std;
void solve()
{
    int n,m;
    cin>>n>>m;
    int maxn=n*(n-1)/2;
    int ans;
    if(m>=n) ans=maxn-m;
    else {
        ans=(m+1)*m/2-m;
    }
    cout<<ans<<"\n";
}
signed main()
{
    int t=1;
    cin>>t;
    while(t--)
    {
        solve();
    }
}
```

### N-Narrow to Median
#### 标签：数学 贪心
#### 题意
有一个长度为$n$的数组，现对其操作恰一次，每次操作长度为$k$的子序列全部替换为这个子序列的中位数，求数组最后的和的最大值。  
$1\leq k\leq n,\sum n \leq 2\times 10^5,1\leq a_i \leq 10^9$
#### 思路
由于操作对象为子序列，顺序无关，故先对数组升序排序并预处理前缀和 $\text{pre}$。一次操作的贡献等于 $k \cdot \text{med} - S_{\text{sub}}$，其中 $\text{med}$ 为选中子序列的中位数，$S_{\text{sub}}$ 为其和。要使增量最大，当选定中位数位置后，其余元素应尽可能小。

*   **奇数 $k=2m+1$：** 枚举中位数 $a[i]$（$i \in [m+1, n-m]$），左侧固定取最小的 $m$ 个数，右侧取紧邻的 $m$ 个数。增量公式为：
    $$\Delta = k \cdot a[i] - \left( \text{pre}[m] + \left( \text{pre}[i+m] - \text{pre}[i-1] \right) \right)$$
*   **偶数 $k=2m$：** 最优中位数必为相邻两数 $a[i], a[i+1]$（$i \in [m, n-m]$），左侧固定取最小的 $m-1$ 个数，右侧取紧邻的 $m-1$ 个数。增量公式为：
    $$\Delta = \frac{k}{2} \cdot (a[i] + a[i+1]) - \left( \text{pre}[m-1] + \left( \text{pre}[i+m] - \text{pre}[i-1] \right) \right)$$

预处理左侧最小和 $\text{mi}$，结合前缀和快速计算区间和，遍历枚举所有可能的分割点即可求得最大增量 $\max \Delta$，最终答案为 $\text{sum} + \max \Delta$。时间复杂度 $O(n \log n)$。 
#### 代码
```cpp
#include<bits/stdc++.h>
#define ull unsigned long long
#define ll long long
using namespace std;
const ll mod = 1e9 + 7;
const ll MAX = 20007;
int main(){ 
    int t;
    cin >> t;
    while (t--) {
        int n, k;
        cin >> n >> k;
        vector<ll> a(n + 1), pre(n + 1, 0);
        ll sum = 0;
        ll mi = 0;
        for (int i = 1;i <= n;i++) {
            cin >> a[i];
            sum += a[i];
        }
        sort(a.begin(), a.end());
        for (int i = 1;i <= n;i++) {
            if ((k & 1) && i <= k / 2) {
                mi += a[i];
            }
            else if(k%2==0&&(i<=k/2-1)) {
                mi += a[i];
            }
            pre[i] = pre[i - 1] + a[i];
        }
        if (k & 1) {
            ll cnt = k / 2;
            ll ans = LLONG_MIN;
            ll indx = 0;
            for (int i = cnt + 1;i <= n - cnt;i++) {
                ans = max(ans, k * a[i] - (pre[i + cnt] - pre[i-1]+mi));
            }
            cout << ans + sum << "\n";
        }
        else {
            ll cnt = k / 2;
            ll ans = LLONG_MIN;
            for (int i = cnt;i <= n - cnt;i++) {
                ans = max(ans, k / 2 * (a[i] + a[i + 1]) - (pre[i + cnt] - pre[i-1]+mi));
            }
            cout << ans + sum << "\n";
        }
    }
}
```
### B-Bitwise Maximization
#### 标签：数学 线性基 贪心
#### 题意
将一个长度为$n$的序列$A$拆分为两个集合，使得两个集合的异或和最大，输出这个结果。
$\sum n \leq 5\times 10^5,0\leq A_i \leq 2^{30}$
#### 思路
两个集合的异或和的异或等于整个数组的异或和。  
考虑整个数组的异或和结果，对于$1$，一定是一个集合为$1$，另一个集合为$0$。不受影响。  
对于剩下的位，考虑从高到底让每位尽可能为$1$。考虑这些位形成的$mask$取与运算的结果，看这些数形成的最大异或和。     
可以使用**线性基**快速解决。时间复杂度$O(n\log M)$。  
#### 代码
```cpp
#include<bits/stdc++.h>
#define ll long long
using namespace std;
const int bitmaxn=30;
void solve()
{
    int n;
    cin>>n;
    vector<ll>a(n);
    ll sumxor=0;
    for(int i=0;i<n;i++)
    {
        cin>>a[i];
        sumxor^=a[i];
    }
    bitset<bitmaxn+1> xorsum(sumxor);
    bitset<bitmaxn+1> mask;
    for(int i=0;i<bitmaxn;i++)
    {
        if(!xorsum.test(i))
        {
            mask.set(i);
        }
    }
    vector<bitset<bitmaxn+1>> b(n);
    for(int i=0;i<n;i++)
    {
        b[i]=bitset<bitmaxn+1>(a[i])&mask;
    }
    bitset<bitmaxn+1> basis[bitmaxn];
    for(int i=0;i<n;i++)
    {
        bitset<bitmaxn+1> x=b[i];
        for(int j=bitmaxn-1;j>=0;j--)
        {
            if(x.test(j))
            {
                if(basis[j].none())
                {
                    basis[j]=x;
                    break;
                }
                else{
                    x^=basis[j];
                }
            }
        }
    }
    bitset<bitmaxn+1> maxxor(0);
    for(int j=bitmaxn-1;j>=0;j--)
    {
        if(!maxxor.test(j)&&basis[j].any())
        {
            maxxor^=basis[j];
        }
    }
    unsigned long long ans=sumxor+2ULL*maxxor.to_ullong();
    cout<<ans<<"\n";
}
int main()
{
    int t;
    cin>>t;
    while(t--)
    {
        solve();
    }
}
```

### L-Lazy Shuffling
#### 标签：数学 动态规划 拓扑排序
#### 题意
对于一个长度为$n$的排列$A=[A_1,A_2,...,A_n]$，用另一个长度为$n$的排列$p=[p_1,p_2,...,p_n]$打乱成$[A_{p_1},A_{p_2},...,A_{p_n}]$.问有多少个$A$能最大化打乱前后逆序对之差的绝对值？结果对$998244353$取模。  
$n\leq 22$
#### 思路
考虑$p$排列，只有$p_i>p_j(i>j)$，才会影响打乱后的逆序对数之差。所以可以建一个有向图，$i\to j$表示$p_i>p_j$，则逆序对数之差的绝对值最大化等价于拓扑排序的个数。  
考虑dp求拓扑排序的个数，状态为$dp[mask]$表示当前已经放置了哪些元素，转移为枚举下一个放置的元素。**具体而言，预处理 $inmask[j]$ 表示指向节点 $j$ 的所有节点的集合（即位掩码），转移时仅当候选节点 $j$ 的所有前驱均已出现在 $mask$ 中（即 $(inmask[j] \& mask) == inmask[j]$）才能将 $j$ 加入序列。  
由于最大化绝对值存在两种极端情况：一种是让 $A$ 的大小顺序完全顺应 $p$ 的偏序关系（顺应拓扑序），另一种是让 $A$ 的大小顺序完全逆反 $p$ 的偏序关系（逆反拓扑序），因此最终答案应为拓扑排序总数的两倍。特判初始逆序对 $nxd=0$ 的情况，此时 $p$ 为升序，无任何偏序约束，任意排列 $A$ 均最优，直接输出 $n!$。
#### 代码
```cpp
#include<bits/stdc++.h>
#define ll long long
#define M 998244353
using namespace std;

// 预计算阶乘，用于处理 p 为升序时的特殊情况（全排列）
ll fact[23];
void init()
{
    fact[0]=1;
    fact[1]=1;
    for(int i=2;i<=22;i++)
    {
        fact[i]=i*fact[i-1]%M;
    }
}
void solve()
{
    int n;
    cin>>n;
    ll nxd=0; // 记录 p 中原本的逆序对数量（其实主要用于判断是否为升序）
    vector<int> a(n+1); // 存储排列 p
    // inmask[j]: 位掩码，记录了所有指向 j 的节点 i (即满足 p[i] > p[j] 且 i < j 的 i)
    // 例如如果 1->j 且 3->j，则 inmask[j] = 101 (二进制)
    vector<int> inmask(n+1, 0); 
    
    for(int i=1;i<=n;i++)
    {
        cin>>a[i];
    }
    // 预处理建图：枚举所有 i < j 的对
    for(int i=1;i<=n;i++)
    {
        for(int j=i+1;j<=n;j++)
        {
            // 如果 p[i] > p[j]，说明 i 必须在 j 之前（值更大）
            // 这在最大化逆序对差时，强制要求 A[i] > A[j]
            if(a[i]>a[j])
            {
                nxd++; // 统计逆序对
                inmask[j]|=(1<<(i-1)); // 将 i 加入到 j 的依赖集合中
            }
        }
    }
    // 特判：如果 p 中没有逆序对（即 p 是升序的）
    // 此时没有偏序约束，任何 A 都是最优的，答案为 n!
    if(nxd==0)
    {
        cout<<fact[n]%M<<"\n";
        return;
    }
    ll nsize=1<<n; // 状态总数 2^n
    vector<ll> dp(nsize);
    dp[0]=1; // 初始状态：空集有一种方案
    // 枚举所有状态 mask
    // mask 的第 k 位为 1 表示第 k+1 个元素已经被放入序列中
    for(ll i=1;i<nsize;i++)
    {
        // 枚举下一个要放置的元素 j (1-based)
        for(int j=1;j<=n;j++)
        {
            ll b=1<<(j-1); // j 对应的位
            
            // 如果 j 已经在 mask 中，跳过
            if((i&b)==0) continue;
            
            // 关键判断：检查 j 的所有前驱是否都在 i 中
            // (inmask[j] & i) == inmask[j] 确保：凡是依赖的节点，都已经选了
            // 或者说：i 包含了 inmask[j] 的所有位
            if((inmask[j]&i)==inmask[j])
            {
                ll p=i^b; // 去掉 j 的前一个状态
                dp[i]=(dp[i]+dp[p])%M; // 状态转移累加
            }
        }
    }
    // dp[(1<<n)-1] 即为拓扑排序的总数
    // 因为顺应偏序是一种，逆反偏序也是一种，所以乘以 2
    ll topo=dp[nsize-1];
    cout<<(2*topo)%M<<"\n";
}
int main()
{
    ios::sync_with_stdio(false);
    cin.tie(0);
    cout.tie(0);
    init();
    int t=1;
    while(t--)
    {
        solve();
    }
}
```
### G-GCD Graph
#### 标签：图论 动态规划 数学
#### 题意
对于一个由所有正整数构成的图，对于$u<v$,存在$u$到$v$且权为$gcd(u,v)$的边。对于$u<v$,记$u$到$v$的最短路为$dis(u,v)$，求$\sum_{i=l}^{r} dis(i,n)$  
$1\leq l\leq r<n\leq 10^7$
#### 思路
本题利用图论性质转化最短路：若 $\gcd(i,n)>1$，则 $dis(i,n)=\gcd(i,n)$；若 $\gcd(i,n)=1$，则需经中转点 $k$，代价为 $\gcd(i,k)+\gcd(k,n)$。  
首先特判 $n$ 为素数时所有距离均为 $2$。否则分解 $n$ 的质因子，利用容斥原理快速统计区间 $[l,r]$ 内与 $n$ 不互质的数的贡献。接着寻找最大的满足 $\gcd(x,n)=1$ 的素数 $x$ 作为分界点：
- 若 $x \ge r$，区间内所有数互质，答案即为区间长度乘 $2$;
- 若 $x$ 在区间内，则 $[l,x]$ 段用容斥计算，$[x+1,r]$ 段利用 DP 从 $n-1$ 向下递推（状态转移方程为 $dp[i]=\min(\gcd(i,n), \min_{j>i}(dp[j]+\gcd(i,j)))$），并通过剪枝（一旦发现 $\gcd(i,n)>1$ 即停止向后更新）优化效率；
- 若未找到 $x$，则对 $[l,r]$ 全段 DP。最终累加得到答案。
#### 代码
```cpp
#include<bits/stdc++.h>
#define ll long long
#define ull unsigned long long
using namespace std;
const ll mod = 1e9 + 7;
const ll MAX = 20007;
int _gcd(int a, int b) {
    while (b) {
        int t = a % b;
        a = b;
        b = t;
    }
    return a;
}
int n,l,r;
bool isPrime(int n){
    for(int i=2;i*i<=n;i++){
        if(n%i==0){
            return false;
        }
    }
    return true;
}
ll count(vector<int>& a, ll x) {
    if (x == 0) return 0;
    int size = a.size();
    ll cnt = 0;
    for (int i = 0;i < (1 << size);i++) {
        ll res = 1;
        int bit = 0;
        for (int j = 0;j < size;j++) {
            if ((1 << j) & i) {
                bit++;
                res *= a[j];
            }
        }
        if (bit & 1)cnt -= x/res;
        else cnt += x/res;
    }
    return cnt;
}
void solve() {
    cin >> l >> r >> n;
    int x = -1;
    for (int i = n-1;i >= l;i--) {
        if (isPrime(i)&&_gcd(i,n)==1) {
            x = i;
            break;
        }
    }
    int temp = n;
    vector<int> a;
    if(isPrime(n)){
        cout<<(r-l+1)<<"\n";
        return ;
    }
    for (int i = 2;i * i <= temp;i++) {
        if (isPrime(i) && temp % i == 0) {
            a.push_back(i);
            while (temp % i == 0) temp /= i;
        }
    }
    if (temp != 1) a.push_back(temp);
    vector<int> dp(n + 1, 0);
    ll ans = 0;
    if (x >= r) {
        ll right = count(a, r);
        ll left = count(a, l - 1);
        cout << (r - l + 1-right+left)*2+right-left << "\n";
        return;
    }
    if (x != -1) {
        ll right = count(a, x);
        ll left = count(a, l - 1);

        ans += (right-left)+(x-l+1-right+left)*2;
        for (int i = n-1;i >= x + 1;i--) {
            dp[i] = _gcd(i, n);
            for (int j = n;j > i;j--) {
                dp[i] = min(dp[j] + _gcd(i, j), dp[i]);
            }
            if(i<=r)
            ans += dp[i];
        }
    }
    else {
        for (int i = n-1;i >= l;i--) {
            dp[i] = _gcd(i, n);
            for (int j = n;j > i;j--) {
                dp[i] = min(dp[j] + _gcd(i, j), dp[i]);
            }
            if(i<=r)
            ans += dp[i];
        }
    }
    cout << ans << "\n";
}
int main() {
    ios::sync_with_stdio(0);
    cin.tie(0), cout.tie(0);
    int t;
    cin >> t;
    while (t--) {
        solve();
    }
}
```

---

*最后更新：2026年8月2日*