import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrganizationService } from '../../services/organization.service';
import { ServiceService } from '../../services/service.service';
import { QueueService } from '../../services/queue.service';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

type FlowStep = 'service-selection' | 'priority-selection' | 'generating' | 'tracker';

@Component({
    selector: 'app-customer-join',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    styles: [`
        .customer-container { min-height: 100vh; background: linear-gradient(135deg, #0f172a, #1e293b); color: white; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; }
        .bg-animated { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: -1; background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 70%); animation: pulseBg 10s infinite; }
        @keyframes pulseBg { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.8; } }

        /* Header */
        .header { padding: 2rem 1.5rem; text-align: center; }
        .org-name { font-size: 1.75rem; font-weight: 800; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .welcome { font-size: 1rem; color: #94a3b8; margin-top: 0.5rem; }

        /* Step 1: Services */
        .service-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; padding: 1.5rem; flex: 1; }
        .service-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); padding: 1.5rem; border-radius: 16px; transition: all 0.3s; cursor: pointer; display: flex; align-items: center; justify-content: space-between; }
        .service-card:hover { transform: translateY(-3px); border-color: #6366f1; background: rgba(99, 102, 241, 0.05); }
        .service-card.selected { background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2)); border-color: #6366f1; }
        .service-info h3 { margin: 0; font-size: 1.25rem; font-weight: 700; }
        .service-meta { display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.85rem; color: #94a3b8; }
        .live-count { color: #4ade80; display: flex; align-items: center; gap: 0.25rem; }
        .wait-time { color: #fbbf24; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

        /* Step 2: Priority */
        .priority-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; padding: 1.5rem; }
        .priority-card { background: rgba(255, 255, 255, 0.03); border: 2px solid rgba(255, 255, 255, 0.1); padding: 1.5rem; border-radius: 20px; text-align: left; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }
        .priority-card.selected { border-color: #6366f1; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent); transform: scale(1.02); }
        .priority-icon { font-size: 2rem; margin-bottom: 0.75rem; display: block; }
        .priority-label { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem; }
        .priority-desc { font-size: 0.85rem; color: #94a3b8; }

        /* Token Tracker */
        .token-hero { text-align: center; padding: 3rem 1.5rem; }
        .token-num-glow { font-size: 5rem; font-weight: 900; background: linear-gradient(135deg, #fff, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.4)); animation: glow 2s infinite alternate; }
        @keyframes glow { from { filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.3)); } to { filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.6)); } }
        .status-badge { display: inline-block; padding: 0.5rem 1.5rem; border-radius: 99px; font-weight: 700; margin-top: 1rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
        .status-waiting { background: #d97706; }
        .status-called { background: #059669; animation: flash 0.5s infinite; }
        @keyframes flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

        .tracker-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding: 0 1.5rem; }
        .tracker-item { background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.08); }
        .tracker-item.highlight-amber { background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.3); }
        .tracker-item.highlight-indigo { background: rgba(99, 102, 241, 0.12); border-color: rgba(99, 102, 241, 0.3); }
        .tracker-val { font-size: 1.4rem; font-weight: 800; display: block; }
        .tracker-val-amber { color: #fbbf24; }
        .tracker-val-indigo { color: #818cf8; }
        .tracker-lbl { font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.3rem; display: block; }

        /* Queue Visualization - Vertical Scroll */
        .queue-viz { padding: 1rem 1.5rem; max-height: 350px; overflow-y: auto; scroll-behavior: smooth; }
        .queue-viz::-webkit-scrollbar { width: 4px; }
        .queue-viz::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.5); border-radius: 99px; }
        .queue-line { display: flex; flex-direction: column; gap: 0.5rem; }
        .queue-box { width: 100%; padding: 0.85rem 1rem; background: rgba(255,255,255,0.03); border-radius: 10px; display: flex; align-items: center; justify-content: space-between; font-weight: 600; border: 1px solid rgba(255,255,255,0.08); font-size: 0.95rem; transition: all 0.3s; }
        .queue-box.me { background: linear-gradient(135deg, #6366f1, #a855f7); border-color: #8b5cf6; box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); transform: scale(1.02); }
        .queue-box.passed { opacity: 0.35; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); }
        .queue-box.ahead { opacity: 0.7; }
        .priority-star { font-size: 0.9rem; margin-left: 0.5rem; }
        .queue-position { font-size: 0.75rem; color: #64748b; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 99px; }
        .counter-badge { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 0.5rem 1rem; border-radius: 99px; font-size: 0.9rem; font-weight: 700; margin-top: 1rem; display: inline-block; }

        /* Name field inside priority page */
        .name-field-wrap { margin-bottom: 1.25rem; padding: 0 1.5rem; }
        .name-field-wrap label { display: block; font-size: 0.8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; }
        .name-input { width: 100%; padding: 0.9rem 1rem; border: 2px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); border-radius: 12px; font-size: 1.1rem; color: white; outline: none; transition: border-color 0.3s; box-sizing: border-box; }
        .name-input:focus { border-color: #6366f1; background: rgba(99,102,241,0.08); }
        .name-input::placeholder { color: #475569; }

        /* Gender selector */
        .gender-field-wrap { margin-bottom: 1.25rem; padding: 0 1.5rem; }
        .gender-field-wrap label { display: block; font-size: 0.8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; }
        .gender-btn { width: 100%; padding: 0.9rem 1rem; border: 2px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); border-radius: 12px; font-size: 1.05rem; color: white; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: border-color 0.3s; }
        .gender-btn:hover, .gender-btn.selected { border-color: #6366f1; background: rgba(99,102,241,0.08); }
        .gender-btn-arrow { color: #64748b; font-size: 0.85rem; }

        /* Gender bottom sheet overlay */
        .gender-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 500; display: flex; align-items: flex-end; animation: fadeIn 0.2s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .gender-sheet { width: 100%; background: #1e293b; border-radius: 24px 24px 0 0; padding: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); animation: slideUp 0.3s cubic-bezier(0.4,0,0.2,1); }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .gender-sheet-title { font-size: 1rem; font-weight: 700; color: #94a3b8; text-align: center; margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 1px; }
        .gender-option { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-radius: 14px; margin-bottom: 0.6rem; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; }
        .gender-option:hover { background: rgba(255,255,255,0.06); }
        .gender-option.active { border-color: #6366f1; background: rgba(99,102,241,0.12); }
        .gender-option-icon { font-size: 1.75rem; width: 44px; text-align: center; }
        .gender-option-text .gender-option-label { font-size: 1.05rem; font-weight: 700; display: block; }
        .gender-option-text .gender-option-sub { font-size: 0.8rem; color: #64748b; }
        .gender-checkmark { margin-left: auto; color: #6366f1; font-size: 1.25rem; }
        .gender-done-btn { width: 100%; padding: 0.9rem; border-radius: 12px; border: none; background: linear-gradient(to right, #6366f1, #8b5cf6); color: white; font-size: 1rem; font-weight: 700; cursor: pointer; margin-top: 0.5rem; }

        /* Alert Banner */
        .alert-banner { position: fixed; top: 0; left: 0; right: 0; background: linear-gradient(to right, #059669, #10b981); padding: 1.5rem; z-index: 1000; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5); animation: slideDown 0.5s forwards; }
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        .alert-msg { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.5px; }

        /* Footer */
        .btn-footer { padding: 1.5rem; margin-top: auto; }
        .btn-primary { width: 100%; padding: 1rem; border-radius: 12px; border: none; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: all 0.3s; background: linear-gradient(to right, #6366f1, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .btn-primary:active { transform: scale(0.98); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-pulse { animation: pulseBtn 2s infinite; }
        @keyframes pulseBtn { 0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); } 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); } }

        .loading-ring { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    `],
    template: `
        <!-- Gender Bottom Sheet -->
        <div *ngIf="showGenderPicker" class="gender-overlay" (click)="showGenderPicker = false">
            <div class="gender-sheet" (click)="$event.stopPropagation()">
                <div class="gender-sheet-title">Select Gender</div>
                <div *ngFor="let g of genderOptions"
                     class="gender-option"
                     [class.active]="selectedGender === g.id"
                     (click)="selectedGender = g.id">
                    <span class="gender-option-icon">{{ g.icon }}</span>
                    <div class="gender-option-text">
                        <span class="gender-option-label">{{ g.label }}</span>
                        <span class="gender-option-sub">{{ g.sub }}</span>
                    </div>
                    <span *ngIf="selectedGender === g.id" class="gender-checkmark">✔️</span>
                </div>
                <button class="gender-done-btn" (click)="showGenderPicker = false">Done ✓</button>
            </div>
        </div>

        <div class="customer-container">
            <div class="bg-animated"></div>

            <!-- Called Alert Header -->
            <div *ngIf="currentToken?.status === 'called' && showCalledAlert" class="alert-banner" (click)="dismissAlert()">
                <div class="alert-msg">🚀 GO TO {{ currentToken.counterName || 'COUNTER' }}</div>
                <div style="font-size: 0.8rem; margin-top: 0.5rem;">Tap to dismiss</div>
            </div>

            <header class="header">
                <div class="org-name">{{ organization?.name || 'LineLess' }}</div>
                <div class="welcome" *ngIf="step !== 'tracker'">Welcome! Choose a service to join the line.</div>
            </header>

            <!-- Queue Status Banner -->
            <div *ngIf="selectedService?.queueStatus === 'paused'" 
                 style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 1.5rem; border-radius: 12px; margin: 1rem; text-align: center; border: 2px solid #f59e0b;">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⏸️</div>
                <div style="font-size: 1.2rem; font-weight: 700; color: #92400e;">Queue is Temporarily Paused</div>
                <div style="color: #b45309; margin-top: 0.5rem;">{{ selectedService?.pauseMessage || 'Please wait while we get things ready.' }}</div>
            </div>

            <div *ngIf="selectedService?.queueStatus === 'scheduled'" 
                 style="background: linear-gradient(135deg, #e0e7ff, #c7d2fe); padding: 1.5rem; border-radius: 12px; margin: 1rem; text-align: center; border: 2px solid #6366f1;">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🗓️</div>
                <div style="font-size: 1.2rem; font-weight: 700; color: #4338ca;">Queue Opens Soon</div>
                <div style="color: #6366f1; margin-top: 0.5rem;">Opens at {{ formatScheduleTime(selectedService?.queueStartTime) }}</div>
            </div>


            <!-- Step 1: Service Selection -->
            <div *ngIf="step === 'service-selection'" class="service-grid">
                <div *ngFor="let s of services" class="service-card" 
                     [class.selected]="selectedService?._id === s._id"
                     (click)="selectService(s)">
                    <div class="service-info">
                        <h3>{{ s.name }}</h3>
                        <div class="service-meta">
                            <span class="live-count">👥 {{ s.stats?.waitingCount || 0 }} waiting</span>
                            <span class="wait-time">⏱️ {{ s.stats?.avgWaitTime || 0 }}m</span>
                        </div>
                    </div>
                    <div *ngIf="selectedService?._id === s._id" class="checkmark">✅</div>
                </div>
            </div>

            <!-- Step 2: Priority + Name (combined) -->
            <div *ngIf="step === 'priority-selection'" style="flex: 1; display: flex; flex-direction: column; padding-top: 2rem; overflow-y: auto;">
                <!-- Service context banner -->
                <div style="text-align: center; padding: 0 1.5rem; margin-bottom: 1.5rem;">
                    <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Joining service</div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: #c7d2fe; margin-top: 0.25rem;">{{ selectedService?.name }}</div>
                </div>

                <!-- Name field at top -->
                <div class="name-field-wrap">
                    <label for="cust-name">👤 Your Name</label>
                    <input id="cust-name"
                           type="text"
                           [(ngModel)]="customerName"
                           class="name-input"
                           placeholder="e.g. Priya Sharma"
                           maxlength="50"
                           (keyup.enter)="generateToken()">
                </div>

                <!-- Gender selector -->
                <div class="gender-field-wrap">
                    <label>⚧ Gender</label>
                    <button class="gender-btn" [class.selected]="selectedGender !== 'not_disclosed'" (click)="showGenderPicker = true">
                        <span>{{ getGenderDisplay() }}</span>
                        <span class="gender-btn-arrow">▾ Select</span>
                    </button>
                </div>

                <!-- Priority options -->
                <div style="padding: 0 1.5rem 1rem;">
                    <div style="font-size: 0.8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">Any special requirements?</div>
                    <div class="priority-grid" style="padding: 0;">
                        <div *ngFor="let p of priorityOptions" class="priority-card"
                             [class.selected]="selectedPriority === p.id"
                             (click)="selectedPriority = p.id">
                            <span class="priority-icon">{{ p.icon }}</span>
                            <div class="priority-label">{{ p.label }}</div>
                            <div class="priority-desc">{{ p.desc }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 3: Generating -->
            <div *ngIf="step === 'generating'" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div class="loading-ring"></div>
                <p style="margin-top: 2rem; font-weight: 600;">Generating your token...</p>
            </div>

            <!-- Step 4: Tracker -->
            <div *ngIf="step === 'tracker' && currentToken" style="flex: 1; display: flex; flex-direction: column;">
                <div class="token-hero">
                    <div style="color: #94a3b8; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-size: 0.75rem;">Your Token</div>
                    <div class="token-num-glow">{{ currentToken.tokenNumber }}</div>
                    <!-- Service name -->
                    <div *ngIf="selectedService?.name" style="color: #c7d2fe; font-size: 1rem; font-weight: 600; margin-top: 0.25rem;">
                        {{ selectedService.name }}
                    </div>
                    <div class="status-badge" [class.status-waiting]="currentToken.status === 'waiting'" [class.status-called]="currentToken.status === 'called'">
                        {{ currentToken.status === 'called' ? '🚀 Called!' : '⏳ Waiting' }}
                    </div>
                    <div *ngIf="currentToken.counterName" class="counter-badge">
                        🎯 Proceed to {{ currentToken.counterName }}
                    </div>
                </div>

                <!-- 4-item tracker grid -->
                <div class="tracker-grid">
                    <div class="tracker-item">
                        <span class="tracker-val">{{ currentPosition }}</span>
                        <span class="tracker-lbl">Ahead of You</span>
                    </div>
                    <div class="tracker-item" [class.highlight-amber]="true">
                        <span class="tracker-val tracker-val-amber">⏱ {{ getTimeWaited(currentToken.joinedAt) }}</span>
                        <span class="tracker-lbl">Actual Wait</span>
                    </div>
                    <div class="tracker-item" [class.highlight-indigo]="true">
                        <span class="tracker-val tracker-val-indigo">🕐 {{ formatEstWait(currentToken.estimatedWaitTime) }}</span>
                        <span class="tracker-lbl">Est. Remaining</span>
                    </div>
                    <div class="tracker-item">
                        <span class="tracker-val" style="font-size: 1.1rem;">{{ currentToken.priority === 'priority' ? '⭐ Priority' : '🎫 Regular' }}</span>
                        <span class="tracker-lbl">Queue Type</span>
                    </div>
                </div>

                <!-- Vertical Queue Visualization -->
                <div style="padding: 0 1.5rem; margin-top: 1rem;">
                    <div style="color: #94a3b8; font-weight: 600; margin-bottom: 0.75rem; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
                        <span>📋 QUEUE ORDER</span>
                        <span style="font-size: 0.75rem;">{{ queueBoxes.length }} in line</span>
                    </div>
                </div>
                <div class="queue-viz" #queueViz>
                    <div class="queue-line">
                        <div *ngFor="let box of queueBoxes; let i = index" 
                             class="queue-box" 
                             [class.me]="box.isMe"
                             [class.passed]="box.passed"
                             [class.ahead]="!box.passed && !box.isMe"
                             [id]="box.isMe ? 'my-token' : ''">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <span class="queue-position">#{{ i + 1 }}</span>
                                <span>{{ box.num }}</span>
                                <span *ngIf="box.name && box.isMe" style="color: #c7d2fe; font-size: 0.85rem;">{{ box.name }}</span>
                                <span *ngIf="box.isPriority" class="priority-star">⭐</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span *ngIf="box.passed" style="font-size: 0.75rem; color: #10b981;">✓ Done</span>
                                <span *ngIf="box.isMe" style="font-size: 0.8rem; color: #c7d2fe; font-weight: 700;">← YOU</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="padding: 1.5rem; text-align: center; color: #94a3b8; font-size: 0.9rem;">
                    Don't close this page. We'll alert you when it's your turn!
                </div>
            </div>

            <footer class="btn-footer">
                <button *ngIf="step === 'service-selection'" 
                        class="btn-primary" 
                        [disabled]="!selectedService || !isQueueActive()"
                        (click)="goToPriority()">
                    {{ getButtonText() }}
                </button>

                <button *ngIf="step === 'priority-selection'"
                        class="btn-primary btn-pulse"
                        [disabled]="!customerName.trim()"
                        (click)="generateToken()">
                    Get Token 🎫
                </button>

                <div *ngIf="step === 'tracker'" style="display: flex; gap: 0.5rem;">
                    <button class="btn-primary" style="background: rgba(255,255,255,0.1); color: #94a3b8;" (click)="showInfo()">
                        Report Issue
                    </button>
                    <button class="btn-primary" (click)="share()">
                        Share Link 🔗
                    </button>
                </div>
            </footer>
        </div>
    `
})
export class CustomerJoinComponent implements OnInit, OnDestroy {
    step: FlowStep = 'service-selection';
    organization: any;
    services: any[] = [];
    selectedService: any;
    selectedPriority: string = 'normal';
    selectedGender: string = 'not_disclosed';
    showGenderPicker: boolean = false;
    customerName: string = '';
    currentToken: any;
    currentPosition: number = 0;
    queueBoxes: any[] = [];
    showCalledAlert: boolean = true;

