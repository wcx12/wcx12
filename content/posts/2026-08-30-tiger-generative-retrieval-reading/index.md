---
title: "TIGER：从语义 ID 到生成式推荐"
slug: "tiger-generative-retrieval-reading"
date: "2026-08-30"
updated: "2026-09-04"
description: "从传统 ANN 检索到参数化生成，重新梳理 TIGER、RQ-VAE 与 Semantic ID 的完整链路，并区分冷启动、多样性、层次性和扩展性中哪些结论真正得到了实验支持。"
category: "Research Notes"
tags: ["generative-recommendation", "semantic-id", "rq-vae", "tiger"]
research: []
featured: false
draft: false
math: true
toc: true
lang: "zh"
socialImage: "media/social-card.png"
socialImageAlt: "TIGER：从语义 ID 到生成式推荐"
---

> **导语：** TIGER 最值得注意的地方，也许不是它使用 Transformer 生成物品，而是它先把物品 ID 变成了一种可学习、可共享的离散语言。

我过去理解的推荐检索，大体遵循同一种结构：模型先根据用户历史得到一个用户向量，再去物品向量库中做 [ANN](term:ann) 或 [MIPS](term:mips)，找出相似度最高的候选物品。

```text
用户历史
→ 用户/查询向量
→ 外部物品索引
→ ANN 或 MIPS
→ Top-K 候选
```

模型可以从 RNN 换成 Transformer，也可以加入文本、图像或其他辅助信息，但“先表示用户，再搜索物品”的分工通常没有改变。模型负责理解用户，外部索引负责寻找物品。

