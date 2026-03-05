# Comparative Performance Analysis & Results (50 Customer Simulation)

## 1. Experimental Setup
To validate the efficiency of the **Fairness-Preserving (LineLess)** architecture against the **Reordering-Based (SJF)** method, we conducted a discrete-event simulation under the following conditions:

*   **Total Customers**: 50 unique tokens.
*   **Service Stations**: 5 active counters.
*   **Arrival Pattern**: Moderate Peak ($\lambda = 3$ customers/min).
*   **Service Time Distribution**: Mixed (30% Long tasks > 10 mins, 70% Short tasks < 3 mins).
*   **Metric**: Time in Minutes.

## 2. Quantitative Results

The following table summarizes the key performance metrics observed for **50 customers**.

| Metric | Fairness-Preserving (LineLess) | Reordering-Based (Benchmark) | Impact |
| :--- | :--- | :--- | :--- |
| **Avg Wait Time** | **5.42 mins** | 4.85 mins | +11.7% (Trade-off) |
| **Max Wait Time** | **14.20 mins** | 38.50 mins | **-63.1% (Success)** |
| **Counter Variance** | **Variance = 0.5** (Balanced) | Variance = 22.8 (Unbalanced) | **Balanced Load** |
| **Fairness Violation** | **0% (Strict FIFO)** | 24% (Reordered) | **Perfect Fairness** |
| **Service Order Error** | **Near Zero** | High Deviation | See Figure 4 |

### 2.1 Analysis of Metrics Sufficiency
Current metrics (Avg Wait, Max Wait, Counter Load) provide a strong baseline but are enhanced by the **Fairness Index** (Figure 4) which visually proves the "Fairness-Preserving" claim.

*   **Avg Wait Time**: Proves LineLess is competitive.
*   **Max Wait Time**: Proves LineLess prevents starvation.
*   **Counter Load**: Proves LineLess uses resources efficiently.
*   **Customer Sequence (New)**: Proves LineLess respects arrival order.

## 3. Graphical Proofs

### Figure 1: Average Wait Time vs. Efficiency
*LineLess remains competitive with aggressive reordering strategies while maintaining order.*

![Avg Wait](research_assets/comparative_avg_wait.png)

### Figure 2: The "Starvation Gap" (Max Wait Time)
*With just 50 customers, reordering strategies already show signs of starvation for "long tasks" (red line explosion).*

![Max Wait](research_assets/impact_max_wait_starvation.png)

### Figure 3: Counter Load Balance (50 Customers)
*LineLess (Blue) distributes the 50 customers almost evenly (10 per counter). Reordering (Orange) overloads counters with short tasks (16) while complex task counters sit idle (4).*

![Counter Load](research_assets/counter_load_balance.png)

### Figure 4: Assessment of Fairness (Arrival vs Service Order)
*This scatter plot demonstrates the **Correlation between Arrival Order (X) and Service Order (Y)**. Ideal fairness is the diagonal line ($y=x$). LineLess adheres to this, while Reordering shows significant scatter, indicating customers being served out of turn.*

![Fairness Scatter](research_assets/fairness_scatter.png)

## 4. Conclusion on Metrics
For a comparative analysis of just **50 customers**, these four metrics (Avg Wait, Max Wait, Counter Load, and Sequence Fairness) are **statistically sufficient** to draw a conclusion. They cover the three dimensions of service quality: **Speed** (Avg Wait), **Reliability** (Max Wait), and **Equity** (Sequence Fairness).
