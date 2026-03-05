import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { QueueService } from '../services/queue.service';
import { ServiceService } from '../services/service.service';
import { ApiConfigService } from '../services/api-config.service';
import { interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-queue-display',
    standalone: true,
    imports: [CommonModule, RouterModule],
    styles: [`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;600;800;900&family=Space+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .display-root {
            height: 100vh; display: flex; flex-direction: column;
            background: #0a0a0f; color: #fff;
            font-family: 'Inter', sans-serif; overflow: hidden;
        }

        /* ── BACKGROUND ─────────────────────────────────────── */
        .bg {
            position: fixed; inset: 0; z-index: 0; pointer-events: none;
            background:
                radial-gradient(ellipse 80% 60% at 0% 0%, rgba(79, 70, 229, 0.15) 0%, transparent 60%),
                radial-gradient(ellipse 60% 80% at 100% 100%, rgba(16, 185, 129, 0.1) 0%, transparent 60%),
                radial-gradient(ellipse 50% 50% at 50% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 70%);
        }
        .grid-lines {
            position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.03;
            background-image:
                linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px);
            background-size: 60px 60px;
        }

        /* ── HEADER ─────────────────────────────────────────── */
        .header {
            z-index: 100; padding: 1rem 2.5rem;
            display: flex; justify-content: space-between; align-items: center;
            background: rgba(10, 10, 15, 0.8); backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .brand { display: flex; align-items: center; gap: 1rem; }
        .brand-logo { 
            width: 44px; height: 44px; border-radius: 12px;
            background: linear-gradient(135deg, #4f46e5, #06b6d4);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.3rem; box-shadow: 0 0 20px rgba(79,70,229,0.4);
        }
        .brand-text h1 { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.5px; }
        .brand-text p { font-size: 0.75rem; color: #64748b; font-weight: 500; }

        .header-right { display: flex; align-items: center; gap: 2rem; }

        .stats-bar { display: flex; align-items: center; gap: 1.5rem; }
        .stat-pill { 
            display: flex; align-items: center; gap: 0.5rem; 
            padding: 0.5rem 1rem; background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.07); border-radius: 100px;
        }
        .stat-dot { width: 8px; height: 8px; border-radius: 50%; }
        .stat-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 1px; color: #64748b; text-transform: uppercase; }
        .stat-val { font-size: 0.9rem; font-weight: 800; }

        .live-badge { 
            display: flex; align-items: center; gap: 0.5rem;
            padding: 0.5rem 1rem; background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 100px;
        }
        .live-pulse { 
            width: 8px; height: 8px; border-radius: 50%; background: #10b981;
            animation: livePulse 1.5s ease-in-out infinite;
        }
        @keyframes livePulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
            50% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
        }
        .live-text { font-size: 0.8rem; font-weight: 700; color: #10b981; letter-spacing: 1px; }

        .clock { font-family: 'Space Mono', monospace; text-align: right; }
        .clock-time { font-size: 1.5rem; font-weight: 700; letter-spacing: 2px; line-height: 1; }
        .clock-date { font-size: 0.72rem; color: #475569; margin-top: 2px; letter-spacing: 1px; }

        /* ── MAIN BODY ───────────────────────────────────────── */
        .body { flex: 1; display: flex; gap: 0; overflow: hidden; z-index: 10; }

        /* ── COUNTER GRID ────────────────────────────────────── */
        .counters-area {
            flex: 1; padding: 1.5rem 2rem; overflow-y: auto; scrollbar-width: none;
            display: flex; flex-direction: column; gap: 1.5rem;
        }
        .counters-area::-webkit-scrollbar { display: none; }

        .section-header { 
            display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;
        }
        .section-header span { font-size: 0.7rem; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #4f46e5; }
        .section-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }

        .counters-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.2rem;
        }

        /* COUNTER CARD */
        .ccard {
            position: relative; border-radius: 20px; overflow: hidden;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
            animation: cardIn 0.6s ease-out backwards;
        }
        @keyframes cardIn { from { opacity: 0; transform: translateY(20px); } }

        .ccard.serving {
            border-color: rgba(79, 70, 229, 0.4);
            box-shadow: 0 0 40px rgba(79, 70, 229, 0.08), inset 0 0 60px rgba(79, 70, 229, 0.03);
        }
        .ccard.called {
            border-color: rgba(245, 158, 11, 0.5);
            box-shadow: 0 0 40px rgba(245, 158, 11, 0.1), inset 0 0 60px rgba(245, 158, 11, 0.04);
            animation: cardIn 0.6s ease-out backwards, callPulse 2s ease-in-out infinite;
        }
        @keyframes callPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.1); }
            50% { box-shadow: 0 0 50px rgba(245,158,11,0.25); }
        }

        .ccard-glow {
            position: absolute; top: -40px; right: -40px;
            width: 120px; height: 120px; border-radius: 50%;
            opacity: 0; transition: opacity 0.5s ease;
            pointer-events: none;
        }
        .ccard.serving .ccard-glow { background: radial-gradient(circle, rgba(79,70,229,0.3), transparent 70%); opacity: 1; }
        .ccard.called .ccard-glow { background: radial-gradient(circle, rgba(245,158,11,0.3), transparent 70%); opacity: 1; }

        /* TOP STRIP */
        .ccard-top { 
            display: flex; justify-content: space-between; align-items: center;
            padding: 1rem 1.25rem 0.8rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .ccard-title { }
        .ccard-name { font-size: 0.95rem; font-weight: 800; color: #e2e8f0; letter-spacing: 0.3px; }
        .ccard-staff { font-size: 0.72rem; color: #475569; font-weight: 600; margin-top: 2px; }

        .cstatus { 
            font-size: 0.65rem; padding: 4px 10px; border-radius: 100px; font-weight: 800;
            letter-spacing: 1px; text-transform: uppercase;
            background: rgba(255,255,255,0.05); color: #64748b;
            transition: all 0.4s ease;
        }
        .cstatus.s-serving { background: rgba(79,70,229,0.15); color: #818cf8; }
        .cstatus.s-called  { background: rgba(245,158,11,0.15); color: #fbbf24; animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0.3; } }

        /* MAIN TOKEN DISPLAY */
        .ccard-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }

        .token-zone { min-height: 100px; display: flex; flex-direction: column; justify-content: center; }

        .token-num-wrap { position: relative; overflow: hidden; }
        .token-num {
            font-size: 4.5rem; font-weight: 900; line-height: 1; letter-spacing: -2px;
            font-family: 'Space Mono', monospace;
            background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .ccard.serving .token-num { 
            background: linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .ccard.called .token-num { 
            background: linear-gradient(135deg, #fde68a 0%, #f59e0b 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .token-num.flip {
            animation: flipToken 0.5s cubic-bezier(0.55, 0, 0.45, 1);
        }
        @keyframes flipToken {
            0% { opacity: 1; transform: translateY(0) rotateX(0deg); }
            50% { opacity: 0; transform: translateY(-30px) rotateX(90deg); }
            51% { opacity: 0; transform: translateY(30px) rotateX(-90deg); }
            100% { opacity: 1; transform: translateY(0) rotateX(0deg); }
        }

        .cust-line { 
            font-size: 0.9rem; font-weight: 600; color: #64748b;
            display: flex; align-items: center; gap: 0.5rem; margin-top: 0.3rem;
        }

        .duration-row {
            display: flex; align-items: center; gap: 0.5rem;
            font-size: 0.78rem; font-weight: 700;
        }
        .duration-label { color: #475569; font-weight: 600; }
        .duration-val { font-family: 'Space Mono', monospace; color: #ef4444; font-size: 0.85rem; }
        .ccard.called .duration-val { color: #f59e0b; }

        /* IDLE STATE */
        .idle-zone { 
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            min-height: 100px; gap: 0.5rem; 
        }
        .idle-ring { 
            width: 60px; height: 60px; border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.06);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem; color: rgba(255,255,255,0.15);
        }
        .idle-text { font-size: 0.75rem; font-weight: 700; color: #334155; letter-spacing: 2px; text-transform: uppercase; }

        /* QUEUE FOOTER OF CARD */
        .ccard-footer {
            padding: 0.8rem 1.25rem;
            border-top: 1px solid rgba(255,255,255,0.05);
            display: flex; justify-content: space-between; align-items: center;
        }
        .queue-count-label { font-size: 0.65rem; font-weight: 800; color: #475569; letter-spacing: 2px; text-transform: uppercase; }
        .queue-count-num { 
            font-size: 0.85rem; font-weight: 900; font-family: 'Space Mono', monospace;
            padding: 2px 10px; border-radius: 100px;
            background: rgba(79,70,229,0.1); color: #6366f1;
        }

        .next-token-line { font-size: 0.72rem; color: #334155; font-weight: 600; }
        .next-token-line span { color: #6366f1; font-weight: 800; }

        /* ── RIGHT SIDEBAR ───────────────────────────────────── */
        .sidebar {
            width: 300px; flex-shrink: 0;
            border-left: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.01);
            display: flex; flex-direction: column; overflow: hidden;
        }
        .sidebar-header { 
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            font-size: 0.7rem; font-weight: 800; letter-spacing: 3px;
            color: #4f46e5; text-transform: uppercase;
        }
        .wait-scroll {
            flex: 1; overflow-y: auto; scrollbar-width: none; padding: 1rem;
            display: flex; flex-direction: column; gap: 0.6rem;
        }
        .wait-scroll::-webkit-scrollbar { display: none; }

        .wait-row {
            display: flex; align-items: center; gap: 0.75rem;
            padding: 0.75rem 0.9rem; border-radius: 14px;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.04);
            animation: rowIn 0.4s ease-out backwards;
            transition: all 0.3s ease;
        }
        @keyframes rowIn { from { opacity: 0; transform: translateX(20px); } }
        .wait-row:hover { background: rgba(255,255,255,0.04); border-color: rgba(79,70,229,0.2); }

        .wait-pos { 
            width: 28px; height: 28px; border-radius: 50%;
            background: rgba(79,70,229,0.1); color: #6366f1;
            font-size: 0.7rem; font-weight: 900; font-family: 'Space Mono', monospace;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .wait-info { flex: 1; min-width: 0; }
        .wait-token { font-size: 1rem; font-weight: 800; font-family: 'Space Mono', monospace; color: #e2e8f0; }
        .wait-sub { font-size: 0.65rem; color: #475569; font-weight: 600; white-space: nowrap; }
        .wait-counter { 
            font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 100px;
            background: rgba(16, 185, 129, 0.1); color: #10b981;
        }

        .sidebar-empty { 
            flex: 1; display: flex; flex-direction: column; align-items: center; 
            justify-content: center; gap: 0.75rem; opacity: 0.3;
        }
        .sidebar-empty span { font-size: 3rem; }
        .sidebar-empty p { font-size: 0.75rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #64748b; }

        /* ── BOTTOM TICKER ───────────────────────────────────── */
        .ticker-bar {
            z-index: 100; height: 50px;
            background: rgba(10, 10, 15, 0.9); backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255,255,255,0.05);
            display: flex; align-items: center; overflow: hidden; gap: 0;
        }
        .ticker-label {
            flex-shrink: 0; padding: 0 1.5rem; height: 100%;
            display: flex; align-items: center;
            background: linear-gradient(135deg, #4f46e5, #06b6d4);
            font-size: 0.65rem; font-weight: 800; letter-spacing: 2px; color: white;
        }
        .ticker-track { flex: 1; overflow: hidden; position: relative; height: 100%; }
        .ticker-inner {
            display: flex; align-items: center; gap: 2.5rem;
            animation: tickerScroll 30s linear infinite;
            white-space: nowrap; padding: 0 1rem; height: 100%;
        }
        @keyframes tickerScroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .ticker-chip { 
            display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;
            font-size: 0.78rem; font-weight: 700;
        }
        .tc-num { font-family: 'Space Mono', monospace; font-size: 0.9rem; color: #6366f1; }
        .tc-sep { color: #1e293b; }
        .tc-name { color: #475569; }

        /* ── BIG CALL OVERLAY ────────────────────────────────── */
        .announcement {
            position: fixed; inset: 0; z-index: 1000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            background: rgba(6, 8, 20, 0.97); backdrop-filter: blur(30px);
            animation: announceIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes announceIn { from { opacity: 0; } }

        .a-badge { 
            font-size: 0.75rem; letter-spacing: 8px; color: #475569; 
            text-transform: uppercase; margin-bottom: 2rem; animation: fadeUp 0.6s ease-out 0.2s backwards;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } }

        .a-token { 
            font-family: 'Space Mono', monospace;
            font-size: clamp(8rem, 25vw, 20rem); font-weight: 700; line-height: 0.9;
            background: linear-gradient(135deg, #e0e7ff 0%, #6366f1 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            animation: tokenDrop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards;
        }
        @keyframes tokenDrop { from { opacity: 0; transform: scale(0.5) translateY(40px); } }

        .a-counter { 
            font-size: clamp(2rem, 6vw, 5rem); font-weight: 900;
            color: #10b981; letter-spacing: 4px; text-transform: uppercase;
            animation: fadeUp 0.6s ease-out 0.4s backwards;
        }
        .a-prompt { 
            margin-top: 4rem; font-size: 1rem; font-weight: 800; letter-spacing: 3px;
            color: rgba(255,255,255,0.3); text-transform: uppercase;
            animation: fadeUp 0.6s ease-out 0.6s backwards;
        }

        /* Particles */
        .particles { position: absolute; inset: 0; pointer-events: none; }
        .p { 
            position: absolute; width: 6px; height: 6px; border-radius: 50%;
            animation: particle 3s ease-out forwards;
            opacity: 0;
        }
        @keyframes particle {
            0% { transform: translateY(0) scale(0); opacity: 1; }
            100% { transform: translateY(calc(-150px - var(--r, 0px))) scale(1); opacity: 0; }
        }

        /* PAUSED OVERLAY */
        .paused {
            position: fixed; inset: 0; z-index: 900;
            background: rgba(6, 8, 20, 0.97);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 1.5rem; text-align: center;
        }
        .paused-icon { font-size: 5rem; animation: pauseBounce 2s ease-in-out infinite; }
        @keyframes pauseBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .paused h2 { font-size: 3rem; font-weight: 900; color: #fbbf24; }
        .paused p { font-size: 1.1rem; color: #64748b; max-width: 600px; }
    `],
    template: `
        <div class="display-root">
            <!-- Background Layer -->
            <div class="bg"></div>
            <div class="grid-lines"></div>

            <!-- Paused Overlay -->
            <div class="paused" *ngIf="queueStatus === 'paused'">
                <div class="paused-icon">📢</div>
                <h2>SERVICE PAUSED</h2>
                <p>{{ pauseMessage || 'We will resume shortly. Thank you for your patience.' }}</p>
            </div>

            <!-- ── HEADER ──────────────────────────── -->
            <header class="header">
                <div class="brand">
                    <div class="brand-logo">🏢</div>
                    <div class="brand-text">
                        <h1>{{ serviceName }}</h1>
                        <p>Live Queue Management</p>
                    </div>
                </div>

                <div class="header-right">
                    <div class="stats-bar">
                        <div class="stat-pill">
                            <div class="stat-dot" style="background: #6366f1"></div>
                            <span class="stat-label">Active</span>
                            <span class="stat-val">{{ servingTokens.length }}</span>
                        </div>
                        <div class="stat-pill">
                            <div class="stat-dot" style="background: #f59e0b"></div>
                            <span class="stat-label">Waiting</span>
                            <span class="stat-val">{{ waitingTokens.length }}</span>
                        </div>
                        <div class="stat-pill">
                            <div class="stat-dot" style="background: #10b981"></div>
                            <span class="stat-label">Counters</span>
                            <span class="stat-val">{{ counters.length }}</span>
                        </div>
                    </div>

                    <div class="live-badge">
                        <div class="live-pulse"></div>
                        <div class="live-text">LIVE</div>
                    </div>

                    <div class="clock">
                        <div class="clock-time">{{ currentTime | date:'HH:mm:ss' }}</div>
                        <div class="clock-date">{{ currentTime | date:'EEE, dd MMM yyyy' }}</div>
                    </div>
                </div>
            </header>

            <!-- ── BODY ──────────────────────────── -->
            <div class="body">

                <!-- Counter Grid -->
                <div class="counters-area">
                    <div class="section-header">
                        <span>Counter Stations</span>
                        <div class="section-line"></div>
                    </div>

                    <div class="counters-grid">
                        <div *ngFor="let counter of counters; let ci = index"
                             class="ccard"
                             [class.serving]="getTokenForCounter(counter._id)?.status === 'serving'"
                             [class.called]="getTokenForCounter(counter._id)?.status === 'called'"
                             [style.animationDelay]="ci * 0.08 + 's'">

                            <div class="ccard-glow"></div>

                            <!-- Top: Name + Status -->
                            <div class="ccard-top">
                                <div class="ccard-title">
                                    <div class="ccard-name">{{ counter.name }}</div>
                                    <div class="ccard-staff">👤 {{ counter.staffName || 'Staff' }}</div>
                                </div>
                                <div class="cstatus"
                                     [class.s-serving]="getTokenForCounter(counter._id)?.status === 'serving'"
                                     [class.s-called]="getTokenForCounter(counter._id)?.status === 'called'">
                                    {{ getTokenForCounter(counter._id) ? (getTokenForCounter(counter._id).status | uppercase) : 'IDLE' }}
                                </div>
                            </div>

                            <!-- Body: Token or Idle -->
                            <div class="ccard-body">
                                <ng-container *ngIf="getTokenForCounter(counter._id) as token">
                                    <div class="token-zone">
                                        <div class="token-num-wrap">
                                            <div class="token-num" [class.flip]="isFlipping(token._id)">
                                                {{ token.tokenNumber }}
                                            </div>
                                        </div>
                                        <div class="cust-line">
                                            <span>{{ token.customerName || 'Customer' }}</span>
                                            <span style="opacity: 0.4">{{ getGenderIcon(token.gender) }}</span>
                                        </div>
                                        <div class="duration-row" style="margin-top: 0.5rem;">
                                            <span class="duration-label">Duration:</span>
                                            <span class="duration-val">{{ getTimeWaited(token.calledAt || token.updatedAt) }}</span>
                                        </div>
                                    </div>
                                </ng-container>

                                <ng-container *ngIf="!getTokenForCounter(counter._id)">
                                    <div class="idle-zone">
                                        <div class="idle-ring">⏸</div>
                                        <div class="idle-text">Station Ready</div>
                                    </div>
                                </ng-container>
                            </div>

                            <!-- Footer: Queue count -->
                            <div class="ccard-footer">
                                <span class="queue-count-label">In Queue</span>
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <span class="next-token-line" *ngIf="getFirstWaiting(counter._id) as nxt">
                                        NEXT: <span>#{{ nxt.tokenNumber }}</span>
                                    </span>
                                    <span class="queue-count-num">{{ getWaitingCountForCounter(counter._id) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right: Waiting Pool -->
                <aside class="sidebar">
                    <div class="sidebar-header">Waiting Pool ▸ {{ waitingTokens.length }}</div>

                    <ng-container *ngIf="waitingTokens.length > 0; else noWaiting">
                        <div class="wait-scroll">
                            <div *ngFor="let t of waitingTokens; let i = index"
                                 class="wait-row" [style.animationDelay]="i * 0.05 + 's'">
                                <div class="wait-pos">{{ i + 1 }}</div>
                                <div class="wait-info">
                                    <div class="wait-token">{{ t.tokenNumber }}</div>
                                    <div class="wait-sub">{{ t.customerName || 'Guest' }} · {{ getTimeWaited(t.joinedAt) }} ago</div>
                                </div>
                                <div class="wait-counter" *ngIf="t.counterName">{{ t.counterName }}</div>
                            </div>
                        </div>
                    </ng-container>

                    <ng-template #noWaiting>
                        <div class="sidebar-empty">
                            <span>✨</span>
                            <p>No waiting</p>
                        </div>
                    </ng-template>
                </aside>
            </div>

            <!-- ── BOTTOM TICKER ──────────────────────────── -->
            <div class="ticker-bar" *ngIf="servingTokens.length > 0">
                <div class="ticker-label">NOW SERVING</div>
                <div class="ticker-track">
                    <div class="ticker-inner">
                        <ng-container *ngFor="let t of tickerItems">
                            <div class="ticker-chip">
                                <span class="tc-num">{{ t.tokenNumber }}</span>
                                <span class="tc-sep">—</span>
                                <span class="tc-name">{{ t.counterName }}</span>
                            </div>
                            <span class="tc-sep" style="color:#1e293b">╱</span>
                        </ng-container>
                        <!-- Duplicate for seamless scroll -->
                        <ng-container *ngFor="let t of tickerItems">
                            <div class="ticker-chip">
                                <span class="tc-num">{{ t.tokenNumber }}</span>
                                <span class="tc-sep">—</span>
                                <span class="tc-name">{{ t.counterName }}</span>
                            </div>
                            <span class="tc-sep" style="color:#1e293b">╱</span>
                        </ng-container>
                    </div>
                </div>
            </div>

            <!-- ── BIG ANNOUNCEMENT ───────────────────────── -->
            <div class="announcement" *ngIf="isNewCallShow">
                <div class="particles">
                    <div *ngFor="let p of particles"
                         class="p"
                         [style.left]="p.x + '%'"
                         [style.top]="'60%'"
                         [style.background]="p.color"
                         [style.animationDelay]="p.delay + 's'"
                         [style.--r]="p.r + 'px'"></div>
                </div>
                <div class="a-badge">Token Called</div>
                <div class="a-token">{{ lastCalledToken?.tokenNumber }}</div>
                <div class="a-counter">→ {{ lastCalledToken?.counterName }}</div>
                <div class="a-prompt">Please proceed to your counter</div>
            </div>
        </div>
    `
})
export class QueueDisplayComponent implements OnInit, OnDestroy {
    serviceId: string = '';
    serviceName: string = 'Loading...';
    currentTime: Date = new Date();

