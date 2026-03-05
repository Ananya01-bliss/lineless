import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ServiceService } from '../services/service.service';
import { OrganizationService } from '../services/organization.service';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import Chart from 'chart.js/auto';

@Component({
    selector: 'app-analytics',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
    styles: [`
        /* ── Layout ───────────────────────────────────── */
        .layout { display: flex; min-height: 100vh; background: #f1f5f9; }
        .content { flex: 1; transition: margin-left 0.25s; padding: 2rem 2.5rem; box-sizing: border-box; }
        .page-wrap { max-width: 1400px; margin: 0 auto; }

        /* ── Page header ──────────────────────────────── */
        .page-head {
            display: flex; align-items: flex-start; justify-content: space-between;
            margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
        }
        .page-head h1 { margin: 0; font-size: 2rem; font-weight: 800; color: #1e293b; }
        .page-head p  { margin: 0.25rem 0 0; color: #64748b; font-size: 0.95rem; }

        /* PDF button */
        .btn-pdf {
            display: flex; align-items: center; gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white; border: none; border-radius: 10px;
            font-size: 0.9rem; font-weight: 700; cursor: pointer;
            transition: all 0.2s; box-shadow: 0 4px 12px rgba(99,102,241,0.3);
            flex-shrink: 0;
        }
        .btn-pdf:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(99,102,241,0.4); }
        .btn-pdf:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* ── Controls bar ─────────────────────────────── */
        .controls-bar {
            background: white; padding: 1.25rem 1.75rem;
            border-radius: 16px; border: 1px solid #e2e8f0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            display: flex; gap: 1.25rem; align-items: flex-end;
            margin-bottom: 2rem; flex-wrap: wrap;
        }
        .form-group { flex: 1; min-width: 180px; }
        .form-group label {
            display: block; margin-bottom: 0.5rem;
            font-size: 0.78rem; font-weight: 700; color: #475569;
            text-transform: uppercase; letter-spacing: 0.06em;
        }
        select {
            width: 100%; padding: 0.7rem 1rem;
            border: 1.5px solid #e2e8f0; border-radius: 10px;
            background: white; font-size: 0.95rem; color: #1e293b;
            transition: border-color 0.2s; cursor: pointer;
        }
        select:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .btn-refresh {
            padding: 0.7rem 1.5rem; background: #6366f1; color: white;
            border: none; border-radius: 10px; font-weight: 700; cursor: pointer;
            transition: all 0.2s; white-space: nowrap;
        }
        .btn-refresh:hover { background: #4f46e5; }
        .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── KPI Cards ────────────────────────────────── */
        .kpi-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.25rem; margin-bottom: 2rem;
        }
        .kpi-card {
            background: white; border-radius: 16px; padding: 1.5rem;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            display: flex; align-items: center; gap: 1.1rem;
            transition: box-shadow 0.2s;
        }
        .kpi-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .kpi-icon {
            width: 52px; height: 52px; border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.5rem; flex-shrink: 0;
        }
        .kpi-val { font-size: 1.85rem; font-weight: 800; line-height: 1; color: #1e293b; }
        .kpi-lbl { font-size: 0.78rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 3px; }

        /* ── Chart cards (full width stack) ──────────── */
        .charts-stack { display: flex; flex-direction: column; gap: 2rem; }

        .chart-card {
            background: white; border-radius: 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            overflow: hidden;
        }
        .chart-card-header {
            padding: 1.25rem 1.75rem;
            border-bottom: 1px solid #f1f5f9;
            display: flex; justify-content: space-between; align-items: center;
        }
        .chart-card-title {
            font-size: 1.05rem; font-weight: 800; color: #1e293b;
            display: flex; align-items: center; gap: 0.6rem;
        }
        .chart-card-badge {
            font-size: 0.7rem; font-weight: 700; padding: 3px 9px;
            border-radius: 99px; background: #ede9fe; color: #6d28d9;
        }
        .chart-canvas-wrap {
            padding: 1.5rem 1.75rem 1rem;
            height: 360px; /* tall enough to read without zoom */
            position: relative;
        }
        .chart-canvas-wrap canvas { width: 100% !important; height: 100% !important; }

        /* Description strip */
        .chart-desc {
            padding: 0.9rem 1.75rem 1.2rem;
            background: #f8fafc;
            border-top: 1px solid #f1f5f9;
        }
        .chart-desc-text {
            font-size: 0.82rem; color: #64748b; line-height: 1.6;
        }
        .chart-desc-text strong { color: #475569; }

        /* Heatmap ─────────────────────────────── */
        .heatmap-wrap { padding: 1.5rem 1.75rem 1rem; overflow-x: auto; }
        .heatmap-header-row { display: flex; gap: 3px; margin-left: 52px; margin-bottom: 6px; }
        .hm-h-cell { width: 34px; text-align: center; font-size: 0.65rem; color: #94a3b8; font-weight: 600; }
        .heatmap-row { display: flex; gap: 3px; margin-bottom: 3px; align-items: center; }
        .hm-label { width: 46px; font-size: 0.78rem; font-weight: 600; color: #64748b; text-align: right; padding-right: 6px; }
        .hm-cell {
            width: 34px; height: 34px; border-radius: 6px;
            background: #f1f5f9; cursor: pointer;
            transition: transform 0.15s;
            position: relative;
        }
        .hm-cell:hover { transform: scale(1.25); z-index: 10; }
        .hm-cell:hover::after {
            content: attr(data-tip);
            position: absolute; bottom: 120%; left: 50%;
            transform: translateX(-50%);
            background: #1e293b; color: white;
            padding: 4px 8px; border-radius: 6px;
            font-size: 0.7rem; white-space: nowrap; pointer-events: none; z-index: 20;
        }
        .hm-legend { display: flex; align-items: center; gap: 6px; margin-top: 1rem; margin-left: 52px; }
        .hm-legend span { font-size: 0.72rem; color: #64748b; }
        .hm-swatch { width: 16px; height: 16px; border-radius: 4px; display: inline-block; }

        /* ── States ───────────────────────────────────── */
        .spinner-wrap { padding: 5rem; text-align: center; color: #64748b; }
        .spinner {
            width: 44px; height: 44px; border: 4px solid #e2e8f0;
            border-top-color: #6366f1; border-radius: 50%;
            animation: spin 0.8s linear infinite; margin: 0 auto 1.25rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty-card {
            text-align: center; padding: 5rem 2rem;
            background: white; border-radius: 20px;
            border: 2px dashed #e2e8f0; color: #94a3b8;
        }
        .empty-card h3 { color: #475569; margin: 0.75rem 0 0.35rem; }

        @media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .kpi-row { grid-template-columns: 1fr; } }
    `],
    template: `
        <div class="layout">
            <app-sidebar (collapseChange)="isSidebarCollapsed = $event"></app-sidebar>

            <main class="content" [style.marginLeft.px]="isSidebarCollapsed ? 72 : 240">
                <div class="page-wrap">

                    <!-- ── Page Header ───────────────────── -->
                    <div class="page-head">
                        <div>
                            <h1>📈 Analytics Dashboard</h1>
                            <p>Comprehensive insights into queue performance and service efficiency.</p>
                        </div>
                        <button class="btn-pdf" (click)="downloadPDF()" [disabled]="!stats || loading">
                            ⬇️ Export PDF Report
                        </button>
                    </div>

                    <!-- ── Controls ──────────────────────── -->
                    <div class="controls-bar">
                        <div class="form-group">
                            <label>Organization</label>
                            <select [(ngModel)]="selectedOrgId" (change)="loadServices()">
                                <option value="" disabled>Select Organization</option>
                                <option *ngFor="let org of organizations" [value]="org._id">{{ org.name }}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Service</label>
                            <select [(ngModel)]="selectedServiceId" (change)="loadStats()" [disabled]="!selectedOrgId">
                                <option value="" disabled>Select Service to Analyze</option>
                                <option *ngFor="let s of services" [value]="s._id">{{ s.name }}</option>
                            </select>
                        </div>
                        <button class="btn-refresh" (click)="loadStats()" [disabled]="!selectedServiceId">
                            🔄 Refresh
                        </button>
                    </div>

                    <!-- ── Loading ───────────────────────── -->
                    <div *ngIf="loading" class="spinner-wrap">
                        <div class="spinner"></div>
                        <p>Crunching numbers…</p>
                    </div>

                    <!-- ── Content ───────────────────────── -->
                    <div *ngIf="stats && !loading">

                        <!-- KPI Cards -->
                        <div class="kpi-row">
                            <div class="kpi-card">
                                <div class="kpi-icon" style="background:#ede9fe;">📈</div>
                                <div>
                                    <div class="kpi-val">{{ stats.totalTokens || 0 }}</div>
                                    <div class="kpi-lbl">Total Served</div>
                                </div>
                            </div>
                            <div class="kpi-card">
                                <div class="kpi-icon" style="background:#dcfce7;">⏱️</div>
                                <div>
                                    <div class="kpi-val" style="color:#10b981;">{{ formatTime(stats.avgWaitTime) }}</div>
                                    <div class="kpi-lbl">Avg Wait Time</div>
                                </div>
                            </div>
                            <div class="kpi-card">
                                <div class="kpi-icon" style="background:#fee2e2;">🐢</div>
                                <div>
                                    <div class="kpi-val" style="color:#ef4444;">{{ formatTime(stats.maxWaitTime) }}</div>
                                    <div class="kpi-lbl">Peak Wait Time</div>
                                </div>
                            </div>
                            <div class="kpi-card">
                                <div class="kpi-icon" style="background:#e0f2fe;">⚡</div>
                                <div>
                                    <div class="kpi-val" style="color:#6366f1;">{{ getThroughput() }}</div>
                                    <div class="kpi-lbl">Throughput</div>
                                </div>
                            </div>
                        </div>

                        <!-- Charts (full-width stacked) -->
                        <div class="charts-stack">

                            <!-- 1. Avg Wait Time -->
                            <div class="chart-card">
                                <div class="chart-card-header">
                                    <div class="chart-card-title">
                                        ⏱ Average Waiting Time per Hour
                                    </div>
                                    <span class="chart-card-badge">Hourly Avg</span>
                                </div>
                                <div class="chart-canvas-wrap">
                                    <canvas #avgWaitChart></canvas>
                                </div>
                                <div class="chart-desc">
                                    <div class="chart-desc-text">
                                        <strong>Analysis:</strong>
                                        Across all 24 hours, the <strong>peak average wait</strong> occurs at
                                        <strong>{{ peakWaitHour() }}:00</strong> with
                                        <strong>{{ formatTime(peakWaitValue()) }}</strong> average wait.
                                        The <strong>overall average</strong> across the day is
                                        <strong>{{ formatTime(stats.avgWaitTime) }}</strong>.
                                        {{ peakWaitValue() > (stats.avgWaitTime * 1.5) ?
                                            'The peak hour is significantly above average — consider adding counters or staff during this hour.' :
                                            'Wait times are relatively consistent throughout the day — good queue balance.' }}
                                    </div>
                                </div>
                            </div>

                            <!-- 2. Peak Load -->
                            <div class="chart-card">
                                <div class="chart-card-header">
                                    <div class="chart-card-title">
                                        📊 Peak Load &amp; Burst Traffic
                                    </div>
                                    <span class="chart-card-badge" style="background:#fee2e2;color:#ef4444;">LIVE INFLOW</span>
                                </div>
                                <div class="chart-canvas-wrap">
                                    <canvas #peakLoadChart></canvas>
                                </div>
                                <div class="chart-desc">
                                    <div class="chart-desc-text">
                                        <strong>Analysis:</strong>
                                        Peak customer inflow occurs at <strong>{{ peakArrivalHour() }}:00</strong>
                                        with <strong>{{ peakArrivalCount() }} arrivals</strong> in that hour.
                                        Total arrivals recorded: <strong>{{ totalArrivals() }}</strong>.
                                        {{ peakArrivalCount() > 10 ?
                                            'A significant burst was detected at this hour — pre-positioning staff or enabling overflow counters would prevent queuing backlogs.' :
                                            'Inflow is moderate with no extreme bursts detected.' }}
                                    </div>
                                </div>
                            </div>

                            <!-- 3. Counter Utilization -->
                            <div class="chart-card">
                                <div class="chart-card-header">
                                    <div class="chart-card-title">
                                        🖥️ Counter Utilization Breakdown
                                    </div>
                                    <span class="chart-card-badge" style="background:#fef3c7;color:#d97706;">Busy vs Idle</span>
                                </div>
                                <div class="chart-canvas-wrap">
                                    <canvas #utilizationChart></canvas>
                                </div>
                                <div class="chart-desc">
                                    <div class="chart-desc-text">
                                        <strong>Analysis:</strong>
                                        <strong>{{ busiestCounter() }}</strong> is the most-utilised counter.
                                        <strong>{{ idlestCounter() }}</strong> has the highest idle time.
                                        Counters spending more than 85% of time busy are at risk of burnout and longer queues;
                                        those below 30% busy could absorb additional tokens or be temporarily closed to reduce cost.
                                        Re-balancing token routing between counters is recommended.
                                    </div>
                                </div>
                            </div>

                            <!-- 4. Token Throughput -->
                            <div class="chart-card">
                                <div class="chart-card-header">
                                    <div class="chart-card-title">
                                        🎫 Token Throughput — Served vs Arrivals
                                    </div>
                                    <span class="chart-card-badge" style="background:#e0f2fe;color:#0284c7;">Combo</span>
                                </div>
                                <div class="chart-canvas-wrap">
                                    <canvas #throughputChart></canvas>
                                </div>
                                <div class="chart-desc">
                                    <div class="chart-desc-text">
                                        <strong>Analysis:</strong>
                                        In total, <strong>{{ stats.totalTokens || 0 }} tokens</strong> were served.
                                        {{ throughputGapHour() !== -1 ?
                                            'At ' + throughputGapHour() + ':00, arrivals outpaced served tokens — meaning the queue grew during this hour and customers experienced longer waits.' :
                                            'Served tokens kept pace with arrivals throughout the day — efficient throughput maintained.' }}
                                        Monitor hours where the pink line climbs above the purple bars as these are your bottleneck windows.
                                    </div>
                                </div>
                            </div>

                            <!-- 5. Max Wait Trend -->
                            <div class="chart-card">
                                <div class="chart-card-header">
                                    <div class="chart-card-title">
                                        🔴 Maximum Waiting Time Trend
                                    </div>
                                    <div style="font-size:1.1rem;font-weight:800;color:#ef4444;">
                                        {{ formatTime(stats.maxWaitTime) }} Peak
                                    </div>
                                </div>
                                <div class="chart-canvas-wrap">
                                    <canvas #maxWaitChart></canvas>
                                </div>
                                <div class="chart-desc">
                                    <div class="chart-desc-text">
                                        <strong>Analysis:</strong>
                                        The single longest wait recorded was <strong>{{ formatTime(stats.maxWaitTime) }}</strong>.
                                        The worst hour for maximum wait was <strong>{{ peakMaxWaitHour() }}:00</strong>
                                        with a peak of <strong>{{ formatTime(peakMaxWaitValue()) }}</strong>.
                                        {{ peakMaxWaitValue() > 600 ?
                                            'Waits exceeding 10 minutes were recorded — this likely caused customer dissatisfaction. SLA alerts should be triggered when individual wait exceeds an acceptable threshold.' :
                                            'Maximum waits are within acceptable limits. Continue monitoring for any sudden spikes.' }}
                                    </div>
                                </div>
                            </div>

                            <!-- 6. Heatmap -->
                            <div class="chart-card">
                                <div class="chart-card-header">
                                    <div class="chart-card-title">
                                        🌡️ Time-of-Day Traffic Heatmap
                                    </div>
                                    <span class="chart-card-badge">Day × Hour</span>
                                </div>
                                <div class="heatmap-wrap">
                                    <!-- Hour axis -->
                                    <div class="heatmap-header-row">
                                        <div class="hm-h-cell" *ngFor="let h of hours">{{ h }}</div>
                                    </div>
                                    <!-- Rows per day -->
                                    <div class="heatmap-row" *ngFor="let day of days; let d = index">
                                        <div class="hm-label">{{ day }}</div>
                                        <div class="hm-cell"
                                             *ngFor="let h of hours; let hIdx = index"
                                             [style.backgroundColor]="getHeatmapColor(d, hIdx)"
                                             [attr.data-tip]="getHeatmapTooltip(d, hIdx)">
                                        </div>
                                    </div>
                                    <!-- Legend -->
                                    <div class="hm-legend">
                                        <span>Low</span>
                                        <span class="hm-swatch" style="background:#f1f5f9;border:1px solid #e2e8f0;"></span>
                                        <span class="hm-swatch" style="background:#c7d2fe;"></span>
                                        <span class="hm-swatch" style="background:#818cf8;"></span>
                                        <span class="hm-swatch" style="background:#6366f1;"></span>
                                        <span class="hm-swatch" style="background:#4338ca;"></span>
                                        <span>High</span>
                                    </div>
                                </div>
                                <div class="chart-desc">
                                    <div class="chart-desc-text">
                                        <strong>Analysis:</strong>
                                        The busiest recorded time slot is
                                        <strong>{{ heatmapBusiestSlot() }}</strong>
                                        with <strong>{{ heatmapBusiestCount() }} tokens</strong>.
                                        Cells coloured dark purple indicate the highest traffic windows —
                                        these are optimal slots for increasing counter capacity, enabling priority lanes,
                                        or sending customer waiting-time alerts proactively.
                                        Off-peak slots (white/light blue) may be suitable for counter maintenance or staff breaks.
                                    </div>
                                </div>
                            </div>

                        </div><!-- end charts-stack -->

                    </div><!-- end stats block -->

                    <!-- Empty state -->
                    <div *ngIf="!selectedServiceId && !loading" class="empty-card">
                        <div style="font-size:3.5rem;">🔭</div>
                        <h3>Choose a Data Source</h3>
                        <p>Select an organisation and service above to view analytics.</p>
                    </div>

                </div><!-- page-wrap -->
            </main>
        </div>
    `
})
export class AnalyticsComponent implements OnInit {
    @ViewChild('avgWaitChart') avgWaitChartRef!: ElementRef;
    @ViewChild('peakLoadChart') peakLoadChartRef!: ElementRef;
    @ViewChild('utilizationChart') utilizationChartRef!: ElementRef;
    @ViewChild('throughputChart') throughputChartRef!: ElementRef;
    @ViewChild('maxWaitChart') maxWaitChartRef!: ElementRef;

