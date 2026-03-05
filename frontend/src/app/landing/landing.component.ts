import { Component, OnInit, OnDestroy, NgZone, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface PhysicsFig {
    el: SVGGElement | null;
    phoneEl: SVGTextElement | null;
    baseX: number;
    baseY: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {

    // Animated statistics
    stats = { organizations: 0, customers: 0, minutesSaved: 0 };
    private targetStats = { organizations: 500, customers: 50000, minutesSaved: 2000000 };

    // Features data
    features = [
        { icon: '📱', title: 'QR-Based Virtual Queue', description: 'Customers scan and join queue instantly from their phones' },
        { icon: '📊', title: 'Real-Time Queue Tracking', description: 'Visual queue representation with live position updates' },
        { icon: '⚖️', title: 'Intelligent Load Balancing', description: 'AI-powered counter assignment for minimal wait times' },
        { icon: '⭐', title: 'Priority Queue Management', description: 'Special lanes for seniors, expectant mothers, and PWD' },
        { icon: '⏱️', title: 'Predictive Wait Times', description: 'Dynamic wait time estimation using recent service data' },
        { icon: '📈', title: 'Advanced Analytics', description: 'Data-driven insights on wait times and utilization' }
    ];

    // How it works steps
    steps = [
        { number: 1, title: 'Scan QR Code', description: 'Customer scans the QR code displayed at your location' },
        { number: 2, title: 'Join Queue', description: 'Select service and priority, receive token number instantly' },
        { number: 3, title: 'Track Position', description: 'Monitor queue position and estimated wait time in real-time' },
        { number: 4, title: 'Get Notified', description: 'Receive notification when it\'s your turn to be served' }
    ];

    // ── Physics simulation ────────────────────────────────────────────────────
    private figs: PhysicsFig[] = [
        { el: null, phoneEl: null, baseX: 145, baseY: 208, x: 145, y: 208, vx: 0, vy: 0 },
        { el: null, phoneEl: null, baseX: 200, baseY: 208, x: 200, y: 208, vx: 0, vy: 0 },
        { el: null, phoneEl: null, baseX: 255, baseY: 208, x: 255, y: 208, vx: 0, vy: 0 },
        { el: null, phoneEl: null, baseX: 310, baseY: 208, x: 310, y: 208, vx: 0, vy: 0 },
        { el: null, phoneEl: null, baseX: 365, baseY: 208, x: 365, y: 208, vx: 0, vy: 0 },
    ];

    // Mouse stored in SCREEN PIXELS — works globally across entire window
    private mouseX = -9999;
    private mouseY = -9999;
    private rafId: number | null = null;
    private svgElRef: SVGSVGElement | null = null;
    private labelQueue: SVGTextElement | null = null;
    private labelFree: SVGTextElement | null = null;
    private qrEls: SVGElement[] = [];
    private hintEl: SVGTextElement | null = null;
    private interacted = false;
    private demoTimer: ReturnType<typeof setTimeout> | null = null;
    private _mouseMoveHandler!: (e: MouseEvent) => void;
    private _mouseLeaveHandler!: () => void;

    constructor(private router: Router, private zone: NgZone, private elRef: ElementRef) { }

    ngOnInit(): void {
        this.animateStats();
        // Delay init so Angular has rendered the template
        setTimeout(() => this.initPhysics(), 300);
    }

    ngOnDestroy(): void {
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        if (this.demoTimer !== null) clearTimeout(this.demoTimer);
        window.removeEventListener('mousemove', this._mouseMoveHandler);
        document.removeEventListener('mouseleave', this._mouseLeaveHandler);
    }

    // ── Physics init ──────────────────────────────────────────────────────────
    private initPhysics(): void {
        const root = this.elRef.nativeElement;
        this.svgElRef = root.querySelector('.queue-anim');
        this.labelQueue = root.querySelector('.phase-queue');
        this.labelFree = root.querySelector('.phase-free');
        this.hintEl = root.querySelector('.hint-label');
        this.qrEls = Array.from(root.querySelectorAll('.qr-glow'));

        this.figs.forEach((fig, i) => {
            fig.el = root.querySelector(`.f${i + 1}`) as SVGGElement;
            fig.phoneEl = fig.el?.querySelector('.phone') as SVGTextElement ?? null;
        });

        // Attach global listeners OUTSIDE Angular zone (no change detection)
        this.zone.runOutsideAngular(() => {
            // Global mouse tracking — works anywhere on the window
            this._mouseMoveHandler = (e: MouseEvent) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                if (!this.interacted) {
                    this.interacted = true;
                    if (this.hintEl) this.hintEl.style.opacity = '0';
                }
            };
            this._mouseLeaveHandler = () => {
                this.mouseX = -9999;
                this.mouseY = -9999;
            };
            window.addEventListener('mousemove', this._mouseMoveHandler, { passive: true });
            document.addEventListener('mouseleave', this._mouseLeaveHandler);

            // rAF physics loop
            const tick = () => {
                this.physicsTick();
                this.rafId = requestAnimationFrame(tick);
            };
            tick();
        });

        // Auto-demo: sweep a virtual cursor across the queue after 1.8s
        // so users see the interaction before they touch the mouse
        this.demoTimer = setTimeout(() => {
            if (this.interacted) return;
            let t = 0;
            const sweep = setInterval(() => {
                if (this.interacted || t > 80) { clearInterval(sweep); this.mouseX = -9999; return; }
                // Oscillate virtual mouse across the queue
                // Convert SVG units (255 + Math.sin(t * 0.18) * 180, 200) to screen pixels
                if (this.svgElRef) {
                    const svgRect = this.svgElRef.getBoundingClientRect();
                    const toScreenX = svgRect.width / 1440;
                    const toScreenY = svgRect.height / 230;
                    this.mouseX = svgRect.left + (255 + Math.sin(t * 0.18) * 180) * toScreenX;
                    this.mouseY = svgRect.top + 200 * toScreenY;
                }
                t++;
            }, 40);
        }, 1800);
    }

    // ── Physics tick (60fps, outside Angular zone) ───────────────────────────
    private physicsTick(): void {
        if (!this.svgElRef) return;

        // Distance calculated in SCREEN PIXELS so effect works from anywhere
        const REPEL_R_PX = 220;    // pixels on actual screen
        const REPEL_STR = 9e6;    // force magnitude (screen-pixel units)
        const SPRING_X = 0.055;  // SVG-unit spring
        const SPRING_Y = 0.18;
        const DAMPING = 0.82;

        const svgRect = this.svgElRef.getBoundingClientRect();
        const toScreenX = svgRect.width / 1440;  // SVG unit → screen pixel
        const toScreenY = svgRect.height / 230;
        const toSvgX = 1440 / svgRect.width;   // screen pixel → SVG unit
        const toSvgY = 230 / svgRect.height;

        let anyScattered = false;

        for (const fig of this.figs) {
            if (!fig.el) continue;

            // Figure centre in screen pixels
            const figPx = svgRect.left + fig.x * toScreenX;
            const figPy = svgRect.top + fig.y * toScreenY;

            const dx = figPx - this.mouseX;
            const dy = figPy - this.mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Repulsion (screen-pixel space) → convert force back to SVG units
            if (dist < REPEL_R_PX && dist > 0.1) {
                const force = REPEL_STR / (dist * dist);
                fig.vx += (dx / dist) * force * toSvgX;
                fig.vy += (dy / dist) * force * toSvgY * 0.35;
            }

            // Spring back to queue base position
            fig.vx += (fig.baseX - fig.x) * SPRING_X;
            fig.vy += (fig.baseY - fig.y) * SPRING_Y;

            // Damping
            fig.vx *= DAMPING;
            fig.vy *= DAMPING;

            // Integrate
            fig.x += fig.vx;
            fig.y += fig.vy;

            // Bounds: don't go behind counter or off-screen; minimal Y sink
            fig.x = Math.max(110, Math.min(1420, fig.x));
            fig.y = Math.max(fig.baseY - 55, Math.min(fig.baseY + 3, fig.y));

            // Apply transform to the SVG group element directly (no Angular re-render)
            fig.el.setAttribute('transform', `translate(${fig.x.toFixed(1)},${fig.y.toFixed(1)})`);

            // Show 📱 when figure is far from base (scattered = free)
            const distFromBase = Math.hypot(fig.x - fig.baseX, fig.y - fig.baseY);
            const scattered = distFromBase > 35;
            if (scattered) anyScattered = true;
            if (fig.phoneEl) fig.phoneEl.style.opacity = scattered ? '1' : '0';
        }

        // Sync labels and QR glow based on scatter state
        if (this.labelQueue) this.labelQueue.style.opacity = anyScattered ? '0' : '0.75';
        if (this.labelFree) this.labelFree.style.opacity = anyScattered ? '0.9' : '0';
        this.qrEls.forEach(el => {
            el.style.opacity = anyScattered ? '1' : '0.35';
            el.style.filter = anyScattered ? 'drop-shadow(0 0 6px rgba(165,180,252,0.9))' : 'none';
        });
    }

    // ── Statistics counter animation ──────────────────────────────────────────
    animateStats(): void {
        const duration = 2000;
        const steps = 60;
        const interval = duration / steps;
        let currentStep = 0;
        const timer = setInterval(() => {
            currentStep++;
            const p = currentStep / steps;
            this.stats.organizations = Math.floor(this.targetStats.organizations * p);
            this.stats.customers = Math.floor(this.targetStats.customers * p);
            this.stats.minutesSaved = Math.floor(this.targetStats.minutesSaved * p);
            if (currentStep >= steps) { clearInterval(timer); this.stats = { ...this.targetStats }; }
        }, interval);
    }

    formatNumber(num: number): string {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
        return num.toString();
    }

    // ── Navigation ────────────────────────────────────────────────────────────
    navigateToSignup(): void { this.router.navigate(['/signup']); }
    navigateToLogin(): void { this.router.navigate(['/login']); }
    navigateToDemo(): void { this.router.navigate(['/demo']); }
    scrollToFeatures(): void { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }
    scrollToHowItWorks(): void { document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }
}