    servingTokens: any[] = [];
    waitingTokens: any[] = [];
    counters: any[] = [];

    queueStatus: string = 'active';
    pauseMessage: string = '';

    isNewCallShow: boolean = false;
    lastCalledToken: any = null;
    prevServingIds: Set<string> = new Set();

    // Flip animation tracking
    flippingIds: Set<string> = new Set();

    // Ticker items
    tickerItems: any[] = [];

    // Particles for announcement
    particles: any[] = [];

    private timeInterval: any;
    private pollSub: Subscription | null = null;

    constructor(
        private route: ActivatedRoute,
        private queueService: QueueService,
        private serviceService: ServiceService,
        private apiConfig: ApiConfigService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.serviceId = this.route.snapshot.params['id'];
        if (!this.serviceId) return;

        this.loadDetails();
        this.startPolling();

        this.timeInterval = setInterval(() => {
            this.currentTime = new Date();
            this.cdr.detectChanges();
        }, 1000);
    }

    ngOnDestroy() {
        if (this.timeInterval) clearInterval(this.timeInterval);
        if (this.pollSub) this.pollSub.unsubscribe();
    }

    loadDetails() {
        this.serviceService.getPublicService(this.serviceId).subscribe({
            next: (res: any) => {
                if (res.success && res.data) {
                    this.serviceName = res.data.name;
                    this.queueStatus = res.data.queueStatus || 'active';
                    this.pauseMessage = res.data.pauseMessage || '';
                    this.counters = res.data.counters || [];
                    this.cdr.detectChanges();
                }
            }
        });
    }