    organizations: any[] = [];
    services: any[] = [];
    selectedOrgId = '';
    selectedServiceId = '';
    stats: any = null;
    loading = false;
    isSidebarCollapsed = false;

    charts: any[] = [];

    days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    hours = Array.from({ length: 24 }, (_, i) => i);

    constructor(
        private orgService: OrganizationService,
        private serviceService: ServiceService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() { this.loadOrganizations(); }

    loadOrganizations() {
        this.loading = true;
        this.orgService.getOrganizations().subscribe({
            next: (res) => {
                if (res.success && Array.isArray(res.data)) {
                    this.organizations = res.data;
                    if (this.organizations.length > 0) {
                        this.selectedOrgId = this.organizations[0]._id;
                        this.loadServices();
                    }
                }
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    loadServices() {
        if (!this.selectedOrgId) return;
        this.serviceService.getServicesByOrganization(this.selectedOrgId).subscribe({
            next: (res) => {
                if (res.success && Array.isArray(res.data)) this.services = res.data;
            }
        });
    }

    loadStats() {
        if (!this.selectedServiceId) return;
        this.loading = true;
        this.stats = null;
        this.destroyCharts();
        this.serviceService.getServiceStats(this.selectedServiceId).subscribe({
            next: (res) => {
                if (res.success) {
                    this.stats = res.data;
                    this.loading = false;
                    this.cdr.detectChanges();
                    setTimeout(() => this.initCharts(), 0);
                } else this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    destroyCharts() {
        this.charts.forEach(c => c.destroy());
        this.charts = [];
    }

    initCharts() {
        if (!this.stats) return;
        const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        const base = { responsive: true, maintainAspectRatio: false };
        const gridColor = 'rgba(0,0,0,0.04)';

        const axisStyle = {
            grid: { color: gridColor },
            ticks: { font: { size: 11 }, color: '#94a3b8' }
        };

        // 1. Avg Wait Time (vertical bar — easier to read hourly)
        if (this.avgWaitChartRef) {
            this.charts.push(new Chart(this.avgWaitChartRef.nativeElement, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Avg Wait (sec)',
                        data: this.stats.hourlyWaitTimes || [],
                        backgroundColor: 'rgba(16,185,129,0.7)',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: {
                    ...base,
                    plugins: { legend: { display: false } },
                    scales: { x: axisStyle, y: { ...axisStyle, beginAtZero: true } }
                }
            }));
        }

        // 2. Peak Load (filled area)
        if (this.peakLoadChartRef) {
            this.charts.push(new Chart(this.peakLoadChartRef.nativeElement, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Arrivals',
                        data: this.stats.hourlyArrivals || [],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99,102,241,0.15)',
                        fill: true, tension: 0.4, pointRadius: 3,
                        pointBackgroundColor: '#6366f1'
                    }]
                },
                options: {
                    ...base,
                    plugins: { legend: { display: false } },
                    scales: { x: axisStyle, y: { ...axisStyle, beginAtZero: true } }
                }
            }));
        }

        // 3. Counter Utilization (horizontal stacked)
        if (this.utilizationChartRef && this.stats.counterStats) {
            const cIds = Object.keys(this.stats.counterStats);
            const cLabels = cIds.map(id => this.stats.counterStats[id].name || `Counter ${id.slice(-4).toUpperCase()}`);
            const busy = cIds.map(id => this.stats.counterStats[id].utilization);
            const idle = busy.map(u => 100 - u);
            this.charts.push(new Chart(this.utilizationChartRef.nativeElement, {
                type: 'bar',
                data: {
                    labels: cLabels,
                    datasets: [
                        { label: 'Busy %', data: busy, backgroundColor: '#f59e0b', borderRadius: 4 },
                        { label: 'Idle %', data: idle, backgroundColor: '#e2e8f0', borderRadius: 4 }
                    ]
                },
                options: {
                    ...base,
                    indexAxis: 'y' as const,
                    plugins: { legend: { position: 'bottom' as const } },
                    scales: {
                        x: { stacked: true, max: 100, ...axisStyle },
                        y: { stacked: true, ...axisStyle }
                    }
                }
            }));
        }

        // 4. Throughput combo
        if (this.throughputChartRef) {
            this.charts.push(new Chart(this.throughputChartRef.nativeElement, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            type: 'bar' as const,
                            label: 'Served',
                            data: this.stats.hourlyServed || [],
                            backgroundColor: 'rgba(99,102,241,0.7)',
                            borderRadius: 4
                        },
                        {
                            type: 'line' as const,
                            label: 'Arrivals',
                            data: this.stats.hourlyArrivals || [],
                            borderColor: '#ec4899',
                            backgroundColor: 'transparent',
                            tension: 0.4, pointRadius: 3,
                            pointBackgroundColor: '#ec4899'
                        }
                    ]
                },
                options: {
                    ...base,
                    plugins: { legend: { position: 'bottom' as const } },
                    scales: { x: axisStyle, y: { ...axisStyle, beginAtZero: true } }
                }
            }));
        }

