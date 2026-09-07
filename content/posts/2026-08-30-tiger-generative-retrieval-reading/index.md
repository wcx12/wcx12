---
title: "TIGER：从语义 ID 到生成式推荐"
slug: "tiger-generative-retrieval-reading"
date: "2026-08-30"
updated: "2026-09-07"
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

## TIGER 的主要模型架构

这一部分只回答一个问题：TIGER 到底怎样把“推荐下一个物品”变成“生成下一个 Semantic ID”。它可以拆成两段：先在物品侧训练一个 Semantic ID tokenizer，再在用户侧训练一个 encoder-decoder Transformer 去生成这些 token。

### RQ-VAE 如何生成 Semantic ID

[图 1](https://wcx12.github.io/wcx12/blog/posts/tiger-generative-retrieval-reading/#fig-tiger-semantic-id-flow) 上方的物品侧分支对应这里的核心操作。TIGER 首先把物品的标题、价格、品牌、类别等内容特征组成文本，通过 Sentence-T5 得到 768 维内容 embedding。随后，RQ-VAE 的编码器将它压缩到 32 维潜在空间，再进行三层残差量化。

残差量化可以理解为一个逐层修正、[从粗到细](#讨论-从粗到细-究竟是什么意思)的过程。

第一层码本先选择一个最接近当前向量的 codeword。这个 codeword 无法完全重构原向量，于是计算它留下的残差。第二层码本继续近似这个残差，第三层再修正剩余部分。

TIGER 主实验采用 3 层残差码本，每层码本包含 256 个 codeword；因此 RQ-VAE 先为每个 item 生成三位 Semantic ID。

从训练阶段看，这不是一个独立的最近邻量化器，而是一个 autoencoder 闭环：内容 embedding $x$ 进入 DNN encoder 得到 32 维潜在向量 $z$；三层 residual quantizer 把 $z$ 量化为 $\hat z$；DNN decoder 再从 $\hat z$ 重构出 $\hat x$，并用重构损失和量化损失联合训练 encoder、decoder 与码本。[图 2](#fig-tiger-rqvae-training)展示了编码、残差量化和解码重构的训练路径。

::tiger-rqvae-training

记物品内容 embedding 为 $x$，编码器 $E(\cdot)$ 将它映射为潜在向量 $z=E(x)$。RQ-VAE 量化的是这个潜在向量。第 $d$ 层码本记为 $C_d$，里面有若干 codeword 向量；$c_d$ 是第 $d$ 层选中的 codeword 编号，$e_{c_d}$ 是对应的 codeword 向量。$r_d$ 表示进入第 $d$ 层量化器的残差，$m$ 表示残差量化层数。在主实验设定下，$m=3$，每层 $C_d$ 包含 256 个 codeword；如果多个 item 得到相同的三元 ID，论文会在后面的[碰撞处理](#碰撞发生后怎么办)阶段追加一个额外 token。这个 token 用来恢复 item 唯一性，不属于残差量化层本身，也不会参与 RQ-VAE 的重构或量化损失。

在第 $d$ 层，量化器做的最近邻选择可以写成：

$$
c_d=\arg\min_k \lVert r_d-e_k^{(d)}\rVert_2^2.
$$

下文将第 $d$ 层选中的码向量 $e_{c_d}^{(d)}$ 简记为 $e_{c_d}$。

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

第二种是**人工标签意义上的层次**。也就是把三位 Semantic ID 进一步解释成：

```text
第一位 = 大类
第二位 = 子类
第三位 = 细粒度属性
```

这个结论不会由残差量化自动产生。逐层降低重构误差，只能说明后面的 codeword 在修正前面未解释的部分，不能直接推出每一位都对应人类标签体系里的一级分类。

论文在 [Item Representation](https://proceedings.neurips.cc/paper_files/paper/2023/file/20dcab0f14046a5c6b02b61da9f13229-Paper-Conference.pdf) 的 qualitative analysis 里做了一个层次性可视化实验：在 Amazon Beauty 上把三层码本大小设成 4、16、256，然后观察第一位 $c_1$ 和第二位 $c_2$ 对商品类别的划分效果。这个实验可以说明，在前两层容量被强约束时，共享前缀的 item 更容易呈现出可视化上的类目聚集。

但这不能直接支持一个更强的结论：主实验中每层都是 256 个 codeword 时，Semantic ID 仍然会自然形成同样清晰的“第一位大类、第二位子类、第三位细粒度属性”。原因很简单：4、16、256 这个设置会强迫大量 item 共享前两位前缀，视觉上更容易出现层次划分；而 256、256、256 的空间宽得多，前缀共享是否仍然稳定，需要额外统计，比如前缀纯度、类内距离、跨类别混淆和不同随机种子下的稳定性。

RQ-VAE 提供了重构意义上的逐层残差修正，也可能带来有用的前缀相似性；但把它进一步解释成稳定、可控、类似人工标签树的语义层次，现有实验还不够充分。
::

### RQ-VAE 的损失函数

从训练目标看，RQ-VAE 仍然先是一个 autoencoder。编码器把内容 embedding $x$ 压成 $z$，残差量化得到 $\hat z$，解码器再从 $\hat z$ 重构出 $\hat x$。因此最基本的信号是重构损失：

$$
L_{\text{recon}}=\lVert x-\hat x\rVert^2.
$$

重构损失要求离散表示保留足够多的物品内容，让 decoder 能还原输入 embedding，这是自编码器的基本训练目标。RQ-VAE 沿用 VQ-VAE 的离散潜变量建模思路；[VQ-VAE 原论文第 3.2 节](https://arxiv.org/html/1711.00937v2#S3.SS2)给出了它的变分解释：在确定性的量化后验和均匀先验下，KL 项为常量，不参与参数优化。TIGER 实际优化的是重构项与量化项之和：

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

两项都度量 residual 与所选 codeword 的距离，但梯度方向不同：第一项把 residual 当作目标来更新码字，第二项把码字当作目标来约束 residual。stop-gradient 决定每一项中哪一侧接收梯度，$\beta$ 则控制第二项的强度。

::disclosure[补充：为什么这个损失函数要拆成两项？]
先固定当前的选码结果，把本层 residual $r_d$ 与所选码向量 $e_{c_d}$ 视为两个输入，观察每一项对它们的偏导。第一项是：

$$
L_{code}=\lVert \operatorname{sg}[r_d]-e_{c_d}\rVert^2,
$$

$\operatorname{sg}[r_d]$ 将当前 residual 视为常量。这一项的梯度只流向本层所选码向量 $e_{c_d}$：

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

$\operatorname{sg}[e_{c_d}]$ 将本层所选码向量视为常量。这一项不沿该码向量分支传播梯度，而是把梯度传给 $r_d$：

$$
\frac{\partial L_{commit}}{\partial r_d}
=2\beta(r_d-e_{c_d}),
\qquad
\frac{\partial L_{commit}}{\partial e_{c_d}}=0.
$$

这就是 commitment：要求送入量化器的表示靠近所选码字，减少编码表示与离散表示之间的偏差。梯度沿 $r_d$ 的计算路径回传，从而约束产生该表示的编码器；$\beta$ 控制这种约束的强度。

多层残差量化还需要区分本层偏导与整个计算图的梯度。由于 $r_d=z-\sum_{j<d}e_{c_j}$，如果前面各层的码向量没有被截断梯度，commitment 还可能沿残差路径影响它们；若这些码向量被 detach，梯度则沿剩余路径回到编码器。直通估计（straight-through estimator）也会改变量化节点的反向路径。例如，[图像 RQ-VAE 的公开实现](https://github.com/kakaobrain/rq-vae-transformer/blob/main/rqvae/models/rqvae/quantizations.py#L248-L268)在 commitment 中对量化表示使用 detach，并单独构造直通路径。TIGER 原文给出了损失形式，但没有展开这些反向传播的实现细节。

因此，拆分损失的作用是分别控制“码字靠近 residual”和“residual 靠近码字”两种更新。上面的偏导描述本层两个输入的梯度方向；最终哪些参数收到梯度，还要沿完整的计算图判断。
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

论文每层使用 256 个 codeword，RQ-VAE 共三层，并要求训练后的 codebook usage 达到 80% 以上。码本利用率描述单层 code 的活跃程度，不等于多层 ID 组合的覆盖率。

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

### 当交互历史变成 token 序列，推荐才真正成为生成

得到 Semantic ID 后，重点就从“物品怎么编号”转到“生成器到底看见什么”。TIGER 的生成器不是直接读 item 文本，也不是读原始 Item ID；在论文实现里，输入序列由一个 **user token** 开头，后面接用户历史中每个 item 的 Semantic ID tokens。这对应[图 1](#fig-tiger-semantic-id-flow)右侧的用户侧分支，也就是把“用户做过什么”翻译成生成模型可以处理的离散语言。

如果一个用户依次交互了 Item A、Item B、Item C，而每个 item 的 Semantic ID 有四位，那么进入 encoder 的不是三个物品节点，而是一串 token：

```text
Item A -> Item B -> Item C

Encoder 输入：

[user_5]  a1 a2 a3 a4  b1 b2 b3 b4  c1 c2 c3 c4

Decoder 输入（训练时提供正确答案的前缀）：

<BOS>  d1  d2  d3  d4

对应位置的预测标签：

 d1    d2  d3  d4  <EOS>
```

其中 `a* / b* / c*` 分别属于三个历史物品，`d1…d4` 属于真实的下一个物品 D。每组的前三位来自 RQ-VAE，第四位是碰撞处理时追加的编号。分组只是为了方便人阅读，encoder 实际接收的是加上 user token 后的一整串 token。`<BOS>` 和 `<EOS>` 用于示意序列的开始与结束；训练时，decoder 输入相对预测标签右移一位。

[图 3](#fig-tiger-generator-input)从一个训练样本展开这条路径。历史 token 先通过 embedding 层，再经过 4 层 encoder，得到历史各位置的上下文表示 $H$。decoder 同时需要两类信息：一类是目标物品已经给出的 token 前缀；另一类是通过 cross-attention 读取的历史 $H$。它的 masked self-attention 只能读取当前位置及之前的输入，不能提前看到待预测的 token。图中展示一层的内部运算，并用“×4”表示堆叠；每个位置都经过完整的 4 层，层数与一个物品的 token 数不是一回事。

::tiger-generator-input

训练时，这种提供正确前缀的方式叫作 **teacher forcing**。例如，第一个位置读入 `<BOS>` 来预测 `d1`；第二个位置读入正确的 `d1` 来预测 `d2`。由于正确前缀已经给定，配合因果遮罩，可以在一次前向计算中并行计算各位置的预测，而不必等待模型先生成 `d1` 再训练 `d2`。

decoder 的输出经过词表投影和 softmax，得到每个位置的 token 概率分布。训练用真实 token 作为标签计算交叉熵，要求正确 token 的概率提高；这个损失反向更新生成器的 token embedding、encoder、decoder 和输出投影等参数。前一阶段的 RQ-VAE 已经训练完成，生成器训练使用它产生的离散 ID，不通过这些 ID 将梯度传回 RQ-VAE。

因此，这一阶段学习的是以用户信息和历史为条件的下一个物品 ID 概率：

$$
P(d_1,d_2,d_3,d_4 \mid \text{user token}, \text{history Semantic ID tokens}).
$$

推理时，decoder 第一步预测 `d1`，第二步在 `d1` 的基础上预测 `d2`，一直到生成完整 Semantic ID。生成结束后，系统再用 Semantic ID -> Item ID 的映射表，把这个语义地址还原成真实物品。换句话说，TIGER 的“生成”不是生成自然语言句子，而是生成一个可以映射回物品库的离散地址。

这里与训练的关键区别是：推理时没有真实答案前缀，必须把模型已经生成的 token 接回 decoder，逐步继续预测。[图 4](#fig-tiger-inference-loop)接着展示从生成概率到候选物品的推理过程。

::disclosure[补充：生成器的具体配置]
[论文第 4 节](https://proceedings.neurips.cc/paper_files/paper/2023/file/20dcab0f14046a5c6b02b61da9f13229-Paper-Conference.pdf)报告 encoder 和 decoder 各 4 层，每层 self-attention 有 6 个 head、每个 head 的维度为 64；输入表示维度为 128，MLP 维度为 1024，使用 ReLU 和 0.1 的 dropout。输入维度与各 head 投影后的维度是不同配置，不能把“6 × 64”直接当作输入 embedding 的维度。

模型约有 1300 万参数，batch size 为 256。Beauty 和 Sports and Outdoors 训练 200k 步，Toys and Games 训练 100k 步。前 10k 步的学习率为 0.01，之后按步数的平方根倒数衰减。
::

::disclosure[补充：用户 token 为什么可能有效？]
原文的做法是：除了 1024 个 semantic codeword token（$256\times4$）之外，再额外向 seq2seq 词表加入 2000 个 user-specific token。为了限制词表规模，论文没有给每个原始用户都建一个唯一 token，而是用 Hashing Trick 把 raw user ID 映射到这 2000 个 user ID token 中的一个。也就是说，映射是确定性的；同一个 raw user ID 会落到同一个 bucket，但不同用户可能因为哈希碰撞共用同一个 user token。

放到生成器输入里看，这个 token 相当于在历史序列最前面加了一个粗粒度用户条件：

```text
raw user ID --hashing trick--> user bucket token

[user_137]  history semantic tokens  ->  next item semantic tokens
```

这件事“可能合理”的地方在于：TIGER 的历史窗口最多只包含近期交互，user token 可以提供一个稳定的长期偏置；而且哈希到 2000 个 bucket 后，用户之间会共享参数，某种程度上也像正则化。

| 设置 | Recall@5 | NDCG@5 | Recall@10 | NDCG@10 |
|---|---:|---:|---:|---:|
| 无用户信息 | 0.04458 | 0.0302 | 0.06479 | 0.0367 |
| 加用户 token | 0.0454 | 0.0321 | 0.0648 | 0.0384 |

但我觉得它的解释力度仍然有限。Recall@10 几乎不变，Recall@5 小幅提高，NDCG 的提升更明显；这更像是候选排序位置被略微推前，而不是召回能力全面上升。论文只报告了“加 user ID 有帮助”，没有进一步拆出提升来自哪里。

要判断这个设计是不是真的在学“用户个性”，至少还需要几组对照：不同 bucket 数量、不同哈希种子、唯一 user embedding、随机 user token、以及不加 user token 但增加等量参数的模型。否则，现有结果只能谨慎地说：这个 user bucket token 在实验里改善了部分指标，但它具体是在提供长期用户偏置、群体偏置、参数共享，还是只是带来额外容量，论文没有完全解释清楚。
::

### 推理闭环：从 token 概率到候选物品

到这里，主架构已经闭合：物品先被翻译成 Semantic ID，用户历史再被翻译成输入 token 序列，decoder 最后输出下一个 Semantic ID 的概率分布。服务阶段要做的，是把这些概率分布变成真正能展示给用户的 Top-K 物品。

::tiger-inference-loop

完整的推理路径是：decoder 逐位给出 token 概率，搜索过程保留若干高分前缀，生成完整 Semantic ID 后再查表得到真实物品。模型架构确定了这条路径，接下来需要用实验判断它是否带来更好的推荐结果。

## 实验：从整体效果到能力边界

实验部分围绕六个问题展开：推荐效果是否提升，ID 的构造方式是否重要，结果对模型配置是否敏感，能否处理冷启动，能否调节多样性，以及扩大物品语料后是否仍然稳定。每一组结果都需要结合它实际控制的变量来解读。

### 主实验：TIGER 到底有没有赢？

主实验比较的是“根据已有交互，推荐用户实际交互的下一个物品”。按[原文附录 C](https://proceedings.neurips.cc/paper_files/paper/2023/file/20dcab0f14046a5c6b02b61da9f13229-Paper-Conference.pdf#page=15)，每个用户的序列按时间排列，最后一个物品用于测试，倒数第二个用于验证，其余用于训练。因此，每个测试用户只有一个真实目标物品。

**非生成式与生成式：得到列表的方式不同，评价列表的方式相同。**

- **非生成式方法先给物品打分，再排序。** 以 SASRec / S3-Rec 的实现为例，历史序列得到用户表示 $h_u$，与物品向量 $v_i$ 做内积得到分数 $s(u,i)=h_u^\top v_i$，按分数取 Top-K。这里评价的是目标物品在推荐列表中的位置，而不是向量重构误差。
- **TIGER 先生成 ID 序列，再映射到物品。** decoder 根据用户历史逐位预测 Semantic ID，[beam search](term:beam-search)按序列得分保留候选，完整 ID 再查表对应到真实物品。评价时比较的是完整物品 ID；只猜中前三位语义前缀、但第四位对应另一个物品，不算主实验中的命中。token 准确率也不是这里的 Recall 或 NDCG。
- **P5 同样属于生成式方法。** 它生成的是普通物品 ID 的 token 序列，而不是 TIGER 的内容语义码。表中的 P5 是 TIGER 作者按附录 D 修改物品编号预处理后得到的结果，并非直接照搬 P5 原论文的分数。

对于同一个测试用户，假设真实目标出现在推荐列表第 3 位：两类方法的 Recall@5 都记为 1，NDCG@5 都记为 $1/\log_2(3+1)=0.5$；若目标没有进入前 5 位，两项都记为 0。最终对测试用户取平均。**Recall 衡量有没有找回来，NDCG 还奖励排得更靠前；它们不关心列表是打分排序得到的，还是生成得到的。**

::disclosure[补充：评价公式与候选范围]

设测试用户集合为 $\mathcal U$，$r_u$ 是用户 $u$ 的真实目标在预测列表中的名次，从 1 开始计数；未检索到时视为不在 Top-K。由于每个用户只有一个测试目标，指标可写为：

$$
\operatorname{Recall@K}
=\frac{1}{|\mathcal U|}\sum_{u\in\mathcal U}\mathbf{1}[r_u\le K],
$$

$$
\operatorname{NDCG@K}
=\frac{1}{|\mathcal U|}\sum_{\substack{u\in\mathcal U\\r_u\le K}}
\frac{1}{\log_2(r_u+1)}.
$$

这里 $\mathbf{1}[\cdot]$ 为条件成立时取 1、否则取 0 的指示函数。一个正确物品的理想排名是第 1 位，理想 DCG 为 1，所以 NDCG 的归一化分母在这个单目标设置下也是 1。此时 Recall@K 与 Hit Rate@K 数值相同。

**候选范围会影响分数，不能只看指标名称。** 在“真实目标 + 99 个采样负例”中排进前 5，与在整个物品库中排进前 5，难度不同。TIGER 第 4.1 节说明，除 P5 外的基线结果来自 [S3-Rec 的公开结果库](https://github.com/aHuiWang/CIKM2020-S3Rec#results)；该仓库同时列出采样评测与全量评测，Table 1 使用的数值对应其中的全量排序结果。

全量排序的实现也可以直接核查：[运行入口](https://github.com/aHuiWang/CIKM2020-S3Rec/blob/master/run_finetune_full.py#L117-L121)启用 full-sort，[评分代码](https://github.com/aHuiWang/CIKM2020-S3Rec/blob/master/trainers.py#L231-L261)对整张物品 embedding 表做矩阵乘法，把历史已交互项的分数置零，再选取并排序高分物品；[指标代码](https://github.com/aHuiWang/CIKM2020-S3Rec/blob/master/utils.py#L277-L285)将预测物品与测试目标比较。这里执行的是全量向量打分，不是调用近似 ANN 索引。训练中的负采样也不意味着测试时采用采样排序。

TIGER 则直接在 ID 序列空间中搜索候选，不需要先对全库物品逐一打分。两条路径都产生用于评价的物品列表，但“指标相同”不等于“搜索算法完全相同”：beam search 是近似序列搜索，可能漏掉高分 ID，也可能生成无效 ID。

此外，[原文第 4.5 节](https://proceedings.neurips.cc/paper_files/paper/2023/file/20dcab0f14046a5c6b02b61da9f13229-Paper-Conference.pdf#page=10)提出扩大 beam 后过滤无效 ID，但没有完整交代主表评测的 beam 宽度、无效候选是否补足，以及是否使用与基线完全一致的历史物品过滤。因而这里能确认的是指标定义和两类候选生成路径，不能据此断言所有评测后处理细节都已严格对齐。
::

**表 1. TIGER 与八种序列推荐基线在三个 Amazon 数据集上的主实验结果。** 数据完整转录自 [TIGER 原文 Table 1，第 4.1 节](https://proceedings.neurips.cc/paper_files/paper/2023/file/20dcab0f14046a5c6b02b61da9f13229-Paper-Conference.pdf#page=7)，按数据集分为 a–c 三块，保留全部方法、指标与相对提升行；这些是论文报告值，不是本文复现实验。四项指标均越大越好，粗体为各列最佳结果。“相对提升”沿用原表，参照的是每个指标下最强的非 TIGER 方法，而非固定同一个基线。

**表 1a · Sports and Outdoors**

| 方法 | Recall@5 | NDCG@5 | Recall@10 | NDCG@10 |
|---|---:|---:|---:|---:|
| P5 | 0.0061 | 0.0041 | 0.0095 | 0.0052 |
| Caser | 0.0116 | 0.0072 | 0.0194 | 0.0097 |
| HGN | 0.0189 | 0.0120 | 0.0313 | 0.0159 |
| GRU4Rec | 0.0129 | 0.0086 | 0.0204 | 0.0110 |
| BERT4Rec | 0.0115 | 0.0075 | 0.0191 | 0.0099 |
| FDSA | 0.0182 | 0.0122 | 0.0288 | 0.0156 |
| SASRec | 0.0233 | 0.0154 | 0.0350 | 0.0192 |
| S3-Rec | 0.0251 | 0.0161 | 0.0385 | 0.0204 |
| **TIGER** | **0.0264** | **0.0181** | **0.0400** | **0.0225** |
| 相对提升 | +5.22% | +12.55% | +3.90% | +10.29% |

**表 1b · Beauty**

| 方法 | Recall@5 | NDCG@5 | Recall@10 | NDCG@10 |
|---|---:|---:|---:|---:|
| P5 | 0.0163 | 0.0107 | 0.0254 | 0.0136 |
| Caser | 0.0205 | 0.0131 | 0.0347 | 0.0176 |
| HGN | 0.0325 | 0.0206 | 0.0512 | 0.0266 |
| GRU4Rec | 0.0164 | 0.0099 | 0.0283 | 0.0137 |
| BERT4Rec | 0.0203 | 0.0124 | 0.0347 | 0.0170 |
| FDSA | 0.0267 | 0.0163 | 0.0407 | 0.0208 |
| SASRec | 0.0387 | 0.0249 | 0.0605 | 0.0318 |
| S3-Rec | 0.0387 | 0.0244 | 0.0647 | 0.0327 |
| **TIGER** | **0.0454** | **0.0321** | **0.0648** | **0.0384** |
| 相对提升 | +17.31% | +29.04% | +0.15% | +17.43% |

**表 1c · Toys and Games**

| 方法 | Recall@5 | NDCG@5 | Recall@10 | NDCG@10 |
|---|---:|---:|---:|---:|
| P5 | 0.0070 | 0.0050 | 0.0121 | 0.0066 |
| Caser | 0.0166 | 0.0107 | 0.0270 | 0.0141 |
| HGN | 0.0321 | 0.0221 | 0.0497 | 0.0277 |
| GRU4Rec | 0.0097 | 0.0059 | 0.0176 | 0.0084 |
| BERT4Rec | 0.0116 | 0.0071 | 0.0203 | 0.0099 |
| FDSA | 0.0228 | 0.0140 | 0.0381 | 0.0189 |
| SASRec | 0.0463 | 0.0306 | 0.0675 | 0.0374 |
| S3-Rec | 0.0443 | 0.0294 | 0.0700 | 0.0376 |
| **TIGER** | **0.0521** | **0.0371** | **0.0712** | **0.0432** |
| 相对提升 | +12.53% | +21.24% | +1.71% | +14.97% |

相对提升按 $(\text{TIGER}-\text{最强基线})/\text{最强基线}$ 计算。原表指标保留四位小数，因此直接用显示值重算，个别提升比例会与原文有轻微差异；这里没有用重算值覆盖原表。

从完整结果看，可以读出三点：

1. **TIGER 在三个数据集的 12 项指标上都取得了表中最高值。** Sports 的主要参照是 S3-Rec；Beauty 与 Toys 的最强基线则随指标在 SASRec 和 S3-Rec 之间变化，不能把所有提升都归给同一个对手。
2. **优势更明显地体现在前排质量，而不是所有截断位置都大幅增加召回。** Beauty 的 NDCG@5 为 0.0321，相比 SASRec 的 0.0249，原表报告提升 29.04%；但 Recall@10 仅从 S3-Rec 的 0.0647 到 0.0648，提升 0.15%。Toys 也有类似现象：NDCG@5 提升 21.24%，Recall@10 只提升 1.71%。这与前排推荐质量改善相符，但汇总指标本身不能证明是同一批物品被重新排序。
3. **主表比较的是整套系统，不能单独归因于“生成式”或某一种量化器。** P5 也是生成式方法，却没有获得同样的结果。内容表示、ID 结构、训练与解码共同变化；接下来的 ID 对照更适合检验 Semantic ID 的作用。Table 1 也不是多次运行均值表，论文将 TIGER 三次运行的均值与标准误另列在附录 Table 9，尤其不能把 0.0001 这样的显示值差距直接当作显著优势。

### 表示实验：为什么不是随机 ID 或 LSH？

在同一个生成式推荐框架中，物品 ID 的构造方式会怎样影响推荐结果？[原文第 4.2 节、Table 2](https://papers.neurips.cc/paper_files/paper/2023/file/20dcab0f14046a5c6b02b61da9f13229-Paper-Conference.pdf#page=8)比较了 Random ID、LSH Semantic ID 和 RQ-VAE Semantic ID。

不同 ID 构造方式的差别主要在于三件事：这个 ID 有没有使用内容、划分边界怎么来、以及它最终更像“检索压缩码”还是“可生成的多 token 地址”。[图 5](#fig-tiger-quantizer-atlas)展示了六种 ID 构造思路，从随机赋码到学习式量化，对比它们如何组织物品表示。

::tiger-quantizers

原文在 LSH 对照里使用 `h = 8`、`m = 4`；Random ID 使用 `m = 4`、`K = 255`，目的是让组合空间与 RQ-VAE 的设置接近。下表摘录 Recall；原表还报告了 NDCG。

| 方法 | Sports R@5 / R@10 | Beauty R@5 / R@10 | Toys R@5 / R@10 |
|---|---:|---:|---:|
| Random ID | 0.0070 / 0.0116 | 0.0296 / 0.0434 | 0.0362 / 0.0448 |
| LSH SID | 0.0215 / 0.0321 | 0.0379 / 0.0533 | 0.0412 / 0.0566 |
| RQ-VAE SID | 0.0264 / 0.0400 | 0.0454 / 0.0648 | 0.0521 / 0.0712 |

这组结果能支持的结论是：在 TIGER 的这套生成式推荐框架里，基于内容 embedding、并由 DNN/RQ-VAE 学出来的 Semantic ID，比随机 ID 和随机投影式 LSH ID 更有效。它不能直接推出“RQ-VAE 优于所有量化器”。

这些方法处理物品表示的方式各不相同：

- Random ID 是“容量对照”：它告诉我们，单纯给 item 一个多 token 编号并不够。如果编号不来自内容，相似物品之间没有共享结构，冷启动和低频泛化都很难指望它自然变好。
- LSH / SimHash 是“内容但不学习”的对照：它确实从 item embedding 出发，但用的是随机超平面。它保留了一部分局部相似性，却不会为了重构或推荐数据主动调整边界。
- Product Quantization 更像“分维度压缩”：每个 code 对应向量的一个子空间，不是前一层没解释完的残差。因此它适合做向量压缩和 [ANN](term:ann) 检索，但不直接对应 TIGER 想要的逐 token 语义生成。
- Hierarchical k-means 更像“走树路径”：第一层决定父簇，第二层只在父簇内部继续分。这个层次最容易画出来，但早期硬边界也最难被后续修正。
- VQ-VAE 对每个潜在位置的向量进行最近邻量化，并用重构目标学习编码器与码本。[VQ-VAE 原论文](https://arxiv.org/html/1711.00937v2#S3.SS2)使用多个离散潜在位置，因此同样可以输出多个 token；图中画的是一个位置的量化过程。它与 RQ-VAE 的区别在于，后者对同一个向量逐层量化剩余残差。TIGER 原文提到 VQ-VAE 的候选生成效果接近 RQ-VAE，但未提供这组比较的具体数值。
- RQ-VAE 是“逐层修 residual”：它既使用内容 embedding，又用学习式码本，将各层选出的码字编号组成多 token ID。后面的 Transformer 把这个 ID 作为序列生成目标。

这组对照表明，RQ-VAE 的推荐指标高于 Random ID 和 LSH；但实验尚未分离残差结构、非线性编码器与训练目标各自的贡献。

### 生成模型层数是否敏感

ID 对照之后，还需要看结果是否依赖某个特定的生成器配置。前文采用 encoder 和 decoder 各 4 层的设置；论文还比较了 3、4、5 层 Transformer：

| 层数 | Recall@5 | NDCG@5 | Recall@10 | NDCG@10 |
|---:|---:|---:|---:|---:|
| 3 | 0.04499 | 0.03062 | 0.06699 | 0.03768 |
| 4 | 0.04540 | 0.03210 | 0.06480 | 0.03840 |
| 5 | 0.04633 | 0.03206 | 0.06596 | 0.03834 |

这个结果不能简单概括成“层数越多越好”：5 层的 Recall@5 最高，3 层的 Recall@10 反而最高，4 层在 NDCG 上略好。更稳妥的判断是，模型在 3–5 层之间不太敏感，4 层是一种折中配置，而不是被实验明确证明的最优层数。

::disclosure[补充：六层码本配置能说明什么？]

这里的“六层”指残差量化码本的层数，与上面的 Transformer 深度是两个不同变量。论文还提到尝试过六层码本、每层 64 个 codeword，并称推荐指标对这种变化比较稳健，但没有提供具体结果。

它也不是严格的等容量比较：

$$
256^3=2^{24},\qquad 64^6=2^{36}.
$$

六层配置的理论组合空间更大，同时每个物品需要更多 token，输入长度和自回归解码成本也会增加。后续如果重新实验，需要分别控制理论容量、序列长度和计算量，而不能只比较最终推荐指标。
::

### 冷启动：TIGER 的能力，还是内容模型的能力

主结果和配置对照之外，论文还检验了两个额外能力：推荐新物品，以及调节推荐多样性。冷启动实验首先考察没有训练交互的新物品能否进入候选。在 Beauty 数据集上，它从测试 item 中选择 5%，删除这些 item 在训练 split 中的交互，把它们当作 unseen items。

训练完成后，冻结的 RQ-VAE 仍然可以根据内容为 unseen item 生成前三个语义 token。模型预测一个四位 Semantic ID 时：

1. 使用完整 ID 匹配 seen item；
2. 将前三位语义 token 相同的 unseen items 加入候选；
3. 用参数 $\epsilon$ 限制最终 Top-K 中 unseen items 的最大比例。

这个设置是合理的 item cold-start 模拟：它阻断物品的行为交互，但保留新物品在现实中通常能够获得的文本内容。

问题在于，这种能力并不是生成式推荐天然独有。只要一种推荐方法能够使用文本、图像或其他模态为新物品计算表示，它原则上也拥有内容冷启动通路。

这项实验展示了 TIGER 如何接入 unseen item：新物品不必拥有训练过的原子 Item ID embedding，只要其内容能映射到已有语义 token 组成的前缀，就有机会通过前缀匹配进入候选。这里得到支持的是一条具体的冷启动路径，而不是生成式推荐独有的能力。

实验还有一些没有交代清楚的地方：多个 unseen item 共享前三位前缀时如何排序，$\epsilon K$ 的 unseen 配额如何与 seen 候选合并，以及新物品的第四位碰撞 token 如何处理。论文主要与 Semantic_KNN 比较，也没有覆盖所有内容增强的 sequential recommender。

所以，这项实验支持的是“TIGER 在这套 protocol 下优于 Semantic_KNN”，而不是“传统方法不能处理冷启动”。

### 多样性：温度提高了熵，但这是谁的贡献

冷启动考察候选能否覆盖新物品，多样性实验则考察候选的类别分布能否被解码策略调节。论文通过 temperature-based decoding 增加推荐多样性。若模型输出 logits $z_i$，温度 $T$ 后的分布为：

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

### 数据集融合实验验证了什么

最后一组实验考察：扩大训练码本使用的物品语料后，原推荐任务的表示质量是否仍然稳定。论文把 Beauty、Sports 和 Toys 的全部物品合并起来生成统一 Semantic ID，然后只在 Beauty 推荐任务上使用这些 ID，并与只使用 Beauty 物品训练的码本比较。

| Semantic ID 来源 | Recall@5 | NDCG@5 | Recall@10 | NDCG@10 |
|---|---:|---:|---:|---:|
| 三个数据集合并 | 0.04355 | 约 0.03047 | 0.06314 | 0.03676 |
| 仅 Beauty | 0.0454 | 0.0321 | 0.0648 | 0.0384 |

原表将 combined 的 NDCG@5 印成 0.3047，按其他指标的量级，应当是漏写了一个 0。

合并数据后，Beauty 指标下降约 2.6%–5.1%。这可以说明固定容量码本面对三个相近 Amazon 类别的物品时，表示质量只出现小幅退化。

但这不是完整的 scalability 证明。实验没有测量更大数量级的物品、训练时间、推理延迟、持续新增物品、跨域用户迁移或码本重训后的 ID 稳定性。与其称为“扩展性实验”，更适合把它理解为“统一码本在小规模语料扩张下的稳健性测试”。

## 生成与解码诊断

上述实验衡量了推荐效果、表示选择和部分能力，但线上系统还必须将 token 概率转成有效的候选物品。接下来沿着[图 4](#fig-tiger-inference-loop)的推理路径，讨论候选搜索、无效 ID 和部署代价。

### Beam search 在这里做了什么

模型在第一个位置输出 token 概率，[beam search](term:beam-search) 保留累计 log-probability 最高的 $B$ 条前缀；下一步分别扩展这些前缀，再从全部扩展结果中保留最优的 $B$ 条。不断重复，直到生成完整 ID。

```text
保留 B 个高概率前缀
→ 扩展每条前缀
→ 再保留累计得分最高的 B 条
→ 得到多个完整 Semantic ID
```

[Beam search](term:beam-search) 的目标是近似寻找若干条高概率序列。它比 greedy decoding 覆盖更多候选，但默认仍然偏向模型概率最高的区域，本身不等于多样性采样。

::disclosure[讨论：Transformer 参数为什么被说成索引？]
检索需要把查询对应到候选结果。[索引](term:index)为这一步提供组织信息的结构：书的目录把主题指到页码，倒排索引把词指到文档，向量索引则组织物品向量，帮助查询找到相近的物品。

TIGER 让 Transformer 根据用户上下文直接生成候选 Semantic ID。论文用 **Transformer memory acts as an index** 描述这种功能替代：这里的 memory 指模型参数，参数中学到的检索关系帮助模型生成候选地址。它与传统索引承担相近的检索功能，但不是一张可以直接增删改查的数据库表。

传统 dual-encoder 路线里，这个答案很具体：candidate tower 预先生成所有 item embedding，外部 [ANN](term:ann) / [MIPS](term:mips) 索引保存或组织这些 embedding；user tower 把用户历史编码成 query embedding，然后去外部索引里搜索 Top-K。这里的索引是一个看得见、能单独更新和检查的数据结构。

TIGER 的答案变了。它先离线给 item 生成 Semantic ID，把 item 变成可生成的离散地址；随后用用户历史中的 Semantic ID 序列训练 encoder-decoder Transformer。推理时，模型不再输出 query embedding 去查外部索引，而是直接生成下一个地址。传统检索与 TIGER 的差别，最好不要只理解为“少了一个 ANN 检索步骤”，而要理解为“候选地址由谁产生”发生了变化。传统路线把候选物品放在外部向量索引里；TIGER 则让 Transformer 直接生成候选物品的 Semantic ID。这个差别见[图 6](#fig-tiger-index-map)。

::tiger-index-map

所以，把 Transformer 参数说成索引，是在“功能”上成立：它接收用户上下文，并给出候选 item 的地址。它在“工程结构”上又不像传统索引：你不能像更新向量库那样直接插入一行 item embedding，也不能直接遍历参数来检查某个 item 的邻居。

因此，TIGER 省掉的是服务阶段的外部 ANN/MIPS 向量检索索引，不是省掉所有外部结构。系统仍然需要维护 Semantic ID 与真实 Item ID 的映射，也可能需要合法前缀结构来过滤无效生成结果。新增 item 时，成本从“更新 item embedding 索引”转移到“生成 Semantic ID、维护映射，并让生成模型有机会生成到这个 ID”。这也是为什么“Transformer 参数像索引”不能被理解成“推荐系统不再需要任何索引相关数据结构”。
::

### 生成无效 ID 怎么办

模型可以生成一个语法上完整、但数据库中不存在的 Semantic ID。论文没有通过约束解码从结构上消除这种情况，只是观察到 Top-10 的 invalid ID 比例约为 0.1%–1.6%；Top-20 时，不同数据集约为 0.3%–6%。

这只是实验现象，并不是理论保证。

论文建议扩大 [beam size](term:beam-search)，生成更多候选后过滤无效 ID，直到留下足够的有效结果；还提出未来可以用 prefix matching 将无效 ID 映射到共享有效前缀的物品。

另一个更直接的方案是维护 Semantic ID trie，在每一步解码时屏蔽无法组成有效 ID 的 token。这样可以保证生成结果有效，但也会重新引入一个外部合法前缀结构。

::disclosure[疑问：模型会不会主要学习同一物品内部的 token 转移？]
历史序列提供条件，训练目标是下一个物品的完整 Semantic ID。我的疑问是：预测目标物品的后几位 token 时，模型用了多少用户历史信息，又有多少信息已经包含在目标前缀里？

如果前缀已经强烈约束了后续 token，较低的 token loss 就可能部分来自 ID 内部的组合规律，而不完全来自对用户行为的理解。

我想按目标 token 的位置分别统计 loss，并在保持目标前缀不变时，遮蔽或打乱 encoder 的历史输入。如果后几位的预测几乎不变，这会提示模型可能更依赖目标前缀；如果明显退化，则说明历史条件仍在提供有用信息。这组对照可以帮助区分两种信息来源。
::

### 扩展性与代价：它真的更容易扩展吗

TIGER 在表示存储上确实有吸引力。传统模型可能为每个物品维护独立 embedding；TIGER 的物品 token embedding 只需要覆盖各层 codeword。主设置中是 $4\times256=1024$ 个 token embedding，而数据集有 10K–20K 个物品。

但生成式检索没有消灭检索成本，只是重新分配了成本。ANN 能够并行搜索候选，而 TIGER 需要逐 token 自回归解码，并通过 [beam search](term:beam-search) 获取 Top-K。[beam](term:beam-search) 越大，找到足够多有效候选的机会越高，推理成本也越大。

这两种成本形成了一个权衡：

> TIGER 用紧凑、可共享的结构化物品表示，交换了更复杂的自回归候选生成过程。

前面的[数据集融合实验](#数据集融合实验验证了什么)只检验了扩大物品语料后推荐指标的变化，没有测量这里的服务成本。表示容量、候选生成质量和线上吞吐量需要分别评估，才能判断这条路线在更大规模上的取舍。

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

主实验之外，我更关心下面这条因果链是否成立：

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