    startPolling() {
        this.fetchQueue();
        this.pollSub = interval(3000).subscribe(() => {
            this.fetchQueue();
            this.loadDetails();
        });
    }

    fetchQueue() {
        this.queueService.getQueueStatus(this.serviceId).subscribe({
            next: (res: any) => {
                const data = res.data || res;
                // Backend sends 'queue' with ALL active tokens (waiting/called/serving)
                // Each token already has counterName resolved by the backend
                const allTokens: any[] = data.queue || data.waitingTokens || [];

                const tokens = allTokens.map((t: any) => ({
                    ...t,
                    _id: (t._id || t.id || '').toString(),
                    tokenNumber: t.tokenNumber || t.number,
                    counterId: t.counterId ? t.counterId.toString() : null,
                }));

                // Token statuses from DB: 'waiting' | 'called' | 'serving'
                const serving = tokens.filter((t: any) => t.status === 'called' || t.status === 'serving');
                const waiting = tokens.filter((t: any) => t.status === 'waiting');

                // Detect new calls
                const currentIds = new Set<string>(serving.map((t: any) => t._id));
                const newCall = serving.find((t: any) => !this.prevServingIds.has(t._id));
                if (newCall && this.prevServingIds.size > 0) {
                    this.announceToken(newCall);
                }

                // Flip animation for changed tokens per counter
                serving.forEach((t: any) => {
                    const prev = this.servingTokens.find((p: any) => p.counterId === t.counterId);
                    if (prev && prev.tokenNumber !== t.tokenNumber) {
                        this.triggerFlip(t._id);
                    }
                });

                this.prevServingIds = currentIds;
                this.servingTokens = serving;
                this.waitingTokens = waiting;
                this.tickerItems = serving.filter((t: any) => t.counterName);
                this.cdr.detectChanges();
            },
            error: (err: any) => console.error('Queue fetch error', err)
        });
    }

