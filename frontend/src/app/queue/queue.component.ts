import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { QueueService } from '../services/queue.service';
import { ServiceService } from '../services/service.service';
import { OrganizationService } from '../services/organization.service';
import { SidebarComponent } from '../components/sidebar/sidebar.component';

@Component({
    selector: 'app-queue',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
    styles: [`
        .layout { display: flex; min-height: 100vh; background: #f8fafc; }
        .content { flex: 1; transition: margin-left 0.3s ease; padding: 2rem; box-sizing: border-box; }
        
        .page-container { max-width: 1200px; margin: 0 auto; }
        .header { margin-bottom: 2rem; }
        
        .controls-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; border: 1px solid #e2e8f0; }
        .control-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
        .form-group { flex: 1; min-width: 200px; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #475569; }
        select { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; background: white; }
        
        .dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
        
        .queue-list-card, .action-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e2e8f0; }
        .card-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
        .card-header h3 { margin: 0; color: #1e293b; }
        
        .token-list { list-style: none; padding: 0; margin: 0; max-height: 600px; overflow-y: auto; }
        .token-item { padding: 1rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; }
        .token-item:hover { background: #f8fafc; }
        .token-number { font-size: 1.25rem; font-weight: 700; color: #6366f1; }
        .token-info { color: #64748b; font-size: 0.9rem; }
        .status-badge { padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .waiting { background: #fef3c7; color: #d97706; }
        .serving { background: #dcfce7; color: #166534; }
        
        .current-token-display { text-align: center; padding: 3rem 1.5rem; background: #eef2ff; border-bottom: 1px solid #e2e8f0; }
        .big-number { font-size: 4rem; font-weight: 800; color: #4f46e5; line-height: 1; margin: 1rem 0; }
        .customer-name { font-size: 1.25rem; color: #1e293b; font-weight: 600; }
        
        .action-buttons { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .btn-large { padding: 1rem; border-radius: 8px; border: none; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: all 0.2s; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .btn-call { background: #6366f1; color: white; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3); }
        .btn-call:hover { background: #4f46e5; transform: translateY(-2px); }
        .btn-call:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; box-shadow: none; }
        
        .btn-complete { background: #10b981; color: white; }
        .btn-complete:hover { background: #059669; }
        
        .btn-skip { background: white; border: 2px solid #ef4444; color: #ef4444; }
        .btn-skip:hover { background: #fee2e2; }
        
        .empty-state { padding: 3rem; text-align: center; color: #64748b; }

        @media (max-width: 1024px) { .dashboard-grid { grid-template-columns: 1fr; } }

        .btn-pause { background: #fffbeb; color: #d97706; border: 1px solid #d97706; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
        .btn-pause:hover { background: #fef3c7; }
        
        .btn-resume { background: #ecfdf5; color: #166534; border: 1px solid #166534; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
        .btn-resume:hover { background: #d1fae5; }
        
        .btn-schedule { background: #eef2ff; color: #4338ca; border: 1px solid #4338ca; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
        .btn-schedule:hover { background: #e0e7ff; }

        .btn-counter-pause { background: #fffbeb; color: #d97706; border: 1px solid #d97706; padding: 0.3rem 0.65rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; font-weight: 700; transition: all 0.2s; }
        .btn-counter-pause:hover { background: #fef3c7; }
        .btn-counter-resume { background: #ecfdf5; color: #166534; border: 1px solid #166534; padding: 0.3rem 0.65rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; font-weight: 700; transition: all 0.2s; }
        .btn-counter-resume:hover { background: #d1fae5; }

        .service-info-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; margin-top: 1.5rem; padding-top: 1.5rem; flex-wrap: wrap; gap: 1rem; }

        /* Modal Styles */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; height: 100vh; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; min-height: 400px; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        .modal-body { flex: 1; padding: 1rem 0; }
        .modal-body .form-group { margin-bottom: 1.5rem; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
        .cancel-btn { background: white; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 600; color: #64748b; }
        .submit-btn { background: #6366f1; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
        
        /* New Dashboard Grid Styles */
        .counters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .counter-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; transition: all 0.2s; position: relative; display: flex; flex-direction: column; }
        .counter-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); cursor: pointer; }
        .counter-card.active { border-color: #6366f1; ring: 2px solid #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
        
        .counter-token-display { padding: 1.5rem; text-align: center; background: #eef2ff; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .counter-token-number { font-size: 2.5rem; font-weight: 800; color: #4f46e5; margin-bottom: 0.5rem; line-height: 1; }
        .counter-staff-name { font-size: 1rem; color: #1e293b; font-weight: 700; margin-bottom: 0.2rem; }
        .counter-customer-name { font-weight: 500; color: #64748b; font-size: 0.85rem; }
        .counter-timer { font-size: 0.9rem; color: #ef4444; font-weight: 600; margin-top: 0.4rem; }
        
        .counter-idle { padding: 2rem; text-align: center; color: #94a3b8; background: #f8fafc; flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .counter-controls { padding: 1rem; border-top: 1px solid #e2e8f0; display: flex; gap: 0.5rem; background: white; }
        
        .btn-mini { flex: 1; padding: 0.5rem; border-radius: 6px; font-weight: 600; font-size: 0.9rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.25rem; }
        .btn-mini-call { background: #6366f1; color: white; }
        .btn-mini-call:hover { background: #4f46e5; }
        .btn-mini-complete { background: #10b981; color: white; }
        .btn-mini-skip { background: #fee2e2; color: #ef4444; }

        .counter-queue { margin-top: auto; border-top: 1px solid #e2e8f0; background: #fafafa; max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; }
        .queue-header { padding: 0.75rem 1rem; font-size: 0.85rem; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: #fafafa; }
        .mini-token-item { padding: 0.6rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
        .mini-token-item:last-child { border-bottom: none; }
        .mini-token-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; }
        .t-num { font-weight: 700; color: #6366f1; flex-shrink: 0; }
        .t-identity { display: flex; align-items: center; gap: 0.4rem; min-width: 0; }
        .t-name { color: #334155; font-size: 0.85rem; max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
        .t-gender { font-size: 0.7rem; padding: 1px 7px; border-radius: 99px; white-space: nowrap; flex-shrink: 0; }
        .t-gender-male   { background: #dbeafe; color: #1d4ed8; }
        .t-gender-female { background: #fce7f3; color: #be185d; }
        .t-gender-other  { background: #f3e8ff; color: #7c3aed; }
        .t-gender-nd     { background: #f1f5f9; color: #64748b; }
        .mini-token-times { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .t-chip { display: flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 99px; font-size: 0.72rem; font-weight: 600; }
        .t-chip-label { font-weight: 400; opacity: 0.7; margin-right: 1px; }
        .t-waited { background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; }
        .t-est    { background: #eef2ff; color: #4338ca; border: 1px solid #a5b4fc; }
        .mini-empty { padding: 1rem; text-align: center; color: #94a3b8; font-size: 0.85rem; font-style: italic; }
    `],
    template: `
        <div class="layout">
            <app-sidebar (collapseChange)="isSidebarCollapsed = $event"></app-sidebar>
            
            <main class="content" [style.marginLeft.px]="isSidebarCollapsed ? 80 : 250">
                <div class="page-container">
                    <div class="header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h1 style="margin: 0; color: #1e293b;">Queue Management</h1>
                            <p style="color: #64748b; margin: 0.5rem 0 0;">Control waiting lines and call customers</p>
                        </div>
                        <!-- Live clock top-right -->
                        <div style="text-align: right; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.5rem 1rem;">
                            <div style="font-size: 1.4rem; font-weight: 800; color: #1e293b; font-variant-numeric: tabular-nums; letter-spacing: -0.5px;">{{ currentTime }}</div>
                            <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">{{ currentDate }}</div>
                        </div>
                    </div>

                    <!-- Selection Controls -->
                    <div class="controls-card">
                        <div class="control-row">
                            <div class="form-group">
                                <label>Organization</label>
                                <select [(ngModel)]="selectedOrgId" (change)="loadServices()">
                                    <option value="" disabled>Select Organization</option>
                                    <option *ngFor="let org of organizations" [value]="org._id">{{ org.name }}</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Service</label>
                                <select [(ngModel)]="selectedServiceId" (change)="onServiceChange()" [disabled]="!selectedOrgId">
                                    <option value="" disabled>Select Service</option>
                                    <option *ngFor="let service of services" [value]="service._id">{{ service.name }}</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Counter</label>
                                <select [(ngModel)]="selectedCounterId" (change)="refreshQueue()" [disabled]="!selectedServiceId">
                                    <option value="" disabled>Select Counter</option>
                                    <option *ngFor="let counter of currentServiceCounters" [value]="counter._id || counter.name">{{ counter.name }} ({{ counter.staffName || 'Unassigned' }})</option>
                                </select>
                            </div>
                            <button class="btn-call" style="width: auto; padding: 0.75rem 1.5rem; background: #f8fafc; color: #6366f1; border: 1px solid #6366f1; box-shadow: none;" (click)="refreshQueue()" [disabled]="!selectedServiceId">
                                🔄 Refresh
                            </button>
                        </div>

                        <div *ngIf="currentService" class="service-info-row">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <span class="status-badge" 
                                      [style.background]="displayQueueStatus === 'paused' ? '#fef3c7' : '#dcfce7'"
                                      [style.color]="displayQueueStatus === 'paused' ? '#d97706' : '#166534'">
                                    Status: {{ displayQueueStatus | uppercase }}
                                </span>
                                <span *ngIf="displayQueueStartTime" style="color: #64748b; font-size: 0.9rem;">
                                    📅 Opens: {{ displayQueueStartTime | date:'short' }}
                                </span>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button *ngIf="currentService.queueStatus !== 'paused'" (click)="pauseQueue()" class="btn-pause">⏸️ Pause Queue</button>
                                <button *ngIf="currentService.queueStatus === 'paused'" (click)="resumeQueue()" class="btn-resume">▶️ Resume Queue</button>
                                <button (click)="openScheduleModal()" class="btn-schedule">🗓️ Schedule</button>
                            </div>
                        </div>
                    </div>

                    <div *ngIf="selectedServiceId" class="dashboard-container" style="margin-top: 2rem;">
                        
                        <!-- Main Counters Grid -->
                        <div class="counters-section">
                            <h3 style="margin-bottom: 1rem; color: #475569;">Active Counters</h3>
                            <div class="counters-grid">
                                <div *ngFor="let counter of currentServiceCounters" 
                                     class="counter-card" 
                                     [class.active]="counter._id === selectedCounterId"
                                     (click)="selectedCounterId = counter._id; refreshQueue(false)">
                                    
                                    <div class="card-header">
                                        <div>
                                            <h3 style="font-size: 1rem; margin: 0;">{{ counter.name }}</h3>
                                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 0.25rem; margin-top: 0.15rem;">
                                                <span style="opacity: 0.7;">👤</span> {{ counter.staffName || 'Staff' }}
                                            </div>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                                            <span class="status-badge" 
                                                  [style.background]="counter.status === 'paused' ? '#fef3c7' : '#dcfce7'"
                                                  [style.color]="counter.status === 'paused' ? '#d97706' : '#166534'">
                                                {{ counter.status === 'paused' ? 'PAUSED' : (getActiveToken(counter._id) ? 'SERVING' : 'IDLE') }}
                                            </span>
                                            <!-- Per-Counter Pause / Resume -->
                                            <button *ngIf="counter.status !== 'paused'" 
                                                    class="btn-counter-pause" 
                                                    title="Pause this counter"
                                                    (click)="$event.stopPropagation(); pauseCounterById(counter._id)">⏸</button>
                                            <button *ngIf="counter.status === 'paused'" 
                                                    class="btn-counter-resume" 
                                                    title="Resume this counter"
                                                    (click)="$event.stopPropagation(); resumeCounterById(counter._id)">▶</button>
                                        </div>
                                    </div>

                                    <!-- If Serving -->
                                    <div *ngIf="getActiveToken(counter._id) as token" class="counter-token-display">
                                        <div class="counter-token-number">{{ token.tokenNumber }}</div>
                                        <div class="counter-customer-name">{{ token.customerName || 'Guest' }}</div>
                                        <div class="counter-timer">Duration: {{ getDuration(token) }}</div>
                                    </div>

                                    <!-- If Idle -->
                                    <div *ngIf="!getActiveToken(counter._id)" class="counter-idle">
                                        <span style="font-size: 2rem; opacity: 0.5;">💤</span>
                                        <span style="font-size: 0.85rem; color: #94a3b8; font-weight: 600;">Counter is Idle</span>
                                    </div>

                                    <!-- Controls (Only if selected) -->
                                    <div *ngIf="counter._id === selectedCounterId" class="counter-controls">
                                        <ng-container *ngIf="!getActiveToken(counter._id)">
                                            <button class="btn-mini btn-mini-call" (click)="$event.stopPropagation(); callNext()" [disabled]="loading || queue.length === 0">
                                                📢 Call Next
                                            </button>
                                        </ng-container>
                                        <ng-container *ngIf="getActiveToken(counter._id)">
                                            <button class="btn-mini btn-mini-complete" (click)="$event.stopPropagation(); completeToken()">
                                                ✅ Done
                                            </button>
                                            <button class="btn-mini btn-mini-skip" (click)="$event.stopPropagation(); skipToken()">
                                                ⏭️ Skip
                                            </button>
                                        </ng-container>
                                    </div>

                                    <!-- Counter-Specific Waiting List -->
                                    <div class="counter-queue">
                                        <div class="queue-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                            <span style="font-weight: 600; font-size: 0.9rem; text-transform: uppercase; color: #64748b;">In Queue</span>
                                            <span style="background: #e2e8f0; color: #1e293b; padding: 2px 10px; border-radius: 99px; font-weight: 700; font-size: 0.85rem;">
                                                {{ getQueueForCounter(counter._id).length }}
                                            </span>
                                        </div>
                                        <ul class="token-list" style="margin: 0; padding: 0; list-style: none;">
                                            <li *ngFor="let t of getQueueForCounter(counter._id)" class="mini-token-item">
                                                <!-- Row 1: Token number | name + gender badge -->
                                                <div class="mini-token-top">
                                                    <span class="t-num">{{ t.tokenNumber }}</span>
                                                    <div class="t-identity">
                                                        <span class="t-name">{{ t.customerName || 'Guest' }}</span>
                                                        <span class="t-gender"
                                                              [class.t-gender-male]="t.gender === 'male'"
                                                              [class.t-gender-female]="t.gender === 'female'"
                                                              [class.t-gender-other]="t.gender === 'other'"
                                                              [class.t-gender-nd]="!t.gender || t.gender === 'not_disclosed'">
                                                            {{ getGenderLabel(t.gender) }}
                                                        </span>
                                                    </div>
                                                </div>
                                                <!-- Row 2: Labelled time chips -->
                                                <div class="mini-token-times">
                                                    <span class="t-chip t-waited">
                                                        ⏱ <span class="t-chip-label">Waited:</span> {{ getTimeWaited(t.joinedAt) }}
                                                    </span>
                                                    <span class="t-chip t-est">
                                                        🕐 <span class="t-chip-label">Est. wait:</span> {{ formatSeconds(t.estimatedWaitTime) }}
                                                    </span>
                                                </div>
                                            </li>
                                            <li *ngIf="getQueueForCounter(counter._id).length === 0" class="mini-empty">
                                                No customers waiting
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    <div *ngIf="!selectedServiceId" class="empty-state" style="background: white; border-radius: 12px; border: 1px dashed #cbd5e1; margin-top: 2rem;">
                        <span style="font-size: 3rem;">👈</span>
                        <h3>Getting Started</h3>
                        <p>Select an Organization, Service, and Counter above to start managing the queue.</p>
                    </div>

                </div>
            </main>

            <!-- Schedule Modal -->
            <div *ngIf="showScheduleModal" class="modal-overlay" (click)="closeScheduleModal()">
                <div class="modal-content" (click)="$event.stopPropagation()">
                    <div class="modal-header">
                        <h2 style="margin: 0; color: #1e293b;">{{ modalTitle }}</h2>
                        <button (click)="closeScheduleModal()" style="background:none; border:none; font-size: 1.5rem; cursor: pointer;">×</button>
                    </div>

                    <div class="modal-body">
                        <div class="form-group">
                            <label>Start Date & Time</label>
                            <input type="datetime-local" [(ngModel)]="scheduleStartTime" 
                                   style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem;">
                            <small style="color: #64748b; display: block; margin-top: 0.25rem;">Select date and time to open the queue automatically.</small>
                        </div>

                        <div class="form-group">
                            <label>End Date & Time (Optional)</label>
                            <input type="datetime-local" [(ngModel)]="scheduleEndTime" 
                                   style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem;">
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="cancel-btn" (click)="clearSchedule()">Clear Schedule</button>
                        <button type="button" class="submit-btn" (click)="saveSchedule()">Save Schedule</button>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class QueueComponent implements OnInit {
    organizations: any[] = [];
    services: any[] = [];
    queue: any[] = [];
    currentServiceCounters: any[] = [];

    selectedOrgId: string = '';
    selectedServiceId: string = '';
    selectedCounterId: string = ''; // Can be ID or Name based on simplified schema

    activeTokensMap: Map<string, any> = new Map();
    currentToken: any = null;
    loading: boolean = false;
    estimatedWait: number = 0;
    isSidebarCollapsed: boolean = false;
    timerInterval: any;
    currentTime: string = '';
    currentDate: string = '';

    constructor(
        private orgService: OrganizationService,
        private serviceService: ServiceService,
        private queueService: QueueService,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadOrganizations();
        // Tick every second: update live clock + duration timers
        this.timerInterval = setInterval(() => {
            // Update live clock
            const now = new Date();
            this.currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.currentDate = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
            // Silent queue refresh every 5th tick (5 seconds)
            if (now.getSeconds() % 5 === 0 && this.selectedServiceId) {
                this.refreshQueue(false);
            }
            this.cdr.detectChanges(); // Re-evaluate getDuration() bindings
        }, 1000);
        // Init clock immediately
        const now = new Date();
        this.currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.currentDate = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }

    ngOnDestroy() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    loadOrganizations() {
        this.orgService.getOrganizations().subscribe(res => {
            if (res.success && Array.isArray(res.data)) {
                this.organizations = res.data;
                // Auto-select if passed in query params
                const params = this.route.snapshot.queryParams;
                if (params['orgId']) this.selectedOrgId = params['orgId'];
                if (this.organizations.length > 0 && !this.selectedOrgId) this.selectedOrgId = this.organizations[0]._id;

                if (this.selectedOrgId) this.loadServices();
            }
            this.cdr.detectChanges();
        });
    }

    loadServices() {
        if (!this.selectedOrgId) return;
        this.serviceService.getServicesByOrganization(this.selectedOrgId).subscribe(res => {
            if (res.success && Array.isArray(res.data)) {
                this.services = res.data;
                const params = this.route.snapshot.queryParams;
                if (params['serviceId']) this.selectedServiceId = params['serviceId'];

                if (this.selectedServiceId) this.onServiceChange();
            }
            this.cdr.detectChanges();
        });
    }

    currentService: any = null;

    onServiceChange() {
        this.currentService = this.services.find(s => s._id === this.selectedServiceId);
        if (this.currentService) {
            this.currentServiceCounters = this.currentService.counters || [];
            if (this.currentServiceCounters.length > 0) {
                this.selectedCounterId = this.currentServiceCounters[0]._id || this.currentServiceCounters[0].name;
            }
            this.refreshQueue();
        }
    }

    refreshQueue(showLoading: boolean = true) {
        if (!this.selectedServiceId) return;
        if (showLoading) this.loading = true;

        this.queueService.getQueueStatus(this.selectedServiceId).subscribe({
            next: (res: any) => {
                console.log('Queue status response:', res);
                const data = res.data || res;

                // Backend returns waitingTokens, not queue
                let tokens: any[] = data.waitingTokens || data.queue || [];

                // Map token properties - backend uses 'number', frontend expects 'tokenNumber'
                this.queue = (tokens as any[]).map((t: any) => ({
                    ...t,
                    tokenNumber: t.number || t.tokenNumber,
                    status: t.status || 'waiting',
                    joinedAt: t.joinedAt || t.createdAt || new Date()
                }));

                // Filter waiting tokens
                this.queue = this.queue.filter((t: any) => t.status === 'waiting');

                // Get wait time from queueStatus
                const status = data.queueStatus || {};
                this.estimatedWait = status.averageWaitTime ? Math.round(status.averageWaitTime) : 0;

                this.estimatedWait = status.averageWaitTime ? Math.round(status.averageWaitTime) : 0;

                this.updateServingTokens();

                if (showLoading) this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Queue refresh error:', err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }


    updateServingTokens() {
        if (!this.selectedServiceId) {
            this.activeTokensMap.clear();
            this.currentToken = null;
            return;
        }

        this.queueService.getServiceTokens(this.selectedServiceId).subscribe(res => {
            if (res.success && Array.isArray(res.data)) {
                this.activeTokensMap.clear();

                // Find active tokens
                const active = res.data.filter((t: any) => t.status === 'serving' || t.status === 'called');

                active.forEach((t: any) => {
                    // Try to match token's counter reference to a known counter
                    const counter = this.currentServiceCounters.find(c =>
                        c._id === t.counterId || c.name === t.counterId
                    );
                    if (counter) {
                        this.activeTokensMap.set(counter._id, t);
                    }
                });

                // Update selected counter's active token
                if (this.selectedCounterId) {
                    this.currentToken = this.activeTokensMap.get(this.selectedCounterId) || null;
                }

                this.cdr.detectChanges();
            }
        });
    }

    // Helper to handle counter ID/Name mismatch if schema varies
    getCounterName(id: string): string {
        const counter = this.currentServiceCounters.find(c => c._id === id || c.name === id);
        return counter ? counter.name : id;
    }

    getActiveToken(counterId: string): any {
        return this.activeTokensMap.get(counterId);
    }

    getQueueForCounter(counterId: string): any[] {
        // Strict allocation: Show ONLY tokens assigned to this counter
        return this.queue.filter(t => t.counterId === counterId);
    }

    callNext() {
        if (!this.selectedCounterId) {
            alert('Please select a counter first.');
            return;
        }
        this.loading = true;
        this.queueService.callNextToken(this.selectedServiceId, this.selectedCounterId).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.currentToken = res.data;
                    this.refreshQueue(false);
                } else {
                    alert('No customers waiting.');
                    this.loading = false;
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                alert(err.error?.message || 'Failed to call next');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    completeToken() {
        if (!this.currentToken) return;
        this.loading = true;
        this.queueService.serveToken(this.currentToken._id).subscribe({
            next: (res) => {
                this.currentToken = null;
                this.refreshQueue(false);
            },
            error: (err) => {
                alert('Error completing token');
                this.loading = false;
            }
        });
    }

    skipToken() {
        if (!this.currentToken) return;
        if (confirm('Skip this customer?')) {
            this.loading = true;
            this.queueService.skipToken(this.currentToken._id).subscribe({
                next: (res) => {
                    this.currentToken = null;
                    this.refreshQueue(false);
                },
                error: (err) => {
                    alert('Error skipping token');
                    this.loading = false;
                }
            });
        }
    }



    /** Per-token elapsed service duration — each counter passes its OWN token */
    getDuration(token?: any): string {
        const t = token || this.currentToken;
        if (!t || !t.calledAt) return '00:00';
        const diff = Math.floor((Date.now() - new Date(t.calledAt).getTime()) / 1000);
        if (diff < 0) return '00:00';
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    // Queue Control Methods
    pauseQueue() {
        if (!this.selectedServiceId) return;
        const message = prompt('Enter pause message (optional):', 'Queue is temporarily paused. Please wait.');
        this.serviceService.pauseQueue(this.selectedServiceId, message || undefined).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    alert('Queue paused successfully');
                    this.loadServices(); // Reload to update status
                }
            },
            error: (err) => alert(err.error?.message || 'Failed to pause queue')
        });
    }

    resumeQueue() {
        if (!this.selectedServiceId) return;
        this.serviceService.resumeQueue(this.selectedServiceId).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    alert('Queue resumed successfully');
                    this.loadServices(); // Reload to update status
                }
            },
            error: (err) => alert(err.error?.message || 'Failed to resume queue')
        });
    }

    // Per-Counter Pause/Resume
    pauseCounterById(counterId: string) {
        if (!this.selectedServiceId || !counterId) return;
        this.serviceService.pauseCounter(this.selectedServiceId, counterId).subscribe({
            next: (res: any) => {
                if (res.success) {
                    // Update local counter status immediately for instant UI feedback
                    const counter = this.currentServiceCounters.find((c: any) => c._id === counterId);
                    if (counter) counter.status = 'paused';
                    this.cdr.detectChanges();
                }
            },
            error: (err: any) => alert(err.error?.message || 'Failed to pause counter')
        });
    }

    resumeCounterById(counterId: string) {
        if (!this.selectedServiceId || !counterId) return;
        this.serviceService.resumeCounter(this.selectedServiceId, counterId).subscribe({
            next: (res: any) => {
                if (res.success) {
                    // Update local counter status immediately for instant UI feedback
                    const counter = this.currentServiceCounters.find((c: any) => c._id === counterId);
                    if (counter) counter.status = 'active';
                    this.cdr.detectChanges();
                    // Refresh queue to reflect redistributed tokens
                    this.refreshQueue(false);
                }
            },
            error: (err: any) => alert(err.error?.message || 'Failed to resume counter')
        });
    }

    // Getters for Display Logic
    get displayQueueStatus(): string {
        // Check if counter specifically scheduled
        if (this.selectedCounterId) {
            const counter = this.currentServiceCounters.find(c => c._id === this.selectedCounterId);
            if (counter) {
                if (counter.queueStartTime) {
                    const start = new Date(counter.queueStartTime);
                    if (start > new Date()) return 'scheduled';
                    // If started and not paused, it is active (overrides service status)
                    return counter.status === 'paused' ? 'paused' : 'active';
                }
                // No schedule, check pause
                if (counter.status === 'paused') return 'paused';
            }
        }
        return this.currentService ? this.currentService.queueStatus : 'active';
    }

    get displayQueueStartTime(): string | Date | null {
        if (this.selectedCounterId) {
            const counter = this.currentServiceCounters.find(c => c._id === this.selectedCounterId);
            if (counter && counter.queueStartTime) return counter.queueStartTime;
        }
        return this.currentService ? this.currentService.queueStartTime : null;
    }

    // Schedule Modal
    showScheduleModal: boolean = false;
    modalTitle: string = '🗓️ Queue Schedule';
    scheduleStartTime: string = '';
    scheduleEndTime: string = '';

    openScheduleModal() {
        if (!this.selectedServiceId) return;
        const service = this.services.find(s => s._id === this.selectedServiceId);
        if (!service) return;

        let startTime = service.queueStartTime;
        let endTime = service.queueEndTime;

        // Check for specific counter
        const counter = this.currentServiceCounters.find(c => c._id === this.selectedCounterId);
        if (counter) {
            this.modalTitle = `🗓️ Schedule: ${counter.name}`;
            startTime = counter.queueStartTime;
            endTime = counter.queueEndTime;
        } else {
            this.modalTitle = '🗓️ Service Schedule';
        }

        // Pre-fill
        this.scheduleStartTime = startTime ? this.toDatetimeLocal(startTime) : '';
        this.scheduleEndTime = endTime ? this.toDatetimeLocal(endTime) : '';

        this.showScheduleModal = true;
    }

    closeScheduleModal() {
        this.showScheduleModal = false;
        this.scheduleStartTime = '';
        this.scheduleEndTime = '';
    }

    saveSchedule() {
        if (!this.selectedServiceId) return;

        const startTime = this.scheduleStartTime ? new Date(this.scheduleStartTime).toISOString() : undefined;
        const endTime = this.scheduleEndTime ? new Date(this.scheduleEndTime).toISOString() : undefined;

        // Pass selectedCounterId if available
        const counterId = this.selectedCounterId;

        this.serviceService.setSchedule(
            this.selectedServiceId,
            startTime,
            endTime,
            counterId
        ).subscribe({
            next: (res) => {
                if (res.success) {
                    alert('Schedule updated');
                    this.loadServices(); // Reloads services and currentServiceCounters
                    this.closeScheduleModal();
                }
            },
            error: (err) => alert(err.error?.message || 'Failed to set schedule')
        });
    }

    clearSchedule() {
        if (!this.selectedServiceId) return;
        const counterId = this.selectedCounterId;

        this.serviceService.setSchedule(this.selectedServiceId, '', '', counterId).subscribe({
            next: (res) => {
                if (res.success) {
                    alert('Schedule cleared');
                    this.loadServices();
                    this.closeScheduleModal();
                }
            },
            error: (err) => alert(err.error?.message || 'Failed to clear schedule')
        });
    }

    // Helper: Convert date to datetime-local input format
    toDatetimeLocal(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Adjust for timezone offset to get local ISO string
        const tzOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - tzOffset);
        return localDate.toISOString().slice(0, 16);
    }

    /** Map raw gender value to a short display label */
    getGenderLabel(gender: string): string {
        const map: Record<string, string> = {
            male: '♂ Male',
            female: '♀ Female',
            other: '⚧ Other',
            not_disclosed: '🔒 Private'
        };
        return map[gender] || '🔒 Private';
    }

    /** Human-readable actual time a customer has been waiting */
    getTimeWaited(joinedAt: string): string {
        if (!joinedAt) return '--';
        const diff = Date.now() - new Date(joinedAt).getTime();
        if (diff < 60000) return '<1 min';
        const totalMins = Math.floor(diff / 60000);
        if (totalMins < 60) return `${totalMins} min`;
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }

    /** Format estimated wait seconds → readable string used in token chips */
    formatSeconds(seconds: number): string {
        if (!seconds || seconds <= 0) return 'Soon';
        const totalMins = Math.round(seconds / 60);
        if (totalMins < 1) return 'Soon';
        if (totalMins < 60) return `${totalMins} min`;
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
}