    priorityOptions = [
        { id: 'normal', icon: '🎫', label: 'Regular Queue', desc: 'Standard waiting line' },
        { id: 'senior', icon: '👴', label: 'Senior Citizen', desc: 'Age 60 or above' },
        { id: 'expectant_mother', icon: '🤰', label: 'Expectant Mother', desc: 'Priority for moms-to-be' },
        { id: 'pwd', icon: '♿', label: 'Persons with Disability', desc: 'Accessible priority' }
    ];

    genderOptions = [
        { id: 'male', icon: '👮', label: 'Male', sub: 'Man / Boy' },
        { id: 'female', icon: '👩', label: 'Female', sub: 'Woman / Girl' },
        { id: 'other', icon: '🌈', label: 'Others', sub: 'Non-binary / Gender fluid / etc.' },
        { id: 'not_disclosed', icon: '🔒', label: 'Not ready to disclose', sub: 'Your privacy is respected' }
    ];

    private id: string = '';
    private pollSubscription: Subscription | null = null;

    constructor(
        private route: ActivatedRoute,
        private orgService: OrganizationService,
        private serviceService: ServiceService,
        private queueService: QueueService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];

        // Check if user already has a token in localStorage for THIS page
        const savedToken = localStorage.getItem('activeToken');
        const savedServiceId = localStorage.getItem('activeTokenServiceId');
        const savedCustomerName = localStorage.getItem('customerName');

