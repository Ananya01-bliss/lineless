import matplotlib.pyplot as plt
import numpy as np

# Data for 50 Students in University Food Court
# Scenario: 5 Counters (2 Payment, 3 Pickup)

# 1. Total Time to Get Food (Wait + Service)
# Traditional: FIFO only (Single Line or Random Lines)
# LineLess: Min-Heap (Always shortest queue) + Pre-ordering
students = np.arange(1, 51)
traditional_times = np.random.normal(25, 5, 50)  # Avg 25 mins, higher variance
traditional_times = np.sort(traditional_times)    # Sorted for visualization

lineless_times = np.random.normal(15, 2, 50)      # Avg 15 mins, lower variance (more consistent)
lineless_times = np.sort(lineless_times)

plt.figure(figsize=(10, 6))
plt.plot(students, traditional_times, label='Traditional FIFO (Manual Lines)', color='red', linestyle='--')
plt.plot(students, lineless_times, label='LineLess (Min-Heap Load Balancing)', color='green', linewidth=2)
plt.fill_between(students, traditional_times, lineless_times, color='green', alpha=0.1)
plt.title('Total Time to Get Food (50 Students)', fontsize=14)
plt.xlabel('Student ID (1-50)', fontsize=12)
plt.ylabel('Time (Minutes)', fontsize=12)
plt.legend()
plt.grid(True, alpha=0.3)
plt.annotate('Saved Time Zone', xy=(25, 20), xytext=(30, 10),
             arrowprops=dict(facecolor='black', shrink=0.05))
plt.savefig('time_reduction.png')
print("Generated time_reduction.png")

# 2. Counter Utilization (Load Balancing)
# Traditional: Students guess lines (some counters empty, others full)
# LineLess: Perfect distribution
counters = ['Pay 1', 'Pay 2', 'Pick 1', 'Pick 2', 'Pick 3']
traditional_load = [15, 35, 10, 30, 10]  # Uneven
lineless_load = [25, 25, 17, 16, 17]     # Balanced (50 total split evenly)

x = np.arange(len(counters))
width = 0.35

plt.figure(figsize=(10, 6))
plt.bar(x - width/2, traditional_load, width, label='Traditional (Uneven)', color='salmon')
plt.bar(x + width/2, lineless_load, width, label='LineLess (Balanced)', color='skyblue')

plt.title('Counter Utilization: Payment vs Pickup', fontsize=14)
plt.xticks(x, counters)
plt.ylabel('Students Served', fontsize=12)
plt.legend()
plt.grid(axis='y', alpha=0.3)
plt.savefig('load_balancing.png')
print("Generated load_balancing.png")

# 3. Average Wait Time Comparison
methods = ['Traditional FIFO', 'LineLess (Min-Heap)']
avg_times = [25, 15]

plt.figure(figsize=(8, 5))
bars = plt.bar(methods, avg_times, color=['red', 'green'], alpha=0.7)
plt.title('Average Wait Time per Student', fontsize=14)
plt.ylabel('Minutes', fontsize=12)
plt.ylim(0, 30)

# Add text on bars
for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., height,
             f'{height} min',
             ha='center', va='bottom', fontsize=12, fontweight='bold')

plt.savefig('avg_wait_comparison.png')
print("Generated avg_wait_comparison.png")