[TIGER](https://proceedings.neurips.cc/paper_files/paper/2023/hash/20dcab0f14046a5c6b02b61da9f13229-Abstract-Conference.html) 提出了一个很直接的问题：既然 Transformer 可以生成一段序列，推荐系统能不能不再输出用于搜索的用户向量，而是直接生成下一个物品的 ID？

```text
用户历史
→ Transformer
→ 下一个物品的 ID
```

这听起来像是把检索替换成生成，但很快会遇到第一个障碍：普通 Item ID 没有任何语义。

编号 233 和 234 相邻，并不意味着对应的两个物品相似。如果每个物品仍然只是一个完全独立的类别，那么让 Transformer 预测 Item ID，本质上仍然接近一个超大规模分类问题。低频物品缺少训练信号，新物品也没有可以被模型直接生成的表示。

所以，TIGER 真正的第一步并不是更换检索器，而是重新设计物品 ID。

## 在生成物品之前，先把物品变成一种语言

TIGER 不再使用随机、原子的 Item ID，而是为每个物品构造由多个 token 组成的 **Semantic ID**。

```text
普通 Item ID：233
Semantic ID：(12, 24, 52)
```

如果两个物品在内容空间中比较相似，它们可能共享部分 token：

```text
物品 A：(12, 24, 52)
物品 B：(12, 24, 61)
```

这个变化看起来不大，实际改变了模型理解物品的方式。普通 Item ID 把每个物品视为互不相关的原子；Semantic ID 则允许不同物品共享一部分离散表示。模型在高频物品上学到的 token 表示，理论上也可以被相似的低频物品使用。

从这个角度看，Semantic ID 同时承担了三种作用：

- 把连续的物品内容表示压缩成离散 code；
- 让物品之间可以共享一部分 token；
- 把开放的物品集合翻译成 Transformer 可以生成的有限词表。

更完整的生成式推荐流程见[图 1](#fig-tiger-semantic-id-flow)：物品侧先把 item 文本信息编码成 embedding，再通过 RQ-VAE 这样的量化模型变成 Semantic ID；用户侧则把交互序列输入生成器，让生成模型预测下一个语义 item。

::tiger-pipeline

## RQ-VAE 如何生成 Semantic ID

[图 1](https://wcx12.github.io/wcx12/blog/posts/tiger-generative-retrieval-reading/#fig-tiger-semantic-id-flow) 上方的物品侧分支对应这里的核心操作。TIGER 首先把物品的标题、类别、品牌等信息组成文本，通过 Sentence-T5 得到 768 维内容 embedding。随后，RQ-VAE 的编码器将它压缩到 32 维潜在空间，再进行三层残差量化。

残差量化可以理解为一个逐层修正的过程。

第一层码本先选择一个最接近当前向量的 codeword。这个 codeword 无法完全重构原向量，于是计算它留下的残差。第二层码本继续近似这个残差，第三层再修正剩余部分。

这里先把符号说清楚。TIGER 的 RQ-VAE 不是直接量化原始文本，而是先把 item 内容 embedding 记为 $x$，再用编码器 $E(\cdot)$ 得到潜在向量 $z=E(x)$。第 $d$ 层码本记为 $C_d$，里面有若干 codeword 向量；$c_d$ 是第 $d$ 层选中的 codeword 编号，$e_{c_d}$ 是对应的 codeword 向量。$r_d$ 表示进入第 $d$ 层量化器的残差，$m$ 表示残差量化层数。TIGER 主实验里前三位 Semantic ID 来自 $m=3$ 层 RQ-VAE；如果多个 item 得到相同的三元 ID，论文会在后面的[碰撞处理](#碰撞发生后怎么办)阶段追加一个额外 token。这个 token 用来恢复 item 唯一性，不属于残差量化层本身，也不会参与 RQ-VAE 的重构或量化损失。

在第 $d$ 层，量化器做的最近邻选择可以写成：

$$
c_d=\arg\min_k \lVert r_d-e_k^{(d)}\rVert_2^2.
$$

为避免后面符号太重，下面把第 $d$ 层选中的 $e_{c_d}^{(d)}$ 简写为 $e_{c_d}$。

设初始潜在向量为 $z$：

$$
r_0=z,\qquad r_{d+1}=r_d-e_{c_d}.
$$

经过 $m$ 层后：

$$
r_m=z-\sum_{d=0}^{m-1}e_{c_d}.
$$

因此，量化表示自然写成：

$$
\hat z=\sum_{d=0}^{m-1}e_{c_d}.
$$

各层 codeword 的编号组成物品的 Semantic ID：

```text
内容 embedding
→ RQ-VAE encoder
→ 第一层量化整体向量
→ 第二层量化第一层残差
→ 第三层量化第二层残差
→ Semantic ID (c_0,c_1,c_2)
```

各层码向量最后相加，并不是额外设计出来的技巧。量化时逐层做减法，重构时自然需要把各层近似结果加回来。最终残差 $r_m=z-\hat z$ 越小，量化表示就越接近原始潜在向量。

### RQ-VAE 的损失函数

从训练目标看，RQ-VAE 仍然先是一个 autoencoder。编码器把内容 embedding $x$ 压成 $z$，残差量化得到 $\hat z$，解码器再从 $\hat z$ 重构出 $\hat x$。因此最基本的信号是重构损失：

$$
L_{\text{recon}}=\lVert x-\hat x\rVert^2.
$$

这个重构项就是这里 “VAE / AutoEncoder” 含义最直观的部分：Semantic ID 不是只要离散就可以，它必须保留足够多的 item 内容信息，才能让 decoder 把输入 embedding 还原回来。TIGER 论文里的 RQ-VAE 总损失可以理解为：

$$
L(x)=L_{\text{recon}}+L_{\text{rqvae}},\qquad
L_{\text{rqvae}}=\sum_{d=0}^{m-1}L_d.
$$

这里 $L_{\text{recon}}$ 负责“能不能重构 item 内容”，$L_{\text{rqvae}}$ 负责“残差和离散码本能不能对齐”。

具体到第 $d$ 层，论文使用的量化损失是：

$$
L_d=
\lVert \operatorname{sg}[r_d]-e_{c_d}\rVert^2
+\beta\lVert r_d-\operatorname{sg}[e_{c_d}]\rVert^2.
$$

其中，$L_d$ 是第 $d$ 层的量化损失，$r_d$ 是该层 residual，$e_{c_d}$ 是该层被选中的 codeword，$\beta$ 是 commitment 项权重；$\operatorname{sg}$ 表示 stop-gradient：前向计算时保留原值，反向传播时梯度为零。

这个公式的关键不是“又多写了两个平方误差”，而是 stop-gradient 把同一层量化里的两类更新方向拆开了：一边更新码本，让选中的 codeword 靠近当前 residual；另一边更新编码器，让它输出的 residual 愿意稳定地落到这个 codeword 附近。

::disclosure[为什么这个损失函数要拆成两项？]
先看第一项：

$$
L_{code}=\lVert \operatorname{sg}[r_d]-e_{c_d}\rVert^2,
$$

这里的 $\operatorname{sg}[r_d]$ 表示把当前 residual 当作常量。反向传播时，梯度不会回到 $r_d$，只会更新被选中的 codeword $e_{c_d}$：

$$
\frac{\partial L_{code}}{\partial e_{c_d}}
=2(e_{c_d}-r_d),
\qquad
\frac{\partial L_{code}}{\partial r_d}=0.
$$

所以这一项的作用是训练码本：哪个 codeword 被选中了，就把哪个 codeword 拉向当前 residual，让码本逐渐贴近数据分布。

再看第二项：

$$
L_{commit}=\beta\lVert r_d-\operatorname{sg}[e_{c_d}]\rVert^2,
$$

这里的 $\operatorname{sg}[e_{c_d}]$ 表示把 codeword 当作常量。反向传播时，梯度不会更新这个 codeword，而是回到产生 $r_d$ 的编码器：

$$
\frac{\partial L_{commit}}{\partial r_d}
=2\beta(r_d-e_{c_d}),
\qquad
\frac{\partial L_{commit}}{\partial e_{c_d}}=0.
$$

所以这一项的作用是训练编码器：既然它已经选择了这个 codeword，就要让自己的输出靠近这个 codeword，也就是 commitment。参数 $\beta$ 控制这种约束的强度。

把两项放在一起看，$L_{code}$ 主要回答“码本应该往哪里移动”，$L_{commit}$ 主要回答“编码器应该如何适应离散码本”。这样拆开后，码本和编码器各自有清楚的梯度方向，而不是在同一个普通误差项里互相追逐。
::

因此，完整 RQ-VAE 训练可以理解成三件事同时发生：重构损失要求 $\hat x$ 保留 item 内容信息；$L_{code}$ 让码本学习 residual 的分布；$L_{commit}$ 让 encoder 输出适应离散码本。三者一起训练 encoder、decoder 和 codebook，最后得到可重构、可生成的 Semantic ID。

::disclosure[补充：为什么使用 K-means 初始化码本？]
如果码本随机初始化，一些 code vector 可能远离任何训练样本。最近邻选择是离散操作：一个 code 如果从未成为任何样本的最近邻，就收不到有效更新，最后成为 dead code。大量样本集中选择少数 code，就会形成 codebook collapse。

论文在第一个训练 batch 上做 K-means，并用聚类中心初始化码本。这能让初始 code 落在数据密集区域，提高它们在训练早期被选中的机会。

这项设计是合理的，但它只能降低 collapse 风险，并不能保证后续训练不再发生坍缩。实际复现时仍然需要持续观察每层 code usage、选择频率分布、perplexity 和 dead code 数量，而不能只在训练结束时检查一次利用率。

关于这个问题，我后来又做了一组更完整的实验。结果比“使用 K-means 就能避免坍缩”复杂得多：提高利用率不一定提高推荐指标，真正的问题还包括 hard assignment、条件路径和下游预测任务是否对齐。完整实验见：[TIGER 的语义 ID 为什么会坍缩](../tiger-semantic-id-codebook-capacity/)。
::

### 碰撞发生后怎么办

不同物品可能得到相同的三元 Semantic ID。RQ-VAE 训练结束后，论文会检测这些碰撞，并在碰撞组内部追加一个局部编号：

```text
(12,24,52) → (12,24,52,0)
(12,24,52) → (12,24,52,1)
```

即使没有碰撞，也使用 0 补齐第四位，让所有 ID 长度一致。

第四个 token 不属于残差量化过程，也不一定带有内容语义。它只是同一碰撞组内部的唯一标识，不参与前面的 RQ-VAE 训练；只有到了后续的生成式推荐训练阶段，它才会作为目标 Semantic ID 序列的一部分，被 Transformer 的 next-token objective 学到。这是一个实用的小技巧，但也提醒我们：前三位负责语义表示，第四位主要负责恢复唯一性，两者的性质并不相同。

## 理论容量并不等于实际有效容量

论文每层使用 256 个 codeword，RQ-VAE 共三层，并要求训练后的 codebook usage 达到 80% 以上。这里很容易把几个不同概念混在一起。

单层码本的设计容量是 256；usage 80% 表示一层中至少约 205 个 code 被物品实际选中过。它并不表示所有 code 组合中有 80% 是有效的。

三层 RQ-VAE 的理论组合空间是：

$$
256^3=16{,}777{,}216.
$$

但实际出现过的三元组最多不超过数据集中的物品数，而且不同层 code 之间存在相关性，不会均匀覆盖笛卡尔积空间。

如果把第四个 collision token 也当作拥有 256 种可能，完整四位空间为：

$$
256^4=4{,}294{,}967{,}296.
$$

也就是约 42.95 亿。原论文把它写成了“约 4 trillion”，这里存在明显的数量级错误。

最终真正有效的唯一 ID 数基本等于语料中的物品数。在论文使用的数据集上，这个数字只有 10K–20K。因此至少需要区分：

- 单层 codebook 的名义大小；
- 每层真正活跃的 code 数；
- 多层 code 的理论组合空间；
- 数据中实际出现的语义前缀；
- 追加碰撞编号后的有效物品 ID。

三层、每层 256、usage 80% 都是论文采用的工程设置，不是被消融实验证明的最优选择。为什么不是两层 512、四层 128，论文没有给出系统解释。

## “从粗到细”究竟是什么意思

论文反复强调 RQ-VAE 能获得 coarse-to-fine 的 Semantic ID。但“粗到细”至少有三种不同含义。

第一种是**重构意义上的粗到细**。第一层解释较大部分向量，后续层逐步修正残差。这是 RQ-VAE 结构本身能够支持的说法。

第二种是**几何意义上的层次**。共享更多前缀的物品，在 embedding 空间中是否确实更接近？这需要额外统计验证。

第三种是**人工标签意义上的层次**。第一位代表大类别，第二位代表子类别，第三位代表更细的属性。这个结论不会由残差量化自动产生。

逐层降低重构误差，只能说明后面的 codeword 在修正前面未解释的部分，不能直接推出：

```text
第一位 = 大类
第二位 = 子类
第三位 = 细粒度属性
```

论文确实提供了层次性可视化，但在这部分实验中使用的三层码本大小是 4、16、256，而主实验通常是 256、256、256。当前两层容量被人为限制得很小时，大量物品必然共享前缀，更容易呈现从大类到细分的视觉效果。

因此，这项实验不能干净地证明：当每层容量都为 256 时，RQ-VAE 仍会自然形成同样清晰的语义标签层次。

更准确的判断是：RQ-VAE 提供了逐层残差修正结构，也可能形成有用的前缀相似性；但论文把这种数值近似进一步解释成可控的语义层级，现有证据还不完全充分。

## 为什么选择 RQ-VAE，而不是其他量化方式

可以把论文提到的方案放在同一个坐标系里理解。

| 方法 | 基本思路 | 优点 | 主要问题 | 论文是否直接实验 |
|---|---|---|---|---|
| Random ID | 随机分配多个 code | 提供无语义对照 | 不保留内容相似性 | 是 |
| LSH / SimHash | 用随机超平面产生多组 hash code | 快、无需训练、容易扩展 | 不适应具体数据分布，也不优化重构 | 是 |
| Product Quantization | 拆分向量子空间，分别量化 | 压缩和 ANN 检索成熟 | 各位 code 对应不同子空间，不天然粗到细 | 否 |
| Hierarchical k-means | 递归进行硬聚类，ID 表示树路径 | 层级直观 | 早期硬边界不可逆，跨分支相似性被截断 | 否 |
| VQ-VAE | 用单层学习码本量化 latent vector | 能学习数据相关的离散表示 | 没有逐层残差结构 | 只在文字中声称试过 |
| RQ-VAE | 多层码本逐层量化残差 | 学习数据分布并逐步降低残差 | 训练复杂，有坍缩、碰撞与层次解释问题 | 是 |

Hierarchical k-means 的问题并不是聚类完全没有语义，而是语义相似性容易被树的硬边界截断。两个非常相近的物品如果在第一层被分到不同父簇，后续就永远在不同子树中细分，ID 的第一个 token 完全不同；而同一个父簇中距离较远的物品却仍然共享前缀。

换句话说，树路径保留的是分区关系，而不是连续的全局距离；上层的错误也无法被下层修正。RQ 的残差量化至少允许后续 codeword 继续修正整体向量，而不是只在一个隔离子树内部继续切分。

论文真正给出的量化对照只有 Random ID、LSH SID 和 RQ-VAE SID：

| 方法 | Sports R@5 / R@10 | Beauty R@5 / R@10 | Toys R@5 / R@10 |
|---|---:|---:|---:|
| Random ID | 0.0070 / 0.0116 | 0.0296 / 0.0434 | 0.0362 / 0.0448 |
| LSH SID | 0.0215 / 0.0321 | 0.0379 / 0.0533 | 0.0412 / 0.0566 |
| RQ-VAE SID | 0.0264 / 0.0400 | 0.0454 / 0.0648 | 0.0521 / 0.0712 |

RQ-VAE 相对 LSH 的 Recall 和 NDCG 在三个数据集上均有大约 20%–26% 的相对提升。这足以支持“在 TIGER 中，学习式 RQ-VAE ID 比随机超平面 LSH 更有效”，但不能推出 RQ-VAE 优于所有量化方法。

Product Quantization、hierarchical k-means 和 VQ-VAE 都没有出现在同一张实验表里。RQ-VAE 的收益究竟来自残差结构、非线性编码器，还是更充分的训练，也没有被进一步拆开。

## 当交互历史变成 token 序列，推荐才真正成为生成

得到 Semantic ID 后，用户的交互历史会从物品序列变成 token 序列。这对应[图 1](#fig-tiger-semantic-id-flow) 右侧的用户侧分支：生成模型的输入是用户历史，输出才是下一个可映射回物品库的语义 item。

```text
Item A → Item B → Item C

变为：

(a₁,a₂,a₃,a₄)
→ (b₁,b₂,b₃,b₄)
→ (c₁,c₂,c₃,c₄)
```

这些 ID 被直接展平，输入编码器—解码器 Transformer。模型根据用户历史逐 token 预测下一个物品的完整 Semantic ID。

传统检索与 TIGER 的差别可以压缩成：

```text
传统推荐：
User History → Query Embedding → External ANN Index → Item

TIGER：
User History → Transformer → Generate Semantic ID → Item
```

论文把这种设计称为 **Transformer memory acts as an index**。

::disclosure[Hint：Transformer memory 为什么可以被叫作索引？]
这里的 memory 指 Transformer 的模型参数，不是 KV Cache，也不是额外的存储模块。训练把“用户交互 token 序列更可能对应哪个后续 Semantic ID”的关系编码进参数。

传统索引显式保存 item embedding，并使用 [ANN](term:ann)/[MIPS](term:mips) 查询；TIGER 则通过模型前向计算，从参数化条件分布中生成候选 ID。因此它更接近 parameterized index，而不是传统意义上可以直接枚举和更新的索引表。
::

参数化索引并不意味着所有外部结构都消失了。系统仍然需要维护 Item ID 与 Semantic ID 的双向映射，而且模型参数不像 ANN 索引那样容易插入、删除或直接检查某个物品。更新成本只是从“重建向量索引”部分转移到了“更新量化映射或模型参数”。

### 模型会不会主要学习同一物品内部的 token 转移

将四位 ID 直接展平后，next-token objective 会同时学习两类关系：

```text
同一 item 内部：c₁ → c₂ → c₃ → c₄
不同 item 之间：上一 item 的 c₄ → 下一 item 的 c₁
```

这带来一个论文没有回答的问题：模型是否花费了大量能力去补全同一个物品内部的 Semantic ID，而不是学习真正的物品行为转移？

另一种可能是，item 内部的 token 组合学习恰好帮助模型掌握“什么样的 ID 是合法的”，从而解释为什么生成无效 ID 的概率很低。后续可以通过比较不同 token 位置的 loss、加入 item boundary、只在 item 级位置计算损失，或者并行预测四位 ID 来验证。

### 用户 token 为什么可能有效

论文还把 raw user ID 固定哈希到 2000 个 bucket token。它不是每次随机映射，但多个用户会发生哈希碰撞。

| 设置 | Recall@5 | NDCG@5 | Recall@10 | NDCG@10 |
|---|---:|---:|---:|---:|
| 无用户信息 | 0.04458 | 0.0302 | 0.06479 | 0.0367 |
| 加用户 token | 0.0454 | 0.0321 | 0.0648 | 0.0384 |

Recall@10 几乎不变，Recall@5 小幅提高，NDCG 的提升更明显。这更像是候选位置和个性化有所改善，而不是召回能力全面上升。

哈希 token 为什么有用，论文没有给出充分解释。一个可能原因是历史最多只保留 20 个 item，用户 token 提供了稳定的长期条件；也可能是 2000 个 bucket 提供了粗粒度用户偏置，碰撞同时产生了一种参数共享或正则化。它也可能受到额外参数量或单次运行波动影响。不同 bucket 数量、多随机种子以及唯一 user embedding 的对照仍然有必要。

## 模型如何从概率分布变成 Top-K 物品

生成器使用 4 层 Transformer encoder 和 4 层 decoder，每层有 6 个 attention head，head dimension 为 64，模型约 13M 参数。

论文对 3、4、5 层做了消融：

| 层数 | Recall@5 | NDCG@5 | Recall@10 | NDCG@10 |
|---:|---:|---:|---:|---:|
| 3 | 0.04499 | 0.03062 | 0.06699 | 0.03768 |
| 4 | 0.04540 | 0.03210 | 0.06480 | 0.03840 |
| 5 | 0.04633 | 0.03206 | 0.06596 | 0.03834 |

这个结果不能简单概括成“层数越多越好”：5 层的 Recall@5 最高，3 层的 Recall@10 反而最高，4 层在 NDCG 上略好。更稳妥的判断是，模型在 3–5 层之间不太敏感，4 层是一种折中配置，而不是被实验明确证明的最优层数。

### Beam search 在这里做了什么

模型在第一个位置输出 token 概率，beam search 保留累计 log-probability 最高的 $B$ 条前缀；下一步分别扩展这些前缀，再从全部扩展结果中保留最优的 $B$ 条。不断重复，直到生成完整 ID。

```text
保留 B 个高概率前缀
→ 扩展每条前缀
→ 再保留累计得分最高的 B 条
→ 得到多个完整 Semantic ID
```

Beam search 的目标是近似寻找若干条高概率序列。它比 greedy decoding 覆盖更多候选，但默认仍然偏向模型概率最高的区域，本身不等于多样性采样。

### 生成无效 ID 怎么办

模型可以生成一个语法上完整、但数据库中不存在的 Semantic ID。论文没有通过约束解码从结构上消除这种情况，只是观察到 Top-10 的 invalid ID 比例约为 0.1%–1.6%；Top-20 时，不同数据集约为 0.3%–6%。

这只是实验现象，并不是理论保证。

论文建议扩大 beam size，生成更多候选后过滤无效 ID，直到留下足够的有效结果；还提出未来可以用 prefix matching 将无效 ID 映射到共享有效前缀的物品。

另一个更直接的方案是维护 Semantic ID trie，在每一步解码时屏蔽无法组成有效 ID 的 token。这样可以保证生成结果有效，但也会重新引入一个外部合法前缀结构。

## 冷启动：TIGER 的能力，还是内容模型的能力

论文将推荐新物品视为 TIGER 的重要能力。在 Beauty 数据集上，它从测试 item 中选择 5%，删除这些 item 在训练 split 中的交互，把它们当作 unseen items。

训练完成后，冻结的 RQ-VAE 仍然可以根据内容为 unseen item 生成前三个语义 token。模型预测一个四位 Semantic ID 时：

1. 使用完整 ID 匹配 seen item；
2. 将前三位语义 token 相同的 unseen items 加入候选；
3. 用参数 $\epsilon$ 限制最终 Top-K 中 unseen items 的最大比例。

这个设置是合理的 item cold-start 模拟：它阻断物品的行为交互，但保留新物品在现实中通常能够获得的文本内容。

问题在于，这种能力并不是生成式推荐天然独有。只要一种推荐方法能够使用文本、图像或其他模态为新物品计算表示，它原则上也拥有内容冷启动通路。

因此，更精确的评价应该是：

> TIGER 证明了 Semantic ID 与生成式检索可以接入 unseen item，但没有证明只有生成式推荐能够解决冷启动。它真正特殊的是，新物品不需要在序列模型的原子 Item ID 词表中出现；只要能被内容编码器映射到已有的语义 token 空间，就有机会进入候选。

实验还有一些没有交代清楚的地方：多个 unseen item 共享前三位前缀时如何排序，$\epsilon K$ 的 unseen 配额如何与 seen 候选合并，以及新物品的第四位碰撞 token 如何处理。论文主要与 Semantic_KNN 比较，也没有覆盖所有内容增强的 sequential recommender。

所以，这项实验支持的是“TIGER 在这套 protocol 下优于 Semantic_KNN”，而不是“传统方法不能处理冷启动”。

## 多样性：温度提高了熵，但这是谁的贡献

论文通过 temperature-based decoding 增加推荐多样性。若模型输出 logits $z_i$，温度 $T$ 后的分布为：

$$
p_i(T)=\frac{\exp(z_i/T)}{\sum_j\exp(z_j/T)}.
$$

当 $T>1$ 时，概率分布被压平，原本概率较低的 token 更容易被采样，因此输出通常更分散；当 $T<1$ 时，分布变尖，模型更集中地选择头部 token。

这与 beam search 并不是一回事：

- Beam search 从概率分布中近似寻找得分最高的若干条序列；
- 温度采样先改变概率分布，再随机抽取 token；
- 二者可以组合，但论文没有清楚交代多样性实验是否采用了 stochastic beam search。

Beauty 数据集上的结果是：

| 温度 | Entropy@10 | Entropy@20 | Entropy@50 |
|---:|---:|---:|---:|
| 1.0 | 0.76 | 1.14 | 1.70 |
| 1.5 | 1.14 | 1.52 | 2.06 |
| 2.0 | 1.38 | 1.76 | 2.28 |

它说明提高温度会增加 Top-K 物品类别分布的熵。但这是生成模型普遍具有的解码性质，很难单独算作 TIGER 的特有贡献。

TIGER 更独特的主张是：在 Semantic ID 的第一位采样可以改变粗类别，在第二、三位采样可以改变类内物品。但这个能力依赖 Semantic ID 是否真的形成了稳定的粗到细语义层次。既然层次性证据本身仍有疑问，多样性的“可控层级”也不能仅凭温度实验得到证明。

## 它真的更容易扩展吗

TIGER 在表示存储上确实有吸引力。传统模型可能为每个物品维护独立 embedding；TIGER 的物品 token embedding 只需要覆盖各层 codeword。主设置中是 $4\times256=1024$ 个 token embedding，而数据集有 10K–20K 个物品。

但生成式检索没有消灭检索成本，只是重新分配了成本。ANN 能够并行搜索候选，而 TIGER 需要逐 token 自回归解码，并通过 beam search 获取 Top-K。beam 越大，找到足够多有效候选的机会越高，推理成本也越大。

更准确的权衡是：

> TIGER 用紧凑、可共享的结构化物品表示，交换了更复杂的自回归候选生成过程。

### 数据集融合实验验证了什么

论文把 Beauty、Sports 和 Toys 的全部物品合并起来生成统一 Semantic ID，然后只在 Beauty 推荐任务上使用这些 ID，并与只使用 Beauty 物品训练的码本比较。

| Semantic ID 来源 | Recall@5 | NDCG@5 | Recall@10 | NDCG@10 |
|---|---:|---:|---:|---:|
| 三个数据集合并 | 0.04355 | 约 0.03047 | 0.06314 | 0.03676 |
| 仅 Beauty | 0.0454 | 0.0321 | 0.0648 | 0.0384 |

原表将 combined 的 NDCG@5 印成 0.3047，按其他指标的量级，应当是漏写了一个 0。

合并数据后，Beauty 指标下降约 2.6%–5.1%。这可以说明固定容量码本面对三个相近 Amazon 类别的物品时，表示质量只出现小幅退化。

但这不是完整的 scalability 证明。实验没有测量更大数量级的物品、训练时间、推理延迟、持续新增物品、跨域用户迁移或码本重训后的 ID 稳定性。与其称为“扩展性实验”，更适合把它理解为“统一码本在小规模语料扩张下的稳健性测试”。

### 未报告的 6×64 实验

论文还提到尝试过六层、每层 64 个 codeword，并称推荐指标对这种变化比较稳健，但没有提供具体结果。

它也不是严格的等容量比较：

$$
256^3=2^{24},\qquad 64^6=2^{36}.
$$

六层配置的理论组合空间更大，同时每个物品需要更多 token，输入长度和自回归解码成本也会增加。后续如果重新实验，需要分别控制理论容量、序列长度和计算量，而不能只比较最终推荐指标。

## TIGER 真正改变了什么

读完 TIGER 后，最容易得到的结论是“推荐也可以像语言模型一样生成物品”。但把方法拆开后会发现，生成并不是故事的起点。

真正让生成式检索成立的，是物品表示先发生了变化：物品不再是互不相关的原子 ID，而是由多个可共享 token 组成的 Semantic ID。RQ-VAE 将连续内容空间翻译成有限离散词表，Transformer 才能够像生成语言一样生成物品。

这条路线带来了真实的启发：

- 物品 ID 可以被学习，而不必只是数据库编号；
- 相似物品可以通过共享 code 获得参数和训练信号共享；
- 新物品可以依赖内容映射到已有 token 空间；
- 推荐检索关系可以被部分吸收到模型参数中。

但论文的一些更强主张仍然需要保留距离：

- 冷启动能力很大程度上来自内容表示，不是生成式推荐独有；
- 温度增加多样性是通用生成机制，不是 TIGER 特有贡献；
- 残差量化的逐层修正不等于真实标签的语义层次；
- RQ-VAE 只与 LSH 和 Random ID 做了完整表格对照；
- 统一码本实验只能提供有限的扩展性证据；
- 自回归 beam search 带来的推理成本不能被忽略。

所以，如果后续真正实现 TIGER，我最想验证的不是能否复现某一张主结果表，而是下面这条因果链：

```text
内容相似
→ Semantic ID 共享
→ 参数和训练信号共享
→ 低频或新物品获得收益
→ 推荐效果改善
```

只有这条链条成立，Semantic ID 才不只是给物品换了一套更复杂的编号。

## 参考资料

- [Recommender Systems with Generative Retrieval，NeurIPS 2023](https://proceedings.neurips.cc/paper_files/paper/2023/hash/20dcab0f14046a5c6b02b61da9f13229-Abstract-Conference.html)
- [Autoregressive Image Generation Using Residual Quantization，CVPR 2022](https://openaccess.thecvf.com/content/CVPR2022/html/Lee_Autoregressive_Image_Generation_Using_Residual_Quantization_CVPR_2022_paper.html)
- [Sentence-T5: Scalable Sentence Encoders from Pre-trained Text-to-Text Models](https://aclanthology.org/2022.findings-acl.146/)
- [后续实验：TIGER 的语义 ID 为什么会坍缩](../tiger-semantic-id-codebook-capacity/)
