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

残差量化可以理解为一个逐层修正、[从粗到细](#讨论-从粗到细-究竟是什么意思)的过程。

第一层码本先选择一个最接近当前向量的 codeword。这个 codeword 无法完全重构原向量，于是计算它留下的残差。第二层码本继续近似这个残差，第三层再修正剩余部分。

TIGER 主实验采用 3 层残差码本，每层码本包含 256 个 codeword；因此 RQ-VAE 先为每个 item 生成三位 Semantic ID。

这里先把符号说清楚。TIGER 的 RQ-VAE 不是直接量化原始文本，而是先把 item 内容 embedding 记为 $x$，再用编码器 $E(\cdot)$ 得到潜在向量 $z=E(x)$。第 $d$ 层码本记为 $C_d$，里面有若干 codeword 向量；$c_d$ 是第 $d$ 层选中的 codeword 编号，$e_{c_d}$ 是对应的 codeword 向量。$r_d$ 表示进入第 $d$ 层量化器的残差，$m$ 表示残差量化层数。在主实验设定下，$m=3$，每层 $C_d$ 包含 256 个 codeword；如果多个 item 得到相同的三元 ID，论文会在后面的[碰撞处理](#碰撞发生后怎么办)阶段追加一个额外 token。这个 token 用来恢复 item 唯一性，不属于残差量化层本身，也不会参与 RQ-VAE 的重构或量化损失。

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

::disclosure[讨论：“从粗到细”究竟是什么意思？]
论文反复强调 RQ-VAE 能获得 coarse-to-fine 的 Semantic ID。这里需要先区分两件事：一种是模型重构过程里的“粗到细”，另一种是人能直接读懂的标签层次。

第一种是**重构意义上的粗到细**。第一层 codeword 先近似潜在向量里最主要、最容易解释的部分，后续层继续近似前一层没有解释掉的 residual。这个说法和 RQ-VAE 结构本身是一致的：量化时逐层做减法，重构时再把各层 codeword 加回来。

第三种是**人工标签意义上的层次**。也就是把三位 Semantic ID 进一步解释成：

```text
第一位 = 大类
第二位 = 子类
第三位 = 细粒度属性
```

这个结论不会由残差量化自动产生。逐层降低重构误差，只能说明后面的 codeword 在修正前面未解释的部分，不能直接推出每一位都对应人类标签体系里的一级分类。

论文在 [Item Representation](https://proceedings.neurips.cc/paper_files/paper/2023/file/20dcab0f14046a5c6b02b61da9f13229-Paper-Conference.pdf) 的 qualitative analysis 里做了一个层次性可视化实验：在 Amazon Beauty 上把三层码本大小设成 4、16、256，然后观察第一位 $c_1$ 和第二位 $c_2$ 对商品类别的划分效果。这个实验可以说明，在前两层容量被强约束时，共享前缀的 item 更容易呈现出可视化上的类目聚集。

但这不能直接支持一个更强的结论：主实验中每层都是 256 个 codeword 时，Semantic ID 仍然会自然形成同样清晰的“第一位大类、第二位子类、第三位细粒度属性”。原因很简单：4、16、256 这个设置会强迫大量 item 共享前两位前缀，视觉上更容易出现层次划分；而 256、256、256 的空间宽得多，前缀共享是否仍然稳定，需要额外统计，比如前缀纯度、类内距离、跨类别混淆和不同随机种子下的稳定性。

所以，更准确的判断是：RQ-VAE 确实提供了重构意义上的逐层残差修正，也可能带来有用的前缀相似性；但把它进一步解释成稳定、可控、类似人工标签树的语义层次，现有实验还不够充分。
::

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

::disclosure[讨论：理论容量为什么不等于有效容量？]

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
::

::disclosure[讨论：RQ-VAE 的对照实验到底证明了什么？]
这部分更适合理解为“论文做过哪些 ID 生成对照”，而不是“RQ-VAE 已经被证明优于所有量化方法”。[原文第 4.2 节](https://papers.neurips.cc/paper_files/paper/2023/file/20dcab0f14046a5c6b02b61da9f13229-Paper-Conference.pdf)真正放进同一张实验表的，是 Random ID、LSH Semantic ID 和 RQ-VAE Semantic ID。

如果只用表格列优缺点，很容易把这些方法都看成“把向量变成整数”。更重要的差别其实是三件事：这个 ID 有没有使用内容、划分边界怎么来、以及它最终更像“检索压缩码”还是“可生成的多 token 地址”。[图 2](#fig-tiger-quantizer-atlas)按这三个问题重新摆放这些方法。

::tiger-quantizers

原文在 LSH 对照里使用 `h = 8`、`m = 4`；Random ID 使用 `m = 4`、`K = 255`，目的是让组合空间与 RQ-VAE 的设置接近。为了不把表写得过重，下面只摘出 Recall；原表还同时报告了 NDCG。

| 方法 | Sports R@5 / R@10 | Beauty R@5 / R@10 | Toys R@5 / R@10 |
|---|---:|---:|---:|
| Random ID | 0.0070 / 0.0116 | 0.0296 / 0.0434 | 0.0362 / 0.0448 |
| LSH SID | 0.0215 / 0.0321 | 0.0379 / 0.0533 | 0.0412 / 0.0566 |
| RQ-VAE SID | 0.0264 / 0.0400 | 0.0454 / 0.0648 | 0.0521 / 0.0712 |

这组结果能支持的结论是：在 TIGER 的这套生成式推荐框架里，基于内容 embedding、并由 DNN/RQ-VAE 学出来的 Semantic ID，比随机 ID 和随机投影式 LSH ID 更有效。它不能直接推出“RQ-VAE 优于所有量化器”。

这里可以按[图 2](#fig-tiger-quantizer-atlas)里的三条判断标签再拆开理解：

- Random ID 是“容量对照”：它告诉我们，单纯给 item 一个多 token 编号并不够。如果编号不来自内容，相似物品之间没有共享结构，冷启动和低频泛化都很难指望它自然变好。
- LSH / SimHash 是“内容但不学习”的对照：它确实从 item embedding 出发，但用的是随机超平面。它保留了一部分局部相似性，却不会为了重构或推荐数据主动调整边界。
- Product Quantization 更像“分维度压缩”：每个 code 对应向量的一个子空间，不是前一层没解释完的残差。因此它适合做向量压缩和 [ANN](term:ann) 检索，但不直接对应 TIGER 想要的逐 token 语义生成。
- Hierarchical k-means 更像“走树路径”：第一层决定父簇，第二层只在父簇内部继续分。这个层次最容易画出来，但早期硬边界也最难被后续修正。
- VQ-VAE 是“单层学习码本”：它能用重构损失学习数据相关 code，但只给出一次离散选择。原文也提到试过 VQ-VAE，候选生成效果接近，但会失去 RQ-VAE 分层 ID 的性质。
- RQ-VAE 是“逐层修 residual”：它既使用内容 embedding，又用学习式码本，还天然输出多 token ID。这些 token 才能被后面的 Transformer 当成一个可生成的 Semantic ID 序列。

所以更严谨的表述应该是：RQ-VAE 在论文选择的对照组里更适合 TIGER，但“为什么更好”还没有被完全拆开。收益可能来自残差结构，也可能来自非线性编码器、训练目标，或者这些因素共同作用。
::

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

先把[索引](term:index)这个词说白一点：在检索系统里，它不一定是一张数据库表，也不一定是一份文件；它更像“查询进入系统后，如何快速指到候选结果地址”的那套机制。书的目录把主题指到页码，倒排索引把词指到文档，向量索引把 query embedding 指到 item ID。推荐里的问题也是类似的：给定用户历史，系统要尽快找出下一批候选物品。

传统检索与 TIGER 的差别，最好不要只理解为“少了一个 ANN 检索步骤”，而要理解为“候选地址由谁产生”发生了变化。传统路线把候选物品放在外部向量索引里；TIGER 则让 Transformer 直接生成候选物品的 Semantic ID。这个差别见[图 3](#fig-tiger-index-map)。

::tiger-index-map

论文把这种设计称为 **Transformer memory acts as an index**。这里的 memory 指 Transformer 的模型参数；index 指“从用户上下文得到候选物品地址”的能力。它不是说模型参数里真的有一张可以像数据库一样直接增删改查的表。

::disclosure[讨论：Transformer 参数为什么被说成索引？]
更直观地说，索引回答的是这个问题：**我有一个很大的候选集合，怎样不用逐个看，就能把查询带到可能相关的候选位置？**

传统 dual-encoder 路线里，这个答案很具体：candidate tower 预先生成所有 item embedding，外部 [ANN](term:ann) / [MIPS](term:mips) 索引保存或组织这些 embedding；user tower 把用户历史编码成 query embedding，然后去外部索引里搜索 Top-K。这里的索引是一个看得见、能单独更新和检查的数据结构。

TIGER 的答案变了。它先离线给 item 生成 Semantic ID，把 item 变成可生成的离散地址；随后用用户历史中的 Semantic ID 序列训练 encoder-decoder Transformer。推理时，模型不再输出 query embedding 去查外部索引，而是直接生成下一个地址：

$$
P(c_1,c_2,c_3,c_4 \mid \text{history}).
$$

decoder 每一步都在 Semantic ID 词表上给出 token 概率，[beam search](term:beam-search) 保留概率较高的前缀。前缀越长，候选地址越具体；生成完整 ID 后，再通过 Semantic ID → Item ID 映射表回到真实物品。

所以，把 Transformer 参数说成索引，是在“功能”上成立：它接收用户上下文，并给出候选 item 的地址。它在“工程结构”上又不像传统索引：你不能像更新向量库那样直接插入一行 item embedding，也不能直接遍历参数来检查某个 item 的邻居。
::

因此，TIGER 省掉的是服务阶段的外部 ANN/MIPS 向量检索索引，不是省掉所有外部结构。系统仍然需要维护 Semantic ID 与真实 Item ID 的映射，也可能需要合法前缀结构来过滤无效生成结果。新增 item 时，成本从“更新 item embedding 索引”转移到“生成 Semantic ID、维护映射，并让生成模型有机会生成到这个 ID”。这也是为什么“Transformer 参数像索引”不能被理解成“推荐系统不再需要任何索引相关数据结构”。

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

模型在第一个位置输出 token 概率，[beam search](term:beam-search) 保留累计 log-probability 最高的 $B$ 条前缀；下一步分别扩展这些前缀，再从全部扩展结果中保留最优的 $B$ 条。不断重复，直到生成完整 ID。

```text
保留 B 个高概率前缀
→ 扩展每条前缀
→ 再保留累计得分最高的 B 条
→ 得到多个完整 Semantic ID
```

[Beam search](term:beam-search) 的目标是近似寻找若干条高概率序列。它比 greedy decoding 覆盖更多候选，但默认仍然偏向模型概率最高的区域，本身不等于多样性采样。

### 生成无效 ID 怎么办

模型可以生成一个语法上完整、但数据库中不存在的 Semantic ID。论文没有通过约束解码从结构上消除这种情况，只是观察到 Top-10 的 invalid ID 比例约为 0.1%–1.6%；Top-20 时，不同数据集约为 0.3%–6%。

这只是实验现象，并不是理论保证。

论文建议扩大 [beam size](term:beam-search)，生成更多候选后过滤无效 ID，直到留下足够的有效结果；还提出未来可以用 prefix matching 将无效 ID 映射到共享有效前缀的物品。

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

这与 [beam search](term:beam-search) 并不是一回事：

- [Beam search](term:beam-search) 从概率分布中近似寻找得分最高的若干条序列；
- 温度采样先改变概率分布，再随机抽取 token；
- 二者可以组合，但论文没有清楚交代多样性实验是否采用了 [stochastic beam search](term:beam-search)。

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

但生成式检索没有消灭检索成本，只是重新分配了成本。ANN 能够并行搜索候选，而 TIGER 需要逐 token 自回归解码，并通过 [beam search](term:beam-search) 获取 Top-K。[beam](term:beam-search) 越大，找到足够多有效候选的机会越高，推理成本也越大。

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
- 自回归 [beam search](term:beam-search) 带来的推理成本不能被忽略。

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
