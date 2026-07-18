---
title: "When Recommenders Start to 'Write' Items: Why TIGER's Semantic IDs Collapse"
slug: "tiger-semantic-id-codebook-capacity-en"
date: "2026-07-18"
updated: "2026-07-18"
description: "Starting from the anomaly that only 1 of 256 first-layer codewords survives, this article analyzes TIGER codebook collapse, the hard-ST fix, and task-dependent hierarchical capacity allocation across five Amazon categories."
category: "Research Notes"
tags: ["generative-recommendation", "semantic-id", "rq-vae", "tiger"]
research: []
featured: false
draft: false
math: true
toc: true
lang: "en"
socialImage: "media/social-card.png"
socialImageAlt: "Study of TIGER semantic ID codebook collapse and hierarchical capacity allocation"
---

> 中文版本：[当推荐系统开始‘写’商品：TIGER 的语义 ID 为什么会坍缩](../tiger-semantic-id-codebook-capacity/)

> **Lead:** Starting from the anomaly that only 1 of 256 first-layer codewords survives, we ask across five Amazon categories: how should an item's discrete "name" be layered so that it both reduces collisions and actually helps recommendation?

*An empirical study covering five datasets, four capacity layouts, and a fixed-order ablation*

Most recommender systems can be roughly described as "scoring" systems: first retrieve a set of candidate items, then score and rank each candidate. Generative recommendation takes a different view. Instead of asking only "is candidate A or candidate B more suitable?", it works like a language model continuing the next word: it **directly generates the identifier of the next item**.

This immediately raises a basic problem. The database IDs originally used by items are random numbers; nearby numbers do not mean nearby content, and millions of items create an enormous output vocabulary. Generative recommendation therefore needs an item "name" that is easier to predict while still preserving item semantics.

## What Is TIGER