        if (savedToken && savedServiceId === this.id) {
            // User has an existing token for this service - show tracker
            this.currentToken = JSON.parse(savedToken);
            this.customerName = savedCustomerName || '';
            this.step = 'tracker';
            this.loadInitialData();
            this.startTracking();
        } else {
            // No existing token or different service - start fresh
            this.loadInitialData();
        }
    }

    ngOnDestroy() {
        if (this.pollSubscription) this.pollSubscription.unsubscribe();
    }

    loadInitialData() {
        // Try fetching as organization
        this.orgService.getPublicOrganization(this.id).subscribe({
            next: (res) => {
                this.organization = res.data;
                this.loadPublicServices(this.id);
            },
            error: () => {
                // If not org, try fetching as service
                this.serviceService.getPublicService(this.id).subscribe(res => {
                    this.selectedService = res.data;
                    this.loadPublicOrganization(this.selectedService.organizationId);
                    // Skip selection if direct service scan
                    this.step = 'priority-selection';
                    this.cdr.detectChanges();
                });
            }
        });
    }

    loadPublicOrganization(orgId: string) {
        this.orgService.getPublicOrganization(orgId).subscribe(res => {
            this.organization = res.data;
            this.cdr.detectChanges();
        });
    }

    loadPublicServices(orgId: string) {
        this.serviceService.getPublicServicesByOrganization(orgId).subscribe(res => {
            if (res.success && Array.isArray(res.data)) {
                this.services = res.data;
            }
            this.cdr.detectChanges();
        });
    }

    selectService(s: any) {
        this.selectedService = s;
        this.cdr.detectChanges();
    }

    goToPriority() {
        this.step = 'priority-selection';
        this.cdr.detectChanges();
    }

    generateToken() {
        this.step = 'generating';
        this.cdr.detectChanges();

        const data = {
            serviceId: this.selectedService._id,
            priority: this.selectedPriority === 'normal' ? 'normal' : 'priority',
            priorityReason: this.selectedPriority !== 'normal' ? this.selectedPriority : null,
            customerName: this.customerName || 'Guest',
            gender: this.selectedGender || 'not_disclosed'
        };

        this.queueService.joinQueue(data as any).subscribe({
            next: (res: any) => {
                console.log('Join queue response:', res);
                if (res.success && res.data) {
                    // Map the response to expected format
                    const tokenData = res.data.token || res.data;
                    this.currentToken = {
                        _id: tokenData.id || tokenData._id,
                        tokenNumber: tokenData.number || tokenData.tokenNumber,
                        position: tokenData.position || 1,
                        estimatedWaitTime: tokenData.estimatedWaitTime || 5,
                        priority: tokenData.priority || 'normal',
                        status: tokenData.status || 'waiting',
                        counterId: tokenData.counterId,
                        counterName: tokenData.counterName || (tokenData.counterId ? 'Counter' : null),
                        customerName: this.customerName,
                        joinedAt: tokenData.joinedAt || new Date().toISOString() // Track from join time
                    };
                    console.log('Mapped token:', this.currentToken);

                    // Save comprehensive data to localStorage
                    localStorage.setItem('activeToken', JSON.stringify(this.currentToken));
                    localStorage.setItem('activeTokenServiceId', this.selectedService._id);
                    localStorage.setItem('customerName', this.customerName);

                    this.step = 'tracker';
                    this.startTracking();
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Join queue error:', err);
                const msg = err.error?.error || err.message || 'Connection error. Please try again.';
                alert(msg);
                this.step = 'priority-selection';
                this.cdr.detectChanges();
            }
        });
    }


    startTracking() {
        this.updateQueueState();
        this.pollSubscription = interval(5000).subscribe(() => {
            this.updateQueueState();
        });
    }

    updateQueueState() {
        if (!this.currentToken?._id) return;

        this.queueService.getToken(this.currentToken._id).subscribe((res: any) => {
            console.log('Token status response:', res);
            if (res.success && res.data) {
                const updated = res.data;

                // Alert if called
                if (updated.status === 'called' && this.currentToken.status !== 'called') {
                    this.triggerVibration();
                    this.showCalledAlert = true;
                }

                // Map response - status API returns 'number' not 'tokenNumber'
                this.currentToken = {
                    ...this.currentToken,
                    tokenNumber: updated.number || this.currentToken.tokenNumber,
                    position: updated.position || this.currentToken.position,
                    estimatedWaitTime: updated.estimatedWaitTime ?? this.currentToken.estimatedWaitTime,
                    joinedAt: updated.joinedAt || this.currentToken.joinedAt,
                    status: updated.status || this.currentToken.status,
                    counterId: updated.counterId || this.currentToken.counterId,
                    counterName: updated.counterName || this.currentToken.counterName,
                    priority: updated.priority || this.currentToken.priority
                };

                // Also persist joinedAt from initial token generation
                if (!this.currentToken.joinedAt) {
                    const saved = localStorage.getItem('activeToken');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        this.currentToken.joinedAt = parsed.joinedAt;
                    }
                }

                this.currentPosition = Math.max(0, (this.currentToken.position || 1) - 1);
                this.generateQueueBoxes();
                this.cdr.detectChanges();

                if (updated.status === 'served' || updated.status === 'skipped') {
                    localStorage.removeItem('activeToken');
                    // Maybe show a 'Thank you' screen
                }
            }
        });
    }


    generateQueueBoxes() {
        const boxes = [];
        const pos = this.currentToken.position || 1;
        const totalInLine = Math.max(pos + 3, 5); // Show at least 5 positions

        // Show positions before current, the current, and a few after
        for (let i = 1; i <= totalInLine; i++) {
            const isMe = i === pos;
            boxes.push({
                num: isMe ? this.currentToken.tokenNumber : `T${String(i).padStart(3, '0')}`,
                name: isMe ? this.currentToken.customerName : null,
                isMe: isMe,
                passed: i < pos,
                isPriority: isMe && this.currentToken.priority === 'priority'
            });
        }
        this.queueBoxes = boxes;

        // Scroll to user's position after render
        setTimeout(() => {
            const myToken = document.getElementById('my-token');
            if (myToken) {
                myToken.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }

    triggerVibration() {
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }

    dismissAlert() {
        this.showCalledAlert = false;
        this.cdr.detectChanges();
    }

    share() {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({ title: 'My Token Tracker', url });
        } else {
            prompt('Copy this link to track your token:', url);
        }
    }

    showInfo() {
        alert('Support contact: support@lineless.com');
    }

    /** Display label for the gender selection button */
    getGenderDisplay(): string {
        const found = this.genderOptions.find(g => g.id === this.selectedGender);
        return found ? `${found.icon} ${found.label}` : '🔒 Not ready to disclose';
    }

    // Queue status helpers
    isQueueActive(): boolean {
        if (!this.selectedService) return false;
        const status = this.selectedService.queueStatus || 'active';
        return status === 'active';
    }

    getButtonText(): string {
        if (!this.selectedService) return 'Next Stage ➜';
        const status = this.selectedService.queueStatus;
        if (status === 'paused') return '⏸️ Queue Paused';
        if (status === 'scheduled') return '🗓️ Queue Not Started';
        return 'Next Stage ➜';
    }

    /** Actual time the customer has been waiting since they joined */
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

    /** Format estimated wait (already in whole minutes from API) */
    formatEstWait(minutes: number): string {
        if (!minutes || minutes <= 0) return 'Soon';
        if (minutes < 60) return `${minutes} min`;
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }

    formatScheduleTime(dateString: string): string {
        if (!dateString) return 'Soon';
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