    getTokenForCounter(counterId: string): any {
        const cId = counterId ? counterId.toString() : '';
        return this.servingTokens.find((t: any) =>
            t.counterId && t.counterId.toString() === cId
        ) || null;
    }

    getWaitingCountForCounter(counterId: string): number {
        const cId = counterId ? counterId.toString() : '';
        return this.waitingTokens.filter((t: any) =>
            t.counterId && t.counterId.toString() === cId
        ).length;
    }

    getFirstWaiting(counterId: string): any {
        const cId = counterId ? counterId.toString() : '';
        return this.waitingTokens.find((t: any) =>
            t.counterId && t.counterId.toString() === cId
        );
    }

    isFlipping(tokenId: string): boolean {
        return this.flippingIds.has(tokenId);
    }

    triggerFlip(tokenId: string) {
        this.flippingIds.add(tokenId);
        this.cdr.detectChanges();
        setTimeout(() => {
            this.flippingIds.delete(tokenId);
            this.cdr.detectChanges();
        }, 500);
    }

    private announceToken(token: any) {
        this.lastCalledToken = token;
        this.isNewCallShow = true;
        this.particles = this.generateParticles();
        this.playAudio();
        this.cdr.detectChanges();

        setTimeout(() => {
            this.isNewCallShow = false;
            this.cdr.detectChanges();
        }, 8000);
    }