[TIGER](https://proceedings.neurips.cc/paper_files/paper/2023/hash/20dcab0f14046a5c6b02b61da9f13229-Abstract-Conference.html) stands for **Transformer Index for GEnerative Recommenders**. This NeurIPS 2023 work proposes extracting vectors from item titles, descriptions, and other text; quantizing those vectors into a sequence of discrete tokens; and finally training a Transformer to generate the target item's token sequence from a user's history. The paper calls this token sequence a **Semantic ID**.

![The five-step TIGER pipeline from item text to three-layer semantic IDs and generative recommendation](media/tiger-pipeline.png)

Three terms are easy to confuse here:

- **Codebook**: the vocabulary of selectable tokens at one layer.
- **Codeword**: one concrete entry in a codebook, such as entry 12 in the first layer.
- **Semantic ID**: the combination of an item's codewords across all layers, such as `(12, 87, 203)`.

The quantizer used by TIGER is an RQ-VAE. RQ means residual quantization: the first layer approximates the item vector, the second layer encodes only the error left unexplained by the first layer, and the third layer encodes the residual error left by the first two layers. This approach comes from the [CVPR 2022 RQ-VAE work](https://openaccess.thecvf.com/content/CVPR2022/html/Lee_Autoregressive_Image_Generation_Using_Residual_Quantization_CVPR_2022_paper.html). TIGER uses [Sentence-T5](https://aclanthology.org/2022.findings-acl.146/) to produce item text vectors, then uses the discrete sequences obtained from RQ-VAE for recommendation.

You can think of a three-layer semantic ID as an address. The first layer chooses a broad region, the second branches within that region, and the third finds a finer location. This analogy does not require each layer to correspond to a human-defined category, but it accurately describes the conditional relationship in autoregressive prediction: the model must predict the first layer before the later layers can choose under that prefix.

## Where The Problem Appears

If each of the three codebooks has 256 codewords, the nominal number of possible semantic IDs is

$$
256^3=16{,}777{,}216
$$

The first Amazon Reviews 2018 category we studied, `Sports & Outdoors`, has 91,651 items after preprocessing, apparently far fewer than 16.78 million. So intuition easily gives the wrong answer: as long as the combinatorial space is large enough, items should not be crowded together.

Actual training produced the opposite result. The unmodified official configuration allocates 256 codewords to the first layer, but after training it uses only **1** of them. All items enter through the same first gate and can only rely on the second and third layers for rough discrimination. Only `20.40%` of complete semantic IDs are unique, and only `5.69%` of items occupy a path by themselves.

This is the core tension unpacked in this article: **large nominal capacity does not mean training will produce enough effective paths, balanced paths, or paths that are easy to predict.**

## Conclusions First

1. **The shallow-layer collapse in the official configuration is not an accident of one dataset.** Across Sports, Toys, Office, Video, and Musical, the first layer's effective branching is far below its nominal capacity.
2. **"How many codewords were used" cannot replace recommendation metrics.** Reset can substantially improve codebook usage while making NDCG worse; total entropy, the unique-ID ratio, and the number of effective paths also cannot select a model by themselves.
3. **hard-ST fixes a mismatch between the training objective and the actual discrete buckets.** Across five datasets, it both alleviates collisions and improves downstream recommendation.
4. **Which layer receives capacity matters more than the capacity product itself.** Moderate front-loading is usually more robust, but Musical prefers back-loading, showing that the best hierarchical structure is jointly determined by the task and the data.

Below, I first follow the experimental storyline that led to these conclusions. The formulas, full statistics, and limits of the conclusions appear in the later "Technical Details" section.

## Starting From The Anomaly: Only 1 First-Layer Codeword Survives

### Codebook Usage Is First A Failure Signal, Not A Scorecard

The first-layer collapse already shows that something is wrong with the quantizer, but it does not make the recommender completely fail. This official baseline still obtains `0.2376` validation NDCG@10 on Sports, even outperforming several later configurations whose codebook usage looks nicer.

NDCG@10 measures whether the correct item appears in the top 10 results and gives higher weight to hits ranked closer to the top; higher is better. This counterintuitive result gives the first important lesson:

> **Codebook usage is a failure signal, not a substitute for recommendation quality.**

### Reset Revives Codewords, But Not Recommendation

We first tried the most natural fix: make initialization more dispersed, encourage higher entropy, and periodically reset codewords that remain unused for a long time. This is the common dead-code reset strategy. Offline balanced residual KMeans shows that the same set of items can fully use all 256 codewords in each of the three layers, so the data itself is not "naturally clusterable only into one group."

The training experiments did improve the surface statistics. With balanced initialization plus dead-code reset, the three-layer codebook usage rose to `100%/71.5%/21.5%`, and the unique semantic ID ratio rose to `61.59%`. But test NDCG@10 was only `0.1656`, still below the official baseline's `0.2122`.

This result rules out a tempting story: **once idle codewords are revived, recommendation naturally improves.** Codewords can be used while still forming highly redundant, drifting, or decoder-unfriendly paths.

### The Three Layers Cannot Merely Try To "Fill Themselves"

In an RQ-VAE, each later layer quantizes the residual left by the previous layer. If all three layers update quickly at the same time, the targets seen by later layers change whenever earlier layers change. We therefore tried layerwise training, lower learning rates for older layers, dead-code reset, and an active-prefix scheme that lets already trained prefixes continue adapting when new layers are introduced.

In this group of experiments, the useful part was not the phrase "layerwise training" itself, but the active-prefix result: it pushed the unique semantic ID ratio to `79.4%` and raised validation/test NDCG@10 to `0.2749/0.2353`, the first stable improvement over the official baseline.

We then continued decoder training from 10k to 20k steps while restoring the optimizer state, but did not obtain a better checkpoint. This tells us the remaining gap is not simply because the decoder trained for too little time; the bottleneck is still in the SID learning objective and path structure.

### Soft Regularization Created A False Success That "Looked Uniform"

To avoid a complicated layerwise recipe, we next designed differentiable distribution regularizers: make each layer's average soft assignment from items to codes closer to uniform, and constrain the maximum mass on any single code. We later added prefix-conditioned regularization, hoping that each existing prefix would still retain enough successors.

Global soft regularization did improve downstream results: Sports validation/test NDCG@10 rose from the official baseline's `0.2376/0.2122` to `0.2633/0.2301`. A gentler prefix regularizer further improved full-path entropy, the unique-ID ratio, and the singleton ratio.

But a contradiction appeared late in training. The maximum probability in the soft distribution was about `0.00399`, almost equal to the uniform value for 256 classes, `1/256=0.003906`; the hard argmin actually used to generate SIDs still used only `75/256` first-layer codes.

In other words, the world seen by the regularizer had become almost perfect, while the discrete world used at deployment was still collapsed. This was not a matter of "the weight is still too small"; the optimized object was misaligned.

### hard-ST Aligns The Buckets Counted During Training With The Buckets Actually Used

The next change was small but logically important: in the forward pass, directly use the discrete one-hot bucket produced by the nearest codeword; in the backward pass, still pass gradients through the continuous soft probabilities. This straight-through estimator, with hard selection in the forward pass and soft gradients in the backward pass, is called **hard-ST** in this article.

A short 10k-step probe already increased three-layer codebook usage to `98.4%/94.9%/96.9%`. The full 100k-step equal-width experiment achieved a `74.98%` unique semantic ID ratio, and Sports validation/test NDCG@10 reached `0.3228/0.2835`.

At this point, we finally had a baseline that satisfied three conditions at once: hard buckets no longer severely collapsed, collisions were substantially reduced, and downstream recommendation improved stably.

This also changed the next question. Before, we kept asking "how can we stop the paths from collapsing?" From here onward, we could ask a more precise question: **once the paths are basically usable, which layer should receive the capacity?**

### With The Same 16.78 Million Nominal Paths, Capacity Placement Still Changes Results

We fixed the product of the three layer capacities at `2^24` and compared back-loaded `[128,256,512]`, equal-width `[256,256,256]`, moderately front-loaded `[512,256,128]`, and extremely front-loaded `[1024,256,64]`, while also completing two additional permutations on Sports.

The winner on Sports was the moderately front-loaded `[512,256,128]`, with valid/test NDCG@10 of `0.3494/0.3070`. But even though the extremely front-loaded configuration had higher H(full), more effective paths, and more unique SIDs, its NDCG fell back to `0.3306/0.2905`.

This step rejects another simple answer: **putting more capacity earlier is not always better, and neither is having more effective paths.** The first layer needs enough resolution for early routing, the middle layer still needs real branching capacity, and the final layer handles remaining disambiguation. The three layers form a joint configuration problem.

### With The Same Semantic IDs Fixed, Coarse-To-Fine Prediction Still Wins

The capacity experiments changed both the RQ representation and the decoder output heads, so they were still not clean enough. We therefore fixed the same `[512,256,128]` RQ-VAE and the same item-to-SID mapping, and changed only the decoder prediction order from `L0 -> L1 -> L2` to `L2 -> L1 -> L0`.

On Sports, valid/test NDCG@10 dropped by `7.89%/8.03%` relative to the original order. We later repeated this on Toys, Office, Video, and Musical, and the forward order won on all five datasets.

This evidence is more direct than cross-capacity comparisons: the same three tokens are not an unordered set of labels. Earlier tokens become conditions for later prediction, so the coarse-to-fine path order itself has task value.

### Five Datasets Give A Stable Main Story And One Counterexample

We then completed the preregistered matrix for five Amazon 2018 categories: Sports, Toys, Office, Video, and Musical.

Moderate front-loading improved validation NDCG@10 over equal-width on all five datasets, but it became the final winner only on Sports, Toys, and Office. Video selected extreme front-loading, while Musical selected back-loading.

At the same time, first-layer collapse in the official baseline appeared on all five datasets: first-layer effective branching ranged only from `1.00` to `6.19`. The equal-width hard-ST configuration improved both the unique semantic ID ratio and item-level NDCG on all five datasets.

So we can say two things with reasonable confidence:

1. The shallow collapse in the official training recipe is not a Sports-specific accident.
2. Moderate front-loading is a robust default direction, but the optimal capacity layout is genuinely modulated by the task and data structure.

### Musical Fully Separates "Total Number Of Paths" From "Where Information Is Placed"

Musical is the most valuable counterexample in the whole storyline. Back-loaded `[128,256,512]` has validation NDCG@10 of `0.3882`; extremely front-loaded `[1024,256,64]` has only `0.3630`. Yet the extremely front-loaded configuration has more effective full paths and a higher unique SID ratio.

The real difference is information allocation:

- back-loaded conditional effective branching is `99.4/36.25/2.28`;
- extremely front-loaded conditional effective branching is `970.3/6.56/1.34`.

Their total H(full) is almost the same, but extreme front-loading puts most of the discrimination burden on the first layer, while the second and third layers quickly degrade to only one or two effective successors under each prefix. The back-loaded configuration preserves stronger layer-by-layer increments.

The current evidence supports the claim that "too rapid a decay in conditional effective branching may hurt Musical's hierarchical prediction," but it cannot yet be written as the only cause. Capacity layout simultaneously changes quantization geometry, label space, and decoder difficulty. The next step needs oracle-prefix experiments, fixed-SID layer-loss interventions, and matched-data-size experiments for causal separation.

### The Final Result Is Not A Universal Configuration

If we only want a current default, the moderately front-loaded `[512,256,128]` is the most stable candidate by average rank across the five datasets. But that is not the most important conclusion of the exploration.

More importantly, we decomposed a vague "codebook collapse problem" into four different problems:

1. **Training allocation:** whether codes form meaningful hard buckets, rather than merely good-looking soft usage.
2. **Conditional paths:** how many effective successors remain under each prefix, and whether information increases layer by layer or is exhausted early.
3. **Downstream learnability:** whether the decoder can reliably predict early routing and use later tokens for refinement.
4. **Evaluation protocol:** whether tuple hits become optimistically biased because of SID collisions.

So the most accurate current interim conclusion is:

> **TIGER's main bottleneck is not insufficient nominal combinatorial space, but misalignment among hard assignment, conditional path shape, and the downstream prediction task. hard-ST alleviates shallow collapse at the training level; moderate front-loading and coarse-to-fine order are usually better, but the best information allocation is still dataset-dependent.**

---

## Technical Details: First Align On What We Are Measuring

### Why Codebook Usage, Unique Semantic IDs, And Effective Paths Are Not The Same Quantity

From here on, we enter the technical details. Readers who do not care about formulas can read only the opening and bold conclusions of each section; the definitions, derivations, and full tables that follow explain how the numbers are computed.

Suppose the item set contains $N$ items. Layer $l$ has $K_l$ codewords, and the three-layer semantic ID of item $i$ is written as

$$
S(i)=\bigl(S_0(i),S_1(i),S_2(i)\bigr).
$$

Codebook usage checks only whether a codeword appears at least once. Even if one codeword holds 90% of the items and the remaining codewords receive only a tiny number of items, usage can still be close to 100%. So we must also inspect distribution entropy, full-path collisions, and conditional branching.

#### Technical Details: How Marginal Entropy, Conditional Entropy, And Effective Branching Are Computed

For any discrete variable $X$, estimate probabilities with sample frequencies:

$$
\widehat p(x)=\frac{n_x}{N}.
$$

Empirical entropy is

$$
H(X)=-\sum_x \widehat p(x)\log \widehat p(x).
$$

If the layer has $K$ codes, normalized marginal entropy is

$$
\widetilde H(X)=\frac{H(X)}{\log K}.
$$

It equals 1 when the empirical distribution is perfectly uniform, and approaches 0 when the mass concentrates on very few codes.

The entropy of a three-layer SID obeys the chain rule:

$$
H(S_0,S_1,S_2)
=H(S_0)
+H(S_1\mid S_0)
+H(S_2\mid S_0,S_1).
$$

We exponentiate each term to obtain conditional effective branching:

$$
\begin{aligned}
B_0&=\exp\bigl(H(S_0)\bigr),\\
B_1&=\exp\bigl(H(S_1\mid S_0)\bigr),\\
B_2&=\exp\bigl(H(S_2\mid S_0,S_1)\bigr).
\end{aligned}
$$

The effective number of full paths is therefore

$$
\begin{aligned}
N_{\mathrm{eff}}
&=\exp\bigl(H(S_0,S_1,S_2)\bigr)\\
&=\exp\bigl(H(S_0)\bigr)
  \exp\bigl(H(S_1\mid S_0)\bigr)
  \exp\bigl(H(S_2\mid S_0,S_1)\bigr)\\
&=B_0B_1B_2.
\end{aligned}
$$

This is a direct algebraic transformation of the entropy chain rule, not an empirical formula fitted from experimental results.

### Why Models Can Only Be Selected By Validation Set

All generative models select the best checkpoint by static validation NDCG@10. The test set, three dynamic tests, and tuple-test are reported only after selection is frozen. This is not a formality; it avoids accidentally turning the test set into a tuning set across dozens of quantizer configurations.

#### Evaluation Protocol: Item Candidate Reranking Versus Tuple Generation

The main metric uses fixed candidate reranking: each sample contains 1 target item and 99 negative samples. The generative model scores the semantic ID paths of the candidate items, then HR/NDCG is computed.

Tuple generation receives no candidate items. It generates top-10 tuples within the legal semantic ID prefix tree, then checks whether the target tuple is hit. If multiple items share the same complete semantic ID, one tuple hit covers all of those items at the same time. Therefore, a heavily colliding model can show worse item ranking while having higher tuple NDCG.

This is why this article never uses tuple-test to select configurations.

## What Exactly Collapses In The Official Baseline

The Sports official baseline uses three `[256,256,256]` codebooks, KMeans initialization, and a straight-through gradient estimator. The RQ-VAE is trained for 400k steps, and the generative model is trained for 10k steps. It is the fixed reference for all subsequent modifications, not a weak baseline we selected after seeing the current results.

#### Full Data: Sports Official Baseline

| Metric | Result |
|---|---:|
| RQ eval total / reconstruction / rq | `0.2258 / 0.1422 / 0.0836` |
| usage L0/L1/L2 | `1/256, 201/256, 179/256` |
| conditional effective branches $B_0/B_1/B_2$ | `1.00 / 184.31 / 61.16` |
| H(full) / effective full paths | `9.330 / 11,273` |
| unique / singleton | `20.40% / 5.69%` |
| valid HR@10 / NDCG@10 | `0.3980 / 0.2376` |
| test HR@10 / NDCG@10 | `0.3671 / 0.2122` |

The first layer has only one effective branch, but the second and third layers still provide about 184 and 61 conditional effective branches respectively, so the model has not completely lost discriminative ability. This is exactly why "finding L0 collapse" is not the same as saying "the official downstream result must be the worst."

## Why Initialization And Reset Cannot Rescue Downstream Recommendation

The main value of this phase is not finding the final method, but ruling out wrong explanations. Balanced KMeans shows that the embedding geometry allows high coverage; reset shows that dead codes are indeed part of the problem; but the recommendation results show that neither is sufficient.

#### Full Data: Initialization, Exploration, And Reset

| Method | Motivation | RQ loss | usage L0/L1/L2 | H(full) | unique / singleton | valid NDCG | test NDCG |
|---|---|---:|---:|---:|---:|---:|---:|
| high-entropy probe | normalize, rotation trick, KMeans init, and other exploration enhancements | `0.1416` | `57.8%/34.4%/19.1%` | `9.596` | `39.16%/24.0%` | `0.1164` | `0.1013` |
| balanced RQKMeans init | balanced residual clustering initialization | `0.1340` | `85.2%/38.3%/11.7%` | `10.151` | `48.91%/31.7%` | not trained | not trained |
| balanced init + reset | periodically reset codes with long-term zero counts | `0.1322` | `100%/71.5%/21.5%` | `10.488` | `61.59%/46.5%` | `0.1900` | `0.1656` |

Offline balanced residual KMeans can produce 100% usage in all three layers in both raw-768 and encoder-32 spaces. At initialization, it also reaches `94.35%` unique and `89.92%` singleton, with a maximum full bucket size of only 24. The representation reconcentrates after training, so the main issue lies in training dynamics, not in the data being impossible to disperse by quantization.

#### Conclusion Boundary: Which Explanations This Phase Rules Out

1. **The embeddings are not naturally a single cluster.** Offline balanced clustering can cover all codes.
2. **Dead codes are not the only cause of collapse.** Reset improves usage but does not recover downstream performance.
3. **Lower reconstruction is not always better.** Reconstruction improvements in early exploration did not translate into NDCG.
4. **Higher unique is not always better.** balanced+reset has much higher unique than the official baseline, but still worse downstream performance.

## The Lesson From Layerwise Training: Prefixes Cannot Be Merely Frozen, But They Also Cannot Drift Without Limit

The original intent of layerwise learning-rate decay is to make later layers face a more stable residual. But when older layers are frozen too early, or kept at only a very small learning rate, the earlier layers themselves can degrade. The key change in active-prefix is that, when training a new layer, already activated prefix layers can still adapt jointly.

#### Full Data: Layerwise Training Series

| Method | Core change | usage L0/L1/L2 | H(full) | unique / singleton | valid NDCG | test NDCG |
|---|---|---:|---:|---:|---:|---:|
| layerwise lr decay | about 33k steps per layer, lower learning rate for old layers | `33.2%/100%/-` | `7.008`, two layers only | `6.65%/2.1%` | not trained | not trained |
| layerwise + reset | layerwise training with dead-code repair | `78.5%/100%/100%` | `9.982` | `50.59%/36.1%` | `0.1433` | `0.1212` |
| active-prefix + reset 60k | old layers continue updating with new layers | `86.7%/100%/100%` | `10.977` | `79.4%/69.7%` | `0.2749` | `0.2353` |

The layerwise+reset configuration has 100% usage in the later two layers, yet its downstream result is one of the worst in this group. This again shows that "every layer is fully used" does not mean full paths are balanced, nor that the decoder can learn them.

#### Control Experiment: Why Longer Generative-Model Training Did Not Change The Conclusion

We fixed the same active-prefix RQ-VAE, continued training from the original 10k decoder best checkpoint, and restored the optimizer state. Within 20k steps, no new checkpoint exceeded the original best; the final valid/test remained `0.2749/0.2353`.

This experiment rules out only one narrow explanation: the gap between active-prefix and stronger methods is not simply because the decoder ran 10k fewer steps. It does not prove that the decoder architecture is already optimal.

## Why Soft Regularization Can "Already Look Uniform"

The goal of the soft regularizer is to approximate the true assignment with differentiable probabilities. It works in engineering terms and brings real NDCG gains; the problem is that the actual SID is determined by hard argmin, while soft probabilities can look uniform near decision boundaries.

#### Technical Details: Exact Definition Of The Soft Distribution Regularizer

For item $i$ and code $k$ in layer $l$, first compute the normalized distance $\widetilde d_{ik}^{(l)}$, then define a soft assignment with temperature $\tau$:

$$
q_{ik}^{(l)}
=\frac{\exp\left(-\widetilde d_{ik}^{(l)}/\tau\right)}
{\sum_{j=1}^{K_l}\exp\left(-\widetilde d_{ij}^{(l)}/\tau\right)}.
$$

Batch-average usage is

$$
\overline q_k^{(l)}=\frac{1}{B}\sum_{i=1}^{B}q_{ik}^{(l)}.
$$

The entropy gap in the implementation is

$$
\Delta_H^{(l)}
=\max\left(0,\log K_l-H\bigl(\overline q^{(l)}\bigr)\right),
$$

and the maximum-mass penalty is

$$
P_{\max}^{(l)}
=\left[\max_k\overline q_k^{(l)}-\rho_l\right]_+^2.
$$

The single-layer regularizer is

$$
\mathcal L_{\mathrm{dist}}^{(l)}
=\lambda_H\Delta_H^{(l)}+\lambda_M P_{\max}^{(l)}.
$$

The code defines row-std normalization by first subtracting each item's minimum distance, then dividing by the standard deviation of that item's distances to all codes. This addresses distance scale; it does not change the hard argmin.

#### Technical Details: 500-Step Numeric-Scale Probes

| Probe | eval total | usage L0/L1/L2 | Observation |
|---|---:|---:|---|
| baseline 500 | `0.254` | `0.4%/0.8%/0.8%` | official recipe concentrates quickly early on |
| raw `tau=3e-7,h=.02,m=1` | `3.541` | `0.4%/0.8%/0.8%` | regularization too large, no exploration gain |
| raw `tau=1e-6,h=.05,m=10` | `30.620` | `0.4%/0.4%/0.4%` | softmax saturation |
| raw `tau=1e-6,h=.1,m=30` | `83.154` | `0.4%/0.8%/0.8%` | regularizer dominates training |
| row-std `tau=.05,h=.01,m=3` | `0.261` | `0.8%/0.8%/0.8%` | stable but gradients too weak |
| row-std `tau=.05,h=.02,m=10` | `0.293` | `2.3%/2.0%/1.6%` | slight exploration |
| row-std `tau=.02,h=.01,m=3` | `0.284` | `0.8%/2.3%/3.9%` | selected as the gentle full configuration |

These probes were used only to find the numerical scale. They have no decoder and should not be compared as recommendation results.

#### Full Data: Global Regularization, Prefix Regularization, And Soft/Hard Mismatch

Global soft 100k increases Sports L0 usage from `0.4%` to `24.6%`, H(full) from `9.330` to `10.683`, and valid/test NDCG from `0.2376/0.2122` to `0.2633/0.2301`.

Prefix regularization groups items by existing prefixes. For a prefix group of size $n_g$, the target capacity is

$$
K_g^*=\min(K_l,n_g),
$$

with target entropy $\log K_g^*$ and maximum-mass threshold $\rho_{\mathrm{factor}}/K_g^*$. This does not require a prefix with only 5 items to uniformly occupy 256 codes.

10k probe results:

| Configuration | L0 usage | H(full) | unique | singleton | maximum full-bucket ratio |
|---|---:|---:|---:|---:|---:|
| global soft only | `12.9%` | `10.497` | `56.52%` | `40.07%` | `0.0884%` |
| gentle prefix | `18.0%` | `10.585` | `60.00%` | `44.01%` | `0.0807%` |
| stronger prefix | `9.0%` | `10.182` | `46.70%` | `30.08%` | `0.1015%` |

The gentle full training run reached L0 usage `29.3%`, H(full) `10.766`, and unique/singleton `66.5%/51.2%`. But when the soft maximum probability was about `0.00399`, hard L0 still used only `75/256` codes. This contradiction directly triggered hard-ST.

## hard-ST: Let The Regularizer See The Discrete Buckets Actually Used

The core of hard-ST is not increasing the entropy weight again, but changing which assignment the regularizer uses in the forward pass. The statistics used during training and the final SIDs both observe the same hard argmin, while gradients are approximately propagated through soft probabilities.

#### Technical Details: hard-ST Forward And Backward

Let the soft assignment be $q_{ik}$, and let the hard argmin one-hot be

$$
h_{ik}=\mathbf 1\left[k=\arg\min_j d_{ij}\right].
$$

Let $\operatorname{sg}(x)$ denote stop-gradient: its forward value equals $x$, and its backward derivative is 0. The hard-ST assignment is defined as

$$
\widetilde q_{ik}
=h_{ik}+q_{ik}-\operatorname{sg}(q_{ik}).
$$

In the forward pass, $q_{ik}-\operatorname{sg}(q_{ik})=0$, so

$$
\widetilde q_{ik}=h_{ik}.
$$

In the backward pass, neither $h_{ik}$ nor $\operatorname{sg}(q_{ik})$ provides gradients, so

$$
\frac{\partial \widetilde q_{ik}}{\partial q_{ik}}=1.
$$

This is precisely hard-forward / soft-backward: the regularization loss counts real hard buckets in the forward pass, while still updating distances and codebooks in the backward pass. It is a gradient estimator, not the true derivative of hard argmin.

#### Full Data: hard-ST Short Probe And Full Training

The 10k probe already reached: usage `98.4%/94.9%/96.9%`, H(full) `10.939`, unique `74.11%`, singleton `60.79%`, and maximum full bucket size 38.

Full 100k equal-width result:

| Metric | hard-ST `[256,256,256]` |
|---|---:|
| RQ total / reconstruction / rq / distribution | `0.2883 / 0.1128 / 0.1632 / 0.0122` |
| usage | `252/256, 255/256, 255/256` |
| H(full) / effective full paths | `10.9529 / 57,119` |
| unique / singleton | `74.98% / 62.34%` |
| maximum full bucket | `53` |
| valid HR@10 / NDCG@10 | `0.5074 / 0.3228` |
| test HR@10 / NDCG@10 | `0.4640 / 0.2835` |

Relative to global soft, valid/test NDCG improved from `0.2633/0.2301` to `0.3228/0.2835`; relative to active-prefix, test NDCG improved from `0.2353` to `0.2835`.

#### Conclusion Boundary: What The hard-ST Comparison Can Prove

hard-ST and the official baseline do not differ by only one Boolean switch: the official RQ budget is 400k, while the hard-ST main matrix is 100k; hard-ST also uses global and prefix regularization and their associated parameters. Therefore, the experiment supports "the full hard-ST training recipe is better," but cannot precisely attribute all gains to straight-through hard assignment alone.

Cleaner evidence comes from the short-probe comparison between soft and hard: under similar budgets and a similar regularization framework, aligning to hard buckets immediately improves real usage, unique, and H(full) by a large margin. Component-level causality for full downstream performance still requires a dedicated ablation.

## Why Different Layouts Are Not Equivalent Under The Same Capacity Product

The three layer capacities are $K_0,K_1,K_2$. This experiment fixes

$$
K_0K_1K_2=2^{24}=16{,}777{,}216,
$$

and changes only whether capacity is placed in the earlier, middle, or later layers. This rules out "one configuration only has a larger paper combinatorial space," but it does not rule out end-to-end differences caused by different output heads and quantization geometry.

#### Experimental Design: Why We First Ran Two Short Capacity Probes

| 10k probe | usage L0/L1/L2 | H(full) | effective full paths | unique / singleton | maximum full bucket |
|---|---:|---:|---:|---:|---:|
| `[64,128,256]` | `95.3%/94.5%/93.4%` | `10.2757` | `29,018` | `51.93%/36.48%` | `147` |
| `[128,256,512]` | `97.7%/92.2%/99.6%` | `10.7977` | `48,910` | `69.32%/55.62%` | `97` |

`[128,256,512]` improved H(full), unique, and singleton at the same time, so it entered the full pipeline. The short probes had no decoder and served only as a compute-screening step.

#### Full Data: Six Same-Total-Capacity Results On Sports

| Capacity layout | RQ total / recon | effective branches $B_0/B_1/B_2$ | H(full) | effective full paths | unique / singleton | valid NDCG | test NDCG |
|---|---:|---:|---:|---:|---:|---:|---:|
| back-loaded `[128,256,512]` | `0.3108/0.1117` | `119.4/54.23/7.98` | `10.8536` | `51,718` | `71.55%/58.63%` | `0.3181` | `0.2793` |
| equal-width `[256,256,256]` | `0.2883/0.1128` | `243.7/46.15/5.08` | `10.9529` | `57,119` | `74.98%/62.34%` | `0.3228` | `0.2835` |
| widened middle `[256,512,128]` | `0.2810/0.1136` | `243.6/47.86/5.02` | `10.9763` | `58,471` | `75.29%/62.13%` | `0.3385` | `0.2965` |
| widened first layer, narrowed middle `[512,128,256]` | `0.2725/0.1138` | `488.3/31.23/3.95` | `11.0053` | `60,190` | `77.80%/66.27%` | `0.3385` | `0.2967` |
| moderately front-loaded `[512,256,128]` | `0.2749/0.1150` | `489.5/35.62/3.57` | `11.0382` | `62,204` | `78.98%/67.75%` | **`0.3494`** | **`0.3070`** |
| extremely front-loaded `[1024,256,64]` | `0.2680/0.1144` | `958.0/29.20/2.45` | `11.1352` | `68,545` | **`83.80%/74.47%`** | `0.3306` | `0.2905` |

This table directly rules out three single-metric rules:

- Extreme front-loading has the highest H(full), effective paths, unique, and singleton, but is not the NDCG winner.
- Back-loading has the lowest reconstruction, but is not the winner.
- `[512,128,256]` and `[512,256,128]` have the same first layer, but the latter is better, showing that middle-layer branching cannot be ignored.

#### Conclusion Boundary: What Changes When The Capacity Layout Changes

Changing $K_l$ changes at least three things:

1. the number of Voronoi regions available to the layer-$l$ quantizer;
2. the subsequent residual distribution and the sample counts in prefix groups;
3. the decoder's classification-head size and label frequency at position $l$.

Therefore, this experiment identifies the end-to-end effect of the capacity configuration. To estimate the "tokenizer structure effect" alone, we would need to fix SIDs and change the decoder; to estimate the "decoder label-space effect" alone, we would need a controlled mapping or distillation experiment.

## Fixed-SID Order Experiment: Path Direction Is Not Decoration

The moderately front-loaded configuration originally generates three layers in the order `L0 -> L1 -> L2`. The order ablation fully reuses the RQ-VAE and item-to-SID mapping, changing only the decoder input/output order to `L2 -> L1 -> L0`.

#### Full Data: Sports Forward Versus Reverse Order

| decoder order | valid NDCG@10 | test NDCG@10 | dynamic preference | dynamic constraint | dynamic conflict |
|---|---:|---:|---:|---:|---:|
| forward `L0 -> L1 -> L2` | **`0.3494`** | **`0.3070`** | **`0.2700`** | **`0.2734`** | **`0.1612`** |
| reverse `L2 -> L1 -> L0` | `0.3218` | `0.2824` | `0.2500` | `0.2546` | `0.1604` |

Because the SIDs, collisions, and RQ representation are fully fixed, this difference is closer to a causal effect of "prediction order" than cross-capacity comparisons are. It still depends on the current T5 decoder and training protocol, and cannot be automatically extrapolated to arbitrary generative architectures.

#### Full Data: Order Replication Across Five Datasets

| Dataset | forward valid NDCG | reverse valid NDCG | absolute drop | forward test NDCG | reverse test NDCG |
|---|---:|---:|---:|---:|---:|
| Sports | `0.3494` | `0.3218` | `0.0276` | `0.3070` | `0.2824` |
| Toys | `0.3640` | `0.3063` | `0.0577` | `0.3185` | `0.2674` |
| Office | `0.3599` | `0.3425` | `0.0174` | `0.2976` | `0.2807` |
| Video | `0.4648` | `0.4274` | `0.0374` | `0.4292` | `0.3927` |
| Musical | `0.3698` | `0.3621` | `0.0077` | `0.3087` | `0.2984` |

The forward order is higher on all five validation sets and all five frozen test sets. Musical has the smallest gap, showing that directionality is a stable pattern while the effect size is still dataset-dependent.

#### Evaluation Protocol: Sports Item-Level And Tuple Metrics Side By Side

| Sports configuration | item test NDCG@10 | tuple test NDCG@10 |
|---|---:|---:|
| back-loaded `[128,256,512]` | `0.2793` | `0.0383` |
| equal-width `[256,256,256]` | `0.2835` | `0.0358` |
| moderately front-loaded `[512,256,128]` | **`0.3070`** | **`0.0399`** |
| extremely front-loaded `[1024,256,64]` | `0.2905` | `0.0375` |
| moderately front-loaded, decoder reverse order | `0.2824` | `0.0369` |

The two values have different scales and candidate spaces, so subtracting them does not yield a meaningful "bias size." Tuple results must be interpreted together with collision statistics.

## Capacity And Effective Paths Across Five Datasets

The cross-dataset experiments use the same seed2024, the same validation-only selection rule, and the same four core capacity configurations. Toys and Office were run first under preregistration; Video and Musical were preregistered as the remaining feasible Amazon categories before observing their results.

#### Full Data: Sizes Of The Five Datasets

| Dataset | users | items | interactions | train interactions | avg interactions/user | interactions/item |
|---|---:|---:|---:|---:|---:|---:|
| Sports_and_Outdoors | `282,221` | `91,651` | `2,398,036` | `1,833,594` | `8.497` | `26.16` |
| Toys_and_Games | `179,087` | `70,319` | `1,572,308` | `1,214,134` | `8.780` | `22.36` |
| Office_Products | `85,305` | `24,182` | `674,323` | `503,713` | `7.905` | `27.89` |
| Video_Games | `44,409` | `14,862` | `396,755` | `307,937` | `8.934` | `26.70` |
| Musical_Instruments | `23,759` | `9,137` | `197,639` | `150,121` | `8.318` | `21.63` |

#### Full Data: Validation And Test NDCG@10 For Four Capacity Configurations

| Dataset | back-loaded `[128,256,512]` | equal-width `[256,256,256]` | moderately front-loaded `[512,256,128]` | extremely front-loaded `[1024,256,64]` | validation winner |
|---|---:|---:|---:|---:|---|
| Sports valid | `0.3181` | `0.3228` | **`0.3494`** | `0.3306` | moderately front-loaded |
| Sports test | `0.2793` | `0.2835` | **`0.3070`** | `0.2905` | fixed to moderately front-loaded |
| Toys valid | `0.3259` | `0.3429` | **`0.3640`** | `0.3351` | moderately front-loaded |
| Toys test | `0.2827` | `0.2992` | **`0.3185`** | `0.2924` | fixed to moderately front-loaded |
| Office valid | `0.3558` | `0.3552` | **`0.3599`** | `0.3583` | moderately front-loaded |
| Office test | `0.2920` | `0.2932` | **`0.2976`** | `0.2946` | fixed to moderately front-loaded |
| Video valid | `0.4600` | `0.4618` | `0.4648` | **`0.4655`** | extremely front-loaded |
| Video test | `0.4203` | `0.4255` | **`0.4292`** | `0.4258` | still fixed to extremely front-loaded |
| Musical valid | **`0.3882`** | `0.3666` | `0.3698` | `0.3630` | back-loaded |
| Musical test | **`0.3227`** | `0.3039` | `0.3087` | `0.2962` | fixed to back-loaded |

Video's frozen test value favors moderate front-loading, but the selection rule cannot be rewritten after seeing the test set, so the final selection remains the extreme front-loading chosen by validation.

#### Full Data: 20 Effective-Path Results Across Five Datasets

Coverage is defined as $N_{\mathrm{eff}}/N$, not the actual unique SID ratio.

| Dataset | Configuration | effective branches $B_0/B_1/B_2$ | H(full) | effective full paths | path coverage | valid NDCG |
|---|---|---:|---:|---:|---:|---:|
| Sports | back-loaded | `119.4/54.23/7.98` | `10.8536` | `51,718` | `56.4%` | `0.3181` |
| Sports | equal-width | `243.7/46.15/5.08` | `10.9529` | `57,119` | `62.3%` | `0.3228` |
| Sports | moderately front-loaded | `489.5/35.62/3.57` | `11.0382` | `62,204` | `67.9%` | **`0.3494`** |
| Sports | extremely front-loaded | `958.0/29.20/2.45` | `11.1352` | `68,545` | `74.8%` | `0.3306` |
| Toys | back-loaded | `120.0/75.19/5.75` | `10.8565` | `51,872` | `73.8%` | `0.3259` |
| Toys | equal-width | `234.3/62.79/3.83` | `10.9396` | `56,363` | `80.2%` | `0.3429` |
| Toys | moderately front-loaded | `493.7/51.23/2.41` | `11.0172` | `60,915` | `86.6%` | **`0.3640`** |
| Toys | extremely front-loaded | `972.1/32.97/1.91` | `11.0195` | `61,053` | `86.8%` | `0.3351` |
| Office | back-loaded | `119.0/45.01/3.51` | `9.8409` | `18,786` | `77.7%` | `0.3558` |
| Office | equal-width | `245.2/27.23/2.80` | `9.8369` | `18,711` | `77.4%` | `0.3552` |
| Office | moderately front-loaded | `264.4/26.02/2.77` | `9.8537` | `19,029` | `78.7%` | **`0.3599`** |
| Office | extremely front-loaded | `971.8/11.96/1.78` | `9.9403` | `20,750` | `85.8%` | `0.3583` |
| Video | back-loaded | `122.6/42.73/2.39` | `9.4359` | `12,531` | `84.3%` | `0.4600` |
| Video | equal-width | `245.7/27.95/1.87` | `9.4591` | `12,824` | `86.3%` | `0.4618` |
| Video | moderately front-loaded | `494.1/17.28/1.56` | `9.4971` | `13,320` | `89.6%` | `0.4648` |
| Video | extremely front-loaded | `979.7/10.63/1.33` | `9.5369` | `13,861` | `93.3%` | **`0.4655`** |
| Musical | back-loaded | `99.4/36.25/2.28` | `9.0156` | `8,231` | `90.1%` | **`0.3882`** |
| Musical | equal-width | `235.4/16.62/2.00` | `8.9663` | `7,834` | `85.7%` | `0.3666` |
| Musical | moderately front-loaded | `488.6/10.44/1.61` | `9.0127` | `8,207` | `89.8%` | `0.3698` |
| Musical | extremely front-loaded | `970.3/6.56/1.34` | `9.0527` | `8,541` | `93.5%` | `0.3630` |

If we look only at effective paths, extreme front-loading is almost always better; if we look at NDCG, it is the winner only on Video. Total path count is therefore a necessary diagnostic quantity, not a model-selection objective.

#### Technical Details: Unique IDs, Singleton, Maximum Bucket, And Coverage

Let the set of actually observed complete SIDs be $\mathcal S_{\mathrm{obs}}$, and let each complete SID bucket contain $n_s$ items.

The unique SID ratio is

$$
r_{\mathrm{unique}}=\frac{|\mathcal S_{\mathrm{obs}}|}{N}.
$$

The singleton item ratio is

$$
r_{\mathrm{singleton}}
=\frac{1}{N}\sum_{s\in\mathcal S_{\mathrm{obs}}}\mathbf 1[n_s=1].
$$

The maximum full bucket size is

$$
n_{\max}=\max_{s\in\mathcal S_{\mathrm{obs}}}n_s.
$$

The "effective path coverage" in the tables is

$$
r_{\mathrm{eff}}=\frac{N_{\mathrm{eff}}}{N},
$$

which is not the unique SID ratio. Unique counts only non-empty buckets; $N_{\mathrm{eff}}$ additionally penalizes uneven bucket sizes.

## Official Collapse Holds Across Datasets, But Tuple Metrics Can Hide It

The first-layer effective branching of the five official baselines is far below the nominal 256. Toys and Video can reach 100% usage in later-layer codebooks, but that still does not refute first-layer collapse, because many later-layer codewords may unfold only under a very small number of early prefixes.

#### Full Data: Five-Dataset Comparison Between Official Baseline And Equal-Width hard-ST

| Dataset | official effective branches $B_0/B_1/B_2$ | official H(full) | official effective paths | official/Hard-ST unique | official/Hard-ST valid NDCG | official/Hard-ST test NDCG |
|---|---:|---:|---:|---:|---:|---:|
| Sports | `1.00/184.31/61.16` | `9.330` | `11,273` | `20.40%/74.98%` | `0.2376/0.3228` | `0.2122/0.2835` |
| Toys | `6.19/114.17/37.01` | `10.172` | `26,168` | `52.42%/87.03%` | `0.2578/0.3429` | `0.2232/0.2992` |
| Office | `1.99/64.05/21.56` | `7.918` | `2,746` | `19.42%/84.69%` | `0.2130/0.3552` | `0.1782/0.2932` |
| Video | `4.74/145.38/12.26` | `9.042` | `8,449` | `67.85%/90.82%` | `0.4019/0.4618` | `0.3660/0.4255` |
| Musical | `2.00/44.27/17.32` | `7.333` | `1,530` | `26.18%/90.33%` | `0.2313/0.3666` | `0.1879/0.3039` |

Equal-width hard-ST improves unique SID, validation NDCG, and frozen test NDCG on all five datasets. This supports the claim that shallow collapse in the official recipe is reproducible across datasets, but it is still a comparison of full recipes, not a single-component causal estimate.

#### Full Data: How Collisions Inflate tuple-test

| Dataset | official/Hard-ST non-singleton items | official/Hard-ST item test NDCG | official/Hard-ST tuple test NDCG |
|---|---:|---:|---:|
| Toys | `66.05%/21.21%` | `0.2232/0.2992` | `0.0195/0.0153` |
| Office | `94.47%/25.10%` | `0.1782/0.2932` | `0.0582/0.0556` |
| Video | `50.37%/15.76%` | `0.3660/0.4255` | `0.0394/0.0416` |
| Musical | `91.03%/16.78%` | `0.1879/0.3039` | `0.0765/0.0638` |

On Toys, Office, and Musical, the official model ranks items worse, yet has higher tuple NDCG. The reason is not that the official model is better at generation, but that a colliding tuple represents multiple items at once, enlarging the set of "hits."

Therefore tuple HR/NDCG must be reported together with unique, singleton, maximum collision bucket, and item-level HR/NDCG. It cannot by itself support the claim that a tokenizer is better, and it cannot participate in checkpoint selection.

## Musical: Is Over-Fast Conditional-Branch Shrinkage The Cause

Musical is not weak overall. Its best validation NDCG, `0.3882`, is higher than Sports, Toys, and Office. The word "counterexample" refers only to the relative ranking of capacity layouts differing from most datasets.

#### Full Data: Three Key Musical Configurations

| Musical configuration | valid NDCG | RQ reconstruction | effective branches $B_0/B_1/B_2$ | H(full) | effective paths | unique SID |
|---|---:|---:|---:|---:|---:|---:|
| back-loaded `[128,256,512]` | **`0.3882`** | **`0.1005`** | `99.4/36.25/2.28` | `9.0156` | `8,231` | `93.18%` |
| moderately front-loaded `[512,256,128]` | `0.3698` | `0.1068` | `488.6/10.44/1.61` | `9.0127` | `8,207` | `93.02%` |
| extremely front-loaded `[1024,256,64]` | `0.3630` | `0.1082` | `970.3/6.56/1.34` | `9.0527` | `8,541` | **`95.50%`** |

Extreme front-loading is higher in effective paths and unique, yet lowest in validation NDCG. This is the clearest counterexample to "more total paths is better."

#### Technical Details: Similar Total Entropy Can Still Hide Completely Different Layer Allocation

The entropy-chain decomposition of the back-loaded configuration is

$$
H_{\mathrm{back}}
=4.598925+3.590402+0.826317
=9.015643.
$$

For the extremely front-loaded configuration:

$$
H_{\mathrm{extreme}}
=6.877582+1.880629+0.294480
=9.052691.
$$

Define the information share in the later two layers as

$$
r_{\mathrm{later}}
=\frac{H(S_1\mid S_0)+H(S_2\mid S_0,S_1)}
{H(S_0,S_1,S_2)}.
$$

Substituting values gives

$$
r_{\mathrm{later}}^{\mathrm{back}}
\approx\frac{3.590402+0.826317}{9.015643}
\approx 49.0\%,
$$

while

$$
r_{\mathrm{later}}^{\mathrm{extreme}}
\approx\frac{1.880629+0.294480}{9.052691}
\approx 24.0\%.
$$

The two configurations have similar total information, but extreme front-loading pushes most information into the first layer and rapidly exhausts conditional increments in the later layers. It can produce more unique SIDs, yet no longer forms the same strong "coarse split followed by refinement" structure.

#### Evidence Interpretation: What The Generative Model's Layerwise Loss Shows

| Musical configuration | hierarchy-0 loss | hierarchy-1 loss | hierarchy-2 loss | total loss |
|---|---:|---:|---:|---:|
| back-loaded | `3.747` | `2.782` | `0.800` | `7.3296` |
| equal-width | `4.433` | `2.187` | `0.704` | `7.3246` |
| moderately front-loaded | `4.989` | `1.742` | `0.506` | **`7.2363`** |
| extremely front-loaded | `5.465` | `1.390` | `0.427` | `7.2830` |

The more capacity is front-loaded, the harder L0 classification becomes and the easier L1/L2 become. This is consistent with "later conditional branching is exhausted." But the lowest total loss belongs to moderate front-loading, while the NDCG winner is back-loading, so token-level likelihood is also not a sufficient proxy for ranking quality.

#### Conclusion Boundary: Data Size Is Not Yet A Sufficient Explanation For The Musical Counterexample

Musical is indeed the smallest dataset: 150,121 train interactions and 9,137 items. But the current cross-dataset comparison cannot confirm scale as the only cause:

- Toys has interactions/item of `22.36`, close to Musical's `21.63`, yet clearly prefers moderate front-loading.
- Video has about twice as many total interactions as Musical, and prefers extreme front-loading.
- Office has fewer items than Sports/Toys, but moderate front-loading still wins slightly.

A more direct diagnostic of training support is the median sample count per active L0 code:

| Dataset | back-loaded | equal-width | moderately front-loaded | extremely front-loaded |
|---|---:|---:|---:|---:|
| Musical | `1,073` | `443` | `211` | `97` |
| Video | `2,260` | `1,048` | `468` | `220` |

Extreme front-loading pushes Musical's per-L0-class support lower, which may increase early-routing estimation variance. But these statistics are diagnostics after observing the result, not preregistered causal tests.

To truly test the scale effect, Video should be downsampled to Musical's train-interaction count while preserving Video's item/metadata structure, and then the capacity matrix should be repeated.

#### Additional Clue: What The Item Category Hierarchy Suggests

We use the Amazon metadata category tree as a posterior proxy, observing whether the coarse catalog layer is concentrated and whether deeper layers continue to unfold. This is not a training label and not proof; it only helps formulate a mechanism hypothesis.

| Dataset | effective metadata coarse categories | maximum coarse-category mass | same-category transition rate |
|---|---:|---:|---:|
| Sports | `2.45` | `61.3%` | `0.694` |
| Toys | `17.33` | `11.0%` | `0.342` |
| Office | `1.75` | `84.3%` | `0.795` |
| Video | `9.96` | `19.4%` | `0.543` |
| Musical | `4.83` | `57.3%` | `0.561` |

Video's metadata is already more dispersed at the coarse layer, so extreme front-loading can directly encode more coarse resolution. Musical is more concentrated at the coarse layer, but its deeper paths expand from `4.83` to `12.63` and then to `63.28`, looking more like "a few coarse classes that continue to subdivide." This shape is consistent with Musical's preference for back-loading, but it still cannot rule out the joint effects of text geometry, behavioral sequences, and decoder optimization.

### The Most Rigorous Current Statement

The current evidence supports the following limited proposition:

> In Musical, the more extremely capacity is front-loaded, the faster the later two layers' conditional effective branching shrinks; this information allocation co-occurs with worse NDCG, so it is a data-supported candidate cause.

The current experiments do not prove that it is the only cause, a sufficient cause, or a universal law across datasets.

## Which Conclusions Are Solid, And Which Are Still Interpretations

#### Evidence Grading: Conclusions Stably Supported By The Current Five Datasets

| Proposition | Direct evidence |
|---|---|
| Early-layer collapse in official TIGER appears across datasets | official L0 effective branching is only `1.00-6.19` across five datasets |
| usage alone cannot judge representation quality | layerwise+reset has 100% later-layer usage, but validation NDCG is only `0.1433` |
| H(full), unique, and reconstruction loss cannot select capacity alone | extreme front-loading counterexamples on Sports and Musical; lower back-loaded recon is not always best |
| coarse-to-fine order has task value | fixed-SID reverse order drops on validation and test in 5/5 datasets |
| capacity allocation is task-dependent | 3 moderate-front winners, 1 extreme-front winner, 1 back-loaded winner |
| tuple metrics are affected by optimistic collision bias | three datasets show worse item metrics but higher tuple metrics |

#### Evidence Grading: Partially Supported Propositions

| Proposition | Current judgment | Missing evidence |
|---|---|---|
| `[512,256,128]` is universally optimal | false as a universal claim; it is only 3/5 winner and best by average rank | non-Amazon data, more seeds, different decoders |
| balancing conditional branching across layers matters more than total paths | strong correlational evidence | fixing total entropy while independently manipulating conditional branching |
| Musical is hurt by overly fast later-branch decay | reasonable mechanism candidate | oracle-prefix, layer-loss, and prefix-entropy interventions |
| smaller data prefers back-loaded capacity | current evidence insufficient | downsampling experiments with matched domain structure |

#### Evidence Grading: Simple Rules Already Weakened

- Use more codes, and recommendation will naturally improve.
- Higher unique SID or more effective paths necessarily means higher NDCG.
- Lower RQ reconstruction necessarily means better downstream performance.
- Longer decoder training can recover tokenizer structural defects.
- The product of three codebooks is all that matters; layout and order are irrelevant.
- All datasets should place as much capacity as possible in earlier layers.

## How To Turn The Musical Explanation Into Causal Evidence

The next round should not continue expanding the capacity grid without a goal. The most informative experiments are those that hold as many parts fixed as possible and intervene on one mechanism.

#### Follow-Up Validation: Six Minimal Experiments In Priority Order

1. **Oracle-prefix decoder, without retraining RQ.** At inference time, first force the correct $S_0$, then force the correct $(S_0,S_1)$. If extreme front-loading catches up quickly under correct prefixes, the main bottleneck is early-routing error propagation.
2. **Fixed SID, changing only L0 loss weight or label smoothing.** If extreme front-loading recovers, wide-L0 decoder learnability contributes substantially, rather than tokenizer information being insufficient by itself.
3. **Fixed capacity, higher prefix-entropy weight.** Preregister `.002 -> .005/.01`, and check whether $B_1/B_2$ and NDCG rise together.
4. **Add same-total-capacity back-loaded groups.** `[128,512,256]` and `[64,512,512]` distinguish "the first layer should be small" from "the middle layer needs stronger unfolding."
5. **Downsample Video to Musical scale.** Manipulate sample size alone to test whether "small data causes a back-loaded preference."
6. **Multiple seeds and non-Amazon replication.** Run after freezing the main configurations, rather than appending configurations ad hoc based on current test results.

These six items are follow-up validations and are not part of the results in this article. In particular, multi-seed experiments should be run uniformly after the main configurations are frozen, not decided ad hoc based on the current test-set performance.

### This Article Does Not Claim A Model-Level SOTA Comparison

This article compares training and capacity design inside TIGER. It is not a SOTA leaderboard covering all generative recommendation methods. Recommendation-aware tokenizers such as LETTER, ETEGRec, and MME-SID have not yet been reproduced under the same data splits and evaluation protocol, so this article does not describe them as settled wins or losses.

## How The Experiments Keep Comparisons Fair

The data comes from the public [Amazon Review Data 2018](https://cseweb.ucsd.edu/~jmcauley/datasets/amazon_v2/index.html). We use five categories: Sports & Outdoors, Toys & Games, Office Products, Video Games, and Musical Instruments. Across experiments, we keep data preprocessing, candidate sets, and the downstream model framework consistent.

To avoid "choosing the model after seeing the test set," the experiments follow these rules:

1. **Use only the validation set to select checkpoints and capacity configurations.** The test set, dynamic tests, and tuple-test are used only for final reporting.
2. **Fix total combinatorial capacity in capacity-layout experiments.** `[128,256,512]`, `[256,256,256]`, `[512,256,128]`, and `[1024,256,64]` all have product $2^{24}$.
3. **Fix the same semantic IDs in the order ablation.** Forward and reverse order change only the token order seen by the generative model, and do not retrain the quantizer.
4. **Use item-level metrics as the basis for main conclusions.** Tuple metrics count hitting the same semantic ID as success and can be optimistically biased by collisions, so they are diagnostic only.
5. **Use the same random seed for all main matrices.** This makes the current matrix internally comparable, but it is also the most important statistical limitation of the article.

#### Method Boundary: Which Differences Cannot Be Attributed To A Single Switch

The official baseline trains the RQ-VAE for 400k steps, while the hard-ST main matrix trains for 100k steps; hard-ST also uses global and prefix distribution regularization. Therefore, this article supports "the full hard-ST training recipe is better than the unmodified official configuration," but cannot precisely attribute all gains to straight-through hard assignment alone.

In addition, the main matrix currently uses only seed2024, and all datasets come from Amazon categories. Cross-seed stability, replication on non-Amazon datasets, and causal validation of the Musical conditional-branch hypothesis remain future work.

## References

1. [Recommender Systems with Generative Retrieval](https://proceedings.neurips.cc/paper_files/paper/2023/hash/20dcab0f14046a5c6b02b61da9f13229-Abstract-Conference.html), NeurIPS 2023. The original paper for TIGER and the semantic-ID recommendation framework.
2. [Autoregressive Image Generation Using Residual Quantization](https://openaccess.thecvf.com/content/CVPR2022/html/Lee_Autoregressive_Image_Generation_Using_Residual_Quantization_CVPR_2022_paper.html), CVPR 2022. The original paper for RQ-VAE and residual-quantization generation.
3. [Sentence-T5: Scalable Sentence Encoders from Pre-trained Text-to-Text Models](https://aclanthology.org/2022.findings-acl.146/), Findings of ACL 2022. The source of the text-vector encoder used by TIGER.
4. [Amazon Review Data 2018](https://cseweb.ucsd.edu/~jmcauley/datasets/amazon_v2/index.html), UCSD McAuley Lab. The public data source for the five experimental categories in this article.

## Closing: Stop Asking "Is The Codebook Full?" And Ask "Why Should The Information Be Here?"

This set of experiments began like an engineering bug fix: why do 256 codewords collapse to only 1? By the end, it had become a more interesting research question: how should a hierarchical discrete representation allocate early routing, conditional unfolding, and terminal disambiguation so that it matches the prediction order and data structure of generative recommendation?

hard-ST provides a reliable training starting point; moderate front-loading provides a robust but non-universal default; Musical reminds us that total entropy, the unique-ID ratio, and the number of effective paths cannot replace inter-layer information structure. The next work worth doing is not building an even larger codebook, but using controlled experiments to determine: **which data structures need early splitting, which need late splitting, and from which layer the generative model's errors begin to amplify.**
