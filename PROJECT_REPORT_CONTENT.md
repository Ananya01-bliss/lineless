# Project Report Content: Methodology & Algorithms

## Chapter 3: Methodology

### 3.1. Proposed Approach: Fairness-Preserving Adaptive Scheduling
The core methodology of the "LineLess" system is built upon the principle of **Fairness-Preserving Adaptive Scheduling**. Unlike traditional optimization algorithms that reorder tasks to minimize average wait time (often causing starvation for complex tasks), our approach prioritizes the strict First-Come, First-Served (FCFS) social contract while optimizing resource utilization through intelligent load balancing.

The system methodology operates on three synchronized phases:
1.  **Ingestion & State Tracking**: Customers enter the system via a unified interface. Their state is immediately tracked using constant-time access structures to ensure real-time updates.
2.  **Predictive Load Balancing**: Instead of routing customers based on static counter assignment, the system dynamically calculates the "Load" (Estimated Wait Time) of every active counter and assigns the next token to the least burdened resource.
3.  **Exception Management**: Real-world scenarios like "No-Shows" are handled via a flexible buffer system that allows re-insertion without disrupting the main queue flow.

**[Recommended Diagram: Figure 6: Comprehensive Multi-Queue System in DIAGRAMS.md]**
*This diagram effectively summarizes the entire methodology, mapping the user journey from "Customer Joins" to "Completed" and highlighting where each algorithm interacts with the flow.*

---

## Chapter 4: Data Structures and Algorithms

This project integrates six distinct data structures to optimize specific bottlenecks in the queuing process. Below is the detailed algorithmic breakdown for each component.

### 4.1. The Dual-Queue System (FIFO Queue)
**Role**: Maintains strict arrival order for standard and priority customers, ensuring fairness.

**Algorithm: Customer Join Process**
1.  **Input**: New Customer Request ($C_{new}$) with Priority Level ($P$).
2.  **Step 1**: Identify target queue based on $P$.
    *   IF $P == 'VIP'$ $\rightarrow$ Target = `PriorityQueue`.
    *   ELSE $\rightarrow$ Target = `NormalQueue`.
3.  **Step 2**: Create Token Node containing {Timestamp, ID, Status: 'Waiting'}.
4.  **Step 3**: `Enqueue` operation: Add Node to the **Tail** of the Target Queue ($O(1)$).
5.  **Step 4**: Map Token ID to Node reference in `HashMap` (See 4.4).
6.  **Output**: Confirmation Token # and Estimated Position.

**[Recommended Diagram: Figure 3: Customer Join Flow in DIAGRAMS.md]**

---

### 4.2. Min-Heap Load Balancer
**Role**: Instantly identifies the counter with the minimum workload to assign the next token. This ensures even distribution of work and prevents "fast lanes" vs "slow lanes."

**Algorithm: Token Assignment (Call Next)**
1.  **Input**: Staff Request "Call Next Customer".
2.  **Step 1**: Check `PriorityQueue`. IF not empty, `Dequeue` Head. ELSE, check `NormalQueue` and `Dequeue` Head.
3.  **Step 2**: Retrieve state of all $k$ counters from the **Min-Heap**.
    *   The **Root** of the Min-Heap always contains the Counter with the lowest `TotalEstimatedWait`.
4.  **Step 3**: `Extract-Min`: Remove the Root Counter ($C_{best}$) from the Heap ($O(\log k)$).
5.  **Step 4**: Assign the Token to $C_{best}$.
6.  **Step 5**: Update $C_{best}$'s Load: $Load_{new} = Load_{current} + 1$.
7.  **Step 6**: `Insert`: Place $C_{best}$ back into the Min-Heap. The Heap property automatically re-shuffles it to its correct position ($O(\log k)$).
8.  **Output**: Assigned Counter ID for the Token.

**[Recommended Diagram: Figure 4: Call Next Token Flow in DIAGRAMS.md]**

---

### 4.3. Sliding Window Estimator
**Role**: Provides accurate, adaptive wait time predictions by calculating the moving average of the last $N$ service durations.

**Algorithm: Dynamic Wait Time Calculation**
1.  **Input**: New Service Completion Time ($T_{service}$).
2.  **Step 1**: Add $T_{service}$ to the `Window` array.
3.  **Step 2**: IF `Window.size` > $N$ (Fixed Size e.g., 20), remove the oldest entry (Index 0).
4.  **Step 3**: Calculate Moving Average ($W_{avg}$):
    *   $W_{avg} = \frac{\sum_{i=0}^{N} Window[i]}{N}$