    private generateParticles(): any[] {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899'];
        return Array.from({ length: 30 }, (_, i) => ({
            x: Math.random() * 100,
            color: colors[i % colors.length],
            delay: Math.random() * 0.5,
            r: (Math.random() - 0.5) * 400
        }));
    }

    private playAudio() {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2861/2861-preview.mp3');
            audio.volume = 0.6;
            audio.play().catch(() => { });
        } catch (e) { }
    }

    getAvatar(i: number): string {
        const avatars = ['🧍', '🚶', '👩‍💼', '👨‍💼', '🧔', '👩', '👴', '👵', '👦', '👧'];
        return avatars[i % avatars.length];
    }

    getTimeWaited(since: any): string {
        if (!since) return '0s';
        const diff = Math.floor((Date.now() - new Date(since).getTime()) / 1000);
        return this.formatSecs(diff);
    }

    formatSecs(s: number): string {
        s = Math.round(s);
        if (s < 0) return '0s';
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60), sc = s % 60;
        if (m < 60) return `${m}:${sc.toString().padStart(2, '0')}`;
        const h = Math.floor(m / 60);
        return `${h}h ${m % 60}m`;
    }

    getGenderIcon(g: string): string {
        if (g?.toLowerCase() === 'male') return '♂️';
        if (g?.toLowerCase() === 'female') return '♀️';
        return '';
    }
}
