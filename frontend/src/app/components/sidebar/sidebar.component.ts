import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    styles: [`
        :host { display: block; }

        .sidebar {
            width: 240px;
            background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
            height: 100vh;
            display: flex;
            flex-direction: column;
            position: fixed;
            left: 0; top: 0;
            z-index: 200;
            transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
            overflow: hidden;
            box-shadow: 4px 0 24px rgba(0,0,0,0.25);
        }
        .sidebar.collapsed { width: 72px; }

        /* ─── Header ─────────────────────────────── */
        .sb-header {
            display: flex;
            align-items: center;
            padding: 1.25rem 0.85rem;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            min-height: 64px;
            gap: 0;
        }
        .logo-text {
            font-size: 1.2rem; font-weight: 800;
            color: #6366f1; letter-spacing: -0.5px;
            white-space: nowrap;
            flex: 1;
            overflow: hidden;
            transition: opacity 0.2s, width 0.25s;
        }
        .sidebar.collapsed .logo-text { opacity: 0; width: 0; }

        /* Toggle button in header */
        .toggle-btn {
            flex-shrink: 0;
            width: 28px; height: 28px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            color: #94a3b8; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.85rem;
            transition: all 0.2s;
        }
        .toggle-btn:hover { background: rgba(99,102,241,0.3); color: white; }

        /* ─── Nav ────────────────────────────────── */
        .nav-list {
            flex: 1;
            padding: 0.75rem 0;
            overflow: hidden; /* no scrollbar */
        }

        .nav-section-label {
            font-size: 0.65rem; font-weight: 700; letter-spacing: 1.5px;
            color: #475569; text-transform: uppercase;
            padding: 0.75rem 1.25rem 0.25rem;
            white-space: nowrap; overflow: hidden;
            transition: opacity 0.2s;
        }
        .sidebar.collapsed .nav-section-label { opacity: 0; }

        .nav-item {
            display: flex; align-items: center;
            margin: 2px 0.65rem;
            padding: 0.7rem 0.85rem;
            border-radius: 10px;
            color: #94a3b8;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.18s;
            gap: 0.85rem;
            white-space: nowrap;
            position: relative;
        }
        .nav-item:hover {
            background: rgba(255,255,255,0.07);
            color: #e2e8f0;
        }
        .nav-item.active {
            background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2));
            color: white;
            box-shadow: inset 3px 0 0 #6366f1;
        }
        .nav-item.active .nav-icon { filter: drop-shadow(0 0 6px rgba(99,102,241,0.6)); }

        .nav-icon { font-size: 1.2rem; width: 22px; text-align: center; flex-shrink: 0; }
        .nav-label { font-size: 0.9rem; font-weight: 600; overflow: hidden; }
        .sidebar.collapsed .nav-label { display: none; }

        /* Tooltip on collapsed */
        .sidebar.collapsed .nav-item::after {
            content: attr(data-label);
            position: absolute;
            left: calc(100% + 12px);
            top: 50%; transform: translateY(-50%);
            background: #1e293b;
            color: white;
            padding: 5px 10px;
            border-radius: 6px;
            font-size: 0.8rem; font-weight: 600;
            white-space: nowrap; pointer-events: none;
            opacity: 0; transition: opacity 0.15s;
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 999;
        }
        .sidebar.collapsed .nav-item:hover::after { opacity: 1; }

        /* ─── Footer ─────────────────────────────── */
        .sb-footer {
            border-top: 1px solid rgba(255,255,255,0.06);
            padding: 0.85rem 0.65rem;
        }

        .sidebar-clock {
            background: rgba(0,0,0,0.35);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 10px;
            padding: 0.6rem 0.75rem;
            margin-bottom: 0.5rem;
            text-align: center;
            overflow: hidden;
        }
        .clock-time {
            font-size: 1.1rem; font-weight: 800;
            color: #e2e8f0;
            font-variant-numeric: tabular-nums;
            letter-spacing: 1px;
            white-space: nowrap;
        }
        .clock-date { font-size: 0.68rem; color: #64748b; margin-top: 2px; }

        .sidebar.collapsed .sidebar-clock { display: none; }

        .logout-item {
            display: flex; align-items: center;
            padding: 0.65rem 0.85rem;
            border-radius: 10px;
            color: #64748b; cursor: pointer;
            gap: 0.85rem; white-space: nowrap;
            transition: all 0.18s;
        }
        .logout-item:hover { background: rgba(239,68,68,0.12); color: #f87171; }
        .sidebar.collapsed .logout-label { display: none; }
    `],
    template: `
        <aside class="sidebar" [class.collapsed]="collapsed">

            <!-- Header -->
            <div class="sb-header">
                <span class="logo-text">LineLess</span>
                <button class="toggle-btn" (click)="toggleCollapse()" [title]="collapsed ? 'Expand' : 'Collapse'">
                    {{ collapsed ? '▶' : '◀' }}
                </button>
            </div>

            <!-- Nav -->
            <nav class="nav-list">
                <div class="nav-section-label">Main Menu</div>
                <a *ngFor="let item of navItems"
                   [routerLink]="item.path"
                   routerLinkActive="active"
                   class="nav-item"
                   [attr.data-label]="item.label">
                    <span class="nav-icon">{{ item.icon }}</span>
                    <span class="nav-label">{{ item.label }}</span>
                </a>
            </nav>

            <!-- Footer: clock + logout -->
            <div class="sb-footer">
                <div class="sidebar-clock">
                    <div class="clock-time">{{ currentTime }}</div>
                    <div class="clock-date">{{ currentDate }}</div>
                </div>
                <div class="logout-item" (click)="logout()">
                    <span class="nav-icon">🚪</span>
                    <span class="logout-label">Logout</span>
                </div>
            </div>

        </aside>
    `
})
export class SidebarComponent implements OnInit, OnDestroy {
    @Input() collapsed = false;
    @Output() collapseChange = new EventEmitter<boolean>();

    navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/organizations', label: 'Organizations', icon: '🏢' },
        { path: '/services', label: 'Services', icon: '🎯' },
        { path: '/queue', label: 'Queue', icon: '👥' },
        { path: '/analytics', label: 'Analytics', icon: '📈' }
    ];

    currentTime = '';
    currentDate = '';
    private clockInterval: any;

    constructor(private router: Router, private authService: AuthService) { }

    ngOnInit() {
        this.tick();
        this.clockInterval = setInterval(() => this.tick(), 1000);
    }

    ngOnDestroy() {
        if (this.clockInterval) clearInterval(this.clockInterval);
    }

    private tick() {
        const now = new Date();
        this.currentTime = now.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        this.currentDate = now.toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
        });
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed;
        this.collapseChange.emit(this.collapsed);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