        // 5. Max Wait (line)
        if (this.maxWaitChartRef) {
            this.charts.push(new Chart(this.maxWaitChartRef.nativeElement, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Max Wait (sec)',
                        data: this.stats.hourlyMaxWait || [],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        fill: true, tension: 0.3, pointRadius: 3,
                        pointBackgroundColor: '#ef4444'
                    }]
                },
                options: {
                    ...base,
                    plugins: { legend: { display: false } },
                    scales: { x: axisStyle, y: { ...axisStyle, beginAtZero: true } }
                }
            }));
        }
    }

    /* ── Heatmap helpers ──────────────────────── */
    getHeatmapColor(day: number, hour: number): string {
        const v = this.stats?.trafficHeatmap?.[day]?.[hour] || 0;
        if (v === 0) return '#f1f5f9';
        if (v < 5) return '#c7d2fe';
        if (v < 10) return '#818cf8';
        if (v < 20) return '#6366f1';
        return '#4338ca';
    }

    getHeatmapTooltip(day: number, hour: number): string {
        const v = this.stats?.trafficHeatmap?.[day]?.[hour] || 0;
        return `${this.days[day]} ${hour}:00 — ${v} token${v !== 1 ? 's' : ''}`;
    }

    /* ── Data insight helpers ─────────────────── */
    private safeMax(arr: number[]): number {
        if (!arr || arr.length === 0) return 0;
        return Math.max(...arr.filter(v => v != null));
    }
    private safeArgMax(arr: number[]): number {
        if (!arr || arr.length === 0) return 0;
        const max = this.safeMax(arr);
        return arr.indexOf(max);
    }

    peakWaitHour(): number { return this.safeArgMax(this.stats?.hourlyWaitTimes || []); }
    peakWaitValue(): number { return this.safeMax(this.stats?.hourlyWaitTimes || []); }

    peakArrivalHour(): number { return this.safeArgMax(this.stats?.hourlyArrivals || []); }
    peakArrivalCount(): number { return this.safeMax(this.stats?.hourlyArrivals || []); }
    totalArrivals(): number {
        return (this.stats?.hourlyArrivals || []).reduce((a: number, b: number) => a + (b || 0), 0);
    }

    busiestCounter(): string {
        if (!this.stats?.counterStats) return 'N/A';
        const ids = Object.keys(this.stats.counterStats);
        if (!ids.length) return 'N/A';
        const top = ids.reduce((a, b) =>
            (this.stats.counterStats[a].utilization || 0) >= (this.stats.counterStats[b].utilization || 0) ? a : b);
        const c = this.stats.counterStats[top];
        return `${c.name || 'Counter'} (${Math.round(c.utilization || 0)}% busy)`;
    }

    idlestCounter(): string {
        if (!this.stats?.counterStats) return 'N/A';
        const ids = Object.keys(this.stats.counterStats);
        if (!ids.length) return 'N/A';
        const bot = ids.reduce((a, b) =>
            (this.stats.counterStats[a].utilization || 0) <= (this.stats.counterStats[b].utilization || 0) ? a : b);
        const c = this.stats.counterStats[bot];
        return `${c.name || 'Counter'} (${Math.round(100 - (c.utilization || 0))}% idle)`;
    }

    throughputGapHour(): number {
        const arrivals = this.stats?.hourlyArrivals || [];
        const served = this.stats?.hourlyServed || [];
        for (let i = 0; i < arrivals.length; i++) {
            if ((arrivals[i] || 0) > (served[i] || 0)) return i;
        }
        return -1;
    }

    peakMaxWaitHour(): number { return this.safeArgMax(this.stats?.hourlyMaxWait || []); }
    peakMaxWaitValue(): number { return this.safeMax(this.stats?.hourlyMaxWait || []); }

    heatmapBusiestSlot(): string {
        const hm = this.stats?.trafficHeatmap;
        if (!hm) return 'N/A';
        let maxV = 0; let bestD = 0; let bestH = 0;
        for (let d = 0; d < hm.length; d++) {
            for (let h = 0; h < (hm[d] || []).length; h++) {
                if ((hm[d][h] || 0) > maxV) { maxV = hm[d][h]; bestD = d; bestH = h; }
            }
        }
        return `${this.days[bestD]} at ${bestH}:00`;
    }
    heatmapBusiestCount(): number {
        const hm = this.stats?.trafficHeatmap;
        if (!hm) return 0;
        return Math.max(...hm.flatMap((row: any) => row || []).filter((v: any) => v != null));
    }

    /* ── Formatters ───────────────────────────── */
    formatTime(value: any): string {
        if (!value) return '0m';
        const n = Number(value);
        if (n < 60) return n + 's';
        return Math.round(n / 60) + 'm';
    }

    getThroughput(): string {
        if (!this.stats) return '0/hr';
        return this.stats.totalTokens + ' total';
    }

    /* ── PDF Export ───────────────────────────── */
    downloadPDF() {
        // Build a printable window with all chart images + descriptions
        const chartDescriptions = [
            { title: 'Average Waiting Time per Hour', desc: `Peak wait occurs at ${this.peakWaitHour()}:00 (${this.formatTime(this.peakWaitValue())}). Overall avg is ${this.formatTime(this.stats.avgWaitTime)}.` },
            { title: 'Peak Load & Burst Traffic', desc: `Inflow peaks at ${this.peakArrivalHour()}:00 with ${this.peakArrivalCount()} arrivals. Total arrivals recorded: ${this.totalArrivals()}.` },
            { title: 'Counter Utilization', desc: `${this.busiestCounter()} is the busiest, while ${this.idlestCounter()} has the most idle time.` },
            { title: 'Token Throughput', desc: `Total ${this.stats.totalTokens} tokens served. ${this.throughputGapHour() !== -1 ? 'Congestion detected at ' + this.throughputGapHour() + ':00.' : 'Served tokens kept pace with arrivals.'}` },
            { title: 'Maximum Waiting Time Trend', desc: `Longest single wait: ${this.formatTime(this.stats.maxWaitTime)}. Peak max wait was at ${this.peakMaxWaitHour()}:00.` },
            { title: 'Time-of-Day Traffic Heatmap', desc: `Busiest recorded slot: ${this.heatmapBusiestSlot()} with ${this.heatmapBusiestCount()} arrivals.` }
        ];

        const statsHtml = this.stats ? `
            <div class="kpi-row">
                <div class="kpi"><strong>${this.stats.totalTokens || 0}</strong><br>Total Served</div>
                <div class="kpi"><strong>${this.formatTime(this.stats.avgWaitTime)}</strong><br>Avg Wait</div>
                <div class="kpi"><strong>${this.formatTime(this.stats.maxWaitTime)}</strong><br>Peak Wait</div>
                <div class="kpi"><strong>${this.getThroughput()}</strong><br>Throughput</div>
            </div>` : '';

        // Capture chart canvas images
        const canvasEls = [
            this.avgWaitChartRef?.nativeElement,
            this.peakLoadChartRef?.nativeElement,
            this.utilizationChartRef?.nativeElement,
            this.throughputChartRef?.nativeElement,
            this.maxWaitChartRef?.nativeElement
        ];

        let chartsHtml = '';
        canvasEls.forEach((canvas, i) => {
            if (canvas) {
                const img = canvas.toDataURL('image/png');
                const d = chartDescriptions[i];
                chartsHtml += `
                    <div class="chart-block">
                        <h3>${i + 1}. ${d.title}</h3>
                        <img src="${img}" style="width:100%;border-radius:8px;"/>
                        <p class="desc">📌 ${d.desc}</p>
                    </div>`;
            }
        });

        // Heatmap description (no canvas)
        const hm = chartDescriptions[5];
        chartsHtml += `<div class="chart-block"><h3>6. ${hm.title}</h3><p class="desc">📌 ${hm.desc}</p></div>`;

        const html = `
        <!DOCTYPE html><html><head><title>Analytics Report — LineLess</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 2rem; color: #1e293b; }
            h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
            .subtitle { color: #64748b; margin-bottom: 2rem; }
            .kpi-row { display: flex; gap: 1rem; margin: 1.5rem 0; }
            .kpi { flex: 1; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center; font-size: 1.2rem; }
            .kpi strong { font-size: 1.75rem; display: block; }
            .chart-block { margin-bottom: 2.5rem; page-break-inside: avoid; }
            .chart-block h3 { font-size: 1rem; color: #334155; margin-bottom: 0.5rem; border-left: 4px solid #6366f1; padding-left: 0.5rem; }
            .desc { background: #f8fafc; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.85rem; color: #64748b; margin-top: 0.5rem; }
            @media print { body { margin: 0; } }
        </style></head><body>
        <h1>📈 LineLess Analytics Report</h1>
        <div class="subtitle">Generated: ${new Date().toLocaleString('en-IN')}</div>
        ${statsHtml}
        ${chartsHtml}
        </body></html>`;

        const w = window.open('', '_blank');
        if (w) {
            w.document.write(html);
            w.document.close();
            setTimeout(() => w.print(), 800);
        }
    }
}