5.  **Step 4**: For a new customer at Position $K$, predict Wait Time:
    *   $T_{wait} = K \times W_{avg} \div ActiveCounters$
6.  **Output**: Displayed Estimated Wait Time.

---

### 4.4. HashMap State Manager
**Role**: Provides $O(1)$ constant-time access to any token's status, enabling instant updates and "seeking" without iterating through the queue.

**Algorithm: Status Lookup & Update**
1.  **Input**: Token ID ($ID_{target}$) and New Status ($S_{new}$).
2.  **Step 1**: Compute Hash Index for $ID_{target}$.
3.  **Step 2**: Direct Memory Access to Token Object ($O(1)$).
4.  **Step 3**: Update `Token.Status` = $S_{new}$ (e.g., 'Waiting' $\rightarrow$ 'Serving').
5.  **Step 4**: Trigger WebSocket Event to specific Client ID associated with Token.

---

### 4.5. Deque (Double-Ended Queue) for Exceptions
**Role**: Manages non-standard flows like "No-Shows" and "Recall".

**Algorithm A: Handling a No-Show (Skip)**
1.  **Input**: Current Token ($T$) not responding.
2.  **Step 1**: Remove $T$ from Active Slot.
3.  **Step 2**: `Push-Back`: Insert $T$ at the **Rear** of the `SkippedDeque`.
4.  **Step 3**: Mark Status as 'Skipped'.

**Algorithm B: Recalling a Customer**
1.  **Input**: Staff requests "Recall Skipped".
2.  **Step 1**: `Pop-Front` (or search specific ID): Remove $T$ from `SkippedDeque`.
3.  **Step 2**: `Push-Front`: Re-insert $T$ at the **Head** of the `PriorityQueue` (Immediate Service).
4.  **Output**: Token re-enters active flow with highest priority.

**[Recommended Diagram: Figure 2: DSA Component Architecture in DIAGRAMS.md]**
*Use the 'State Management' subgraph to illustrate the Deque and Hashmap interaction.*

---

## Chapter 5: Tools and Technologies Used

To achieve the project goals of scalability, real-time responsiveness, and modularity, the system is built using the **MEAN Stack** (MongoDB, Express.js, Angular, Node.js) augmented with WebSocket technology.

### 5.1. Frontend: Angular (v16+)
*   **Role:** Provides a dynamic, single-page application (SPA) experience for both customers and staff.
*   **Key Features:**
    *   **Component-Based Architecture:** Modularizes the UI into reusable blocks (e.g., `TokenCardComponent`, `QueueListComponent`).
    *   **Dependency Injection:** Efficiently manages services like `QueueService` and `WebSocketService`.
    *   **RxJS Observables:** Handles asynchronous data streams from the WebSocket server, ensuring the UI updates automatically without page reloads.

### 5.2. Backend: Node.js & Express.js
*   **Role:** The server-side runtime environment handling API requests and business logic.
*   **Key Features:**
    *   **Event-Driven, Non-Blocking I/O:** Ideal for handling concurrent connections in a real-time queuing system.
    *   **Express Router:** Organizes API endpoints (e.g., `/api/queue/join`, `/api/auth/login`) cleanly.
    *   **Middleware:** Implements security layers like `cors` and `jsonwebtoken` (JWT) for protected routes.

### 5.3. Real-Time Communication: Socket.IO
*   **Role:** Enables bidirectional, low-latency communication between the server and connected clients.
*   **Key Features:**
    *   **Broadcasting:** Automatically pushes updates (e.g., "Token #105 Called") to all subscribed clients (Staff Dashboard, Customer Mobile View).
    *   **Rooms/Namespaces:** Segregates traffic by `ServiceId` or `OrganizationId` to ensure data privacy in multi-tenant setups.

### 5.4. Database: MongoDB (NoSQL)
*   **Role:** Acts as the persistent storage layer for the application.
*   **Key Features:**
    *   **Flexible Schema:** Adapts easily to varying service configurations and token metadata.
    *   **High Write Throughput:** Capable of handling rapid bursts of new token creations during peak hours.
    *   **Aggregation Framework:** Used for generating complex analytics reports (e.g., Average Wait Time by Hour) on the historical dataset.
