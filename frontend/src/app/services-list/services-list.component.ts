import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ServiceService } from '../services/service.service';
import { OrganizationService } from '../services/organization.service';
import { SidebarComponent } from '../components/sidebar/sidebar.component';

@Component({
    selector: 'app-services-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
    styles: [`
        .layout { display: flex; min-height: 100vh; background: #f8fafc; }
        .content { flex: 1; transition: margin-left 0.3s ease; padding: 2rem; width: 100%; box-sizing: border-box; }
        
        .services-page { max-width: 1200px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .create-btn { background: #6366f1; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .create-btn:hover { background: #4f46e5; }
        .create-btn:disabled { background: #ccc; cursor: not-allowed; }
        
        .org-selector { margin-bottom: 2rem; background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; min-width: 300px; padding-right: 2rem; }
        
        .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
        .service-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; transition: all 0.2s; border: 1px solid #e2e8f0; position: relative; }
        .service-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: #6366f1; }
        
        .service-header { padding: 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; }
        .service-info { flex: 1; min-width: 0; }
        .service-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .service-status { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-top: 0.25rem; }
        .active { background: #dcfce7; color: #166534; }
        
        .service-actions { display: flex; gap: 0.5rem; opacity: 0; transition: opacity 0.2s; }
        .service-card:hover .service-actions { opacity: 1; }
        .btn-icon { background: white; border: 1px solid #e2e8f0; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .btn-icon:hover { background: #fee2e2; border-color: #ef4444; color: #ef4444; }
        .btn-icon.edit:hover { background: #e0e7ff; border-color: #6366f1; color: #6366f1; }

        .service-body { padding: 1.5rem; }
        .counter-info { margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; font-size: 0.9rem; border: 1px solid #e2e8f0; }
        
        .qr-section { margin-top: 1.5rem; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 1.5rem; }
        .display-link { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: #6366f1; text-decoration: none; font-weight: 600; margin-bottom: 1.5rem; padding: 0.75rem; background: #eef2ff; border-radius: 8px; transition: background 0.2s; }
        .display-link:hover { background: #e0e7ff; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 600px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; }
        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #334155; }
        .form-group input, .form-group textarea { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-family: inherit; }
        
        .add-counter-btn { width: 100%; padding: 0.75rem; border: 2px dashed #cbd5e1; background: #f8fafc; border-radius: 8px; color: #64748b; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .add-counter-btn:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
        
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
        .cancel-btn { background: white; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 600; color: #64748b; }
        .submit-btn { background: #6366f1; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
    `],
    template: `
        <div class="layout">
            <app-sidebar (collapseChange)="isSidebarCollapsed = $event"></app-sidebar>
            
            <main class="content" [style.marginLeft.px]="isSidebarCollapsed ? 80 : 250">
                <div class="services-page">
                    <div class="header">
                        <div>
                            <h1 style="margin: 0; color: #1e293b;">Services</h1>
                            <p style="margin: 0.5rem 0 0; color: #64748b;">Manage services and counters for {{ getOrgName() }}</p>
                        </div>
                        <button class="create-btn" (click)="openCreateModal()" [disabled]="!selectedOrgId">
                            + New Service
                        </button>
                    </div>

                    <div class="org-selector">
                        <label style="display: block; margin-bottom: 0.5rem; color: #475569; font-weight: 600;">Current Organization</label>
                        <select [(ngModel)]="selectedOrgId" (change)="loadServices()" style="width: 100%; max-width: 400px;">
                            <option value="" disabled selected>-- Select Organization --</option>
                            <option *ngFor="let org of organizations" [value]="org._id">{{ org.name }}</option>
                        </select>
                        <p *ngIf="!selectedOrgId" style="color: #64748b; margin-top: 0.5rem; font-size: 0.9rem;">
                            Select an organization to manage its services.
                        </p>
                    </div>

                    <div *ngIf="!loading && services.length === 0 && selectedOrgId" class="org-selector" style="text-align: center; border: 2px dashed #e2e8f0;">
                        <h3 style="color: #64748b;">No Services Found</h3>
                        <p>Create your first service to get started.</p>
                        <button class="create-btn" (click)="openCreateModal()">Create Service</button>
                    </div>

                    <div class="services-grid">
                        <div *ngFor="let service of services" class="service-card">
                            <div class="service-header">
                                <div class="service-info">
                                    <h3 class="service-title" [title]="service.name">{{ service.name }}</h3>
                                    <span class="service-status" 
                                          [class.active]="service.queueStatus === 'active'"
                                          [class.paused]="service.queueStatus === 'paused'"
                                          [class.scheduled]="service.queueStatus === 'scheduled'"
                                          [style.background]="service.queueStatus === 'paused' ? '#fef3c7' : service.queueStatus === 'scheduled' ? '#e0e7ff' : '#dcfce7'"
                                          [style.color]="service.queueStatus === 'paused' ? '#d97706' : service.queueStatus === 'scheduled' ? '#6366f1' : '#166534'">
                                        {{ service.queueStatus || 'active' | uppercase }}
                                    </span>
                                </div>
                                <div class="service-actions">
                                    <button class="btn-icon edit" (click)="openEditModal(service); $event.stopPropagation()" title="Edit">✏️</button>
                                    <button class="btn-icon" (click)="deleteService(service._id, service.name); $event.stopPropagation()" title="Delete">🗑️</button>
                                </div>
                            </div>

                            <div class="service-body">
                                <p style="color: #64748b; margin-top: 0; height: 40px; overflow: hidden;">{{ service.description || 'No description' }}</p>
                                
                                <div class="counter-info" style="margin-top: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
                                    <div style="background: #f1f5f9; padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                                        <span>Counter Layout</span>
                                        <button (click)="openEditModal(service)" style="background: none; border: none; font-size: 0.8rem; cursor: pointer; color: #6366f1; font-weight: 600; padding: 0; display: flex; align-items: center; gap: 0.2rem;">
                                            ✏️ Rename
                                        </button>
                                    </div>
                                    <div style="max-height: 120px; overflow-y: auto;">
                                        <div *ngFor="let counter of service.counters" 
                                             style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1rem; border-bottom: 1px solid #f1f5f9; background: white;">
                                            <span style="color: #1e293b; font-weight: 600; font-size: 0.85rem;">{{ counter.name }}</span>
                                            <span style="color: #4f46e5; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
                                                <span style="font-size: 0.9rem;">👤</span> 
                                                {{ counter.staffName || 'Unassigned' }}
                                            </span>
                                        </div>
                                        <div *ngIf="!service.counters?.length" style="padding: 1rem; text-align: center; color: #94a3b8; font-style: italic; font-size: 0.85rem;">
                                            No counters configured
                                        </div>
                                    </div>
                                </div>



                                <div class="qr-section">
                                    <!-- ─ FRESH START BUTTON ─────────────────────── -->
                                    <div style="margin-bottom: 1rem; padding: 1rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;">
                                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem;">
                                            <div>
                                                <div style="font-size: 0.75rem; font-weight: 800; color: #92400e; letter-spacing: 0.05em;">🗓️ DAILY TOKEN RESET</div>
                                                <div style="font-size: 0.7rem; color: #b45309; margin-top: 2px;">Last token: <strong>{{ service.tokenPrefix || 'T' }}{{ padToken(service.currentTokenNumber) }}</strong></div>
                                            </div>
                                            <div *ngIf="freshStartLoading[service._id]" style="font-size: 0.75rem; color: #6366f1; font-weight: 700; display: flex; align-items: center; gap: 0.3rem;">
                                                <span style="animation: spin 1s linear infinite; display: inline-block;">↻</span> Resetting...
                                            </div>
                                            <div *ngIf="freshStartSuccess[service._id] && !freshStartLoading[service._id]" style="font-size: 0.75rem; color: #16a34a; font-weight: 700;">✅ Done!</div>
                                        </div>
                                        <button 
                                            (click)="freshStart(service); $event.stopPropagation()" 
                                            [disabled]="freshStartLoading[service._id]"
                                            style="width: 100%; padding: 0.6rem; background: #f59e0b; color: white; border: none; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 0.85rem; letter-spacing: 0.03em; transition: background 0.2s;"
                                            onmouseover="this.style.background='#d97706'" onmouseout="this.style.background='#f59e0b'"
                                        >
                                            🔄 Fresh Start — Reset to T001
                                        </button>
                                    </div>

                                    <a [routerLink]="['/display', service._id]" target="_blank" class="display-link">
                                        📺 Launch Customer Display
                                    </a>

                                    <div *ngIf="service.qrCode">
                                        <img [src]="service.qrCode" alt="QR Code" style="width: 120px; height: 120px; mix-blend-mode: multiply;">
                                        <br>
                                        <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 0.5rem; word-break: break-all;">
                                            <a [href]="'http://10.229.154.68:4200/join/' + service._id" target="_blank" style="color: #6366f1;">
                                                Test Link
                                            </a>
                                        </div>
                                        <a [href]="service.qrCode" download="qr-{{service.name}}.png" style="color: #64748b; text-decoration: none; font-size: 0.9rem;">Download QR</a>
                                    </div>
                                    <button *ngIf="!service.qrCode" (click)="generateQR(service)" style="background:none; border: 1px solid #6366f1; color: #6366f1; padding: 0.5rem; border-radius: 6px; cursor: pointer;">
                                        Generate QR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <!-- Modal -->
            <div *ngIf="showCreateModal" class="modal-overlay" (click)="closeCreateModal()">
                <div class="modal-content" (click)="$event.stopPropagation()">
                    <div class="modal-header">
                        <h2 style="margin: 0; color: #1e293b;">{{ isEditing ? 'Edit Service' : 'Create New Service' }}</h2>
                        <button (click)="closeCreateModal()" style="background:none; border:none; font-size: 1.5rem; cursor: pointer;">×</button>
                    </div>

                    <form (ngSubmit)="saveService()">
                        <div class="form-group">
                            <label>Service Name</label>
                            <input type="text" [(ngModel)]="currentService.name" name="name" required placeholder="e.g. General Consultation">
                        </div>

                        <div class="form-group">
                            <label>Description</label>
                            <textarea [(ngModel)]="currentService.description" name="description" rows="2" placeholder="Brief description"></textarea>
                        </div>

                        <div style="margin-top: 2rem; background: #f8fafc; padding: 1.5rem; border-radius: 10px; border: 1px solid #e2e8f0;">
                            <label style="font-weight: 800; display: block; margin-bottom: 1.25rem; color: #1e293b; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Manage Counters & Staff</label>
                            
                            <div *ngFor="let counter of currentService.counters; let i = index" 
                                 style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 1rem; position: relative; display: flex; flex-direction: column; gap: 0.75rem;">
                                <div style="display: flex; gap: 1rem;">
                                    <div style="flex: 1;">
                                        <label style="font-size: 0.7rem; color: #64748b; font-weight: 700; display: block; margin-bottom: 0.35rem;">COUNTER NAME</label>
                                        <input type="text" [(ngModel)]="counter.name" [name]="'c_name_'+i" placeholder="e.g. Counter 1" style="width: 100%; padding: 0.6rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.9rem;">
                                    </div>
                                    <div style="flex: 1;">
                                        <label style="font-size: 0.7rem; color: #64748b; font-weight: 700; display: block; margin-bottom: 0.35rem;">STAFF ASSIGNED</label>
                                        <input type="text" [(ngModel)]="counter.staffName" [name]="'c_staff_'+i" placeholder="e.g. John Doe" style="width: 100%; padding: 0.6rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.9rem;">
                                    </div>
                                    <button type="button" (click)="removeCounter(i)" *ngIf="currentService.counters.length > 1" 
                                            style="align-self: flex-end; background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; padding: 0.6rem; border-radius: 6px; cursor: pointer; height: 38px;" title="Remove Counter">🗑️</button>
                                </div>
                            </div>

                            <button type="button" class="add-counter-btn" (click)="addCounter()" style="margin-top: 0.5rem; background: white; border: 2px dashed #cbd5e1; color: #6366f1; padding: 0.8rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; width: 100%;">
                                + Add Another Counter
                            </button>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="cancel-btn" (click)="closeCreateModal()">Cancel</button>
                            <button type="submit" class="submit-btn" [disabled]="!isValidService()">
                                {{ isEditing ? 'Save Changes' : 'Create Service' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>


    `
})
export class ServicesListComponent implements OnInit {
    organizations: any[] = [];
    services: any[] = [];
    selectedOrgId: string = '';
    loading: boolean = false;
    showCreateModal: boolean = false;
    isEditing: boolean = false;
    isSidebarCollapsed: boolean = false;
    freshStartLoading: Record<string, boolean> = {};
    freshStartSuccess: Record<string, boolean> = {};

    currentService = {
        _id: '',
        name: '',
        description: '',
        counters: [
            { name: 'Counter 1', staffName: '' }
        ]
    };

    constructor(
        private orgService: OrganizationService,
        private serviceService: ServiceService,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadOrganizations();
    }

    getOrgName(): string {
        const org = this.organizations.find(o => o._id === this.selectedOrgId);
        return org ? org.name : 'Unknown';
    }

    loadOrganizations() {
        this.loading = true;
        this.orgService.getOrganizations().subscribe({
            next: (res) => {
                if (res.success && Array.isArray(res.data)) {
                    this.organizations = res.data;

                    const paramOrgId = this.route.snapshot.queryParams['orgId'];
                    if (paramOrgId && this.organizations.find(o => o._id === paramOrgId)) {
                        this.selectedOrgId = paramOrgId;
                    } else if (this.organizations.length > 0 && !this.selectedOrgId) {
                        this.selectedOrgId = this.organizations[0]._id;
                    }

                    if (this.selectedOrgId) {
                        this.loadServices();
                    }
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadServices() {
        if (!this.selectedOrgId) return;
        this.loading = true;
        this.serviceService.getServicesByOrganization(this.selectedOrgId).subscribe({
            next: (res) => {
                if (res.success && Array.isArray(res.data)) {
                    this.services = res.data;
                } else {
                    this.services = [];
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.services = [];
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openCreateModal() {
        if (!this.selectedOrgId) {
            alert('Please select an organization first.');
            return;
        }
        this.isEditing = false;
        this.currentService = {
            _id: '',
            name: '',
            description: '',
            counters: [{ name: 'Counter 1', staffName: '' }]
        };
        this.showCreateModal = true;
    }

    openEditModal(service: any) {
        this.isEditing = true;
        // Deep copy to prevent mutating list directly
        this.currentService = JSON.parse(JSON.stringify(service));
        if (!this.currentService.counters || this.currentService.counters.length === 0) {
            this.currentService.counters = [{ name: 'Counter 1', staffName: '' }];
        }
        this.showCreateModal = true;
    }

    closeCreateModal() {
        this.showCreateModal = false;
    }

    addCounter() {
        const nextNum = this.currentService.counters.length + 1;
        this.currentService.counters.push({ name: `Counter ${nextNum}`, staffName: '' });
    }

    removeCounter(index: number) {
        if (this.currentService.counters.length > 1) {
            this.currentService.counters.splice(index, 1);
        }
    }

    isValidService(): boolean {
        // Staff name is now optional, only counter name is required
        return !!this.currentService.name && this.currentService.counters.every(c => !!c.name);
    }

    saveService() {
        if (!this.isValidService()) return;

        const payload = {
            name: this.currentService.name,
            description: this.currentService.description,
            organizationId: this.selectedOrgId,
            counters: this.currentService.counters
        };

        if (this.isEditing && this.currentService._id) {
            this.serviceService.updateService(this.currentService._id, payload).subscribe({
                next: (res) => {
                    if (res.success) {
                        this.loadServices();
                        this.closeCreateModal();
                    }
                },
                error: (err) => alert(err.error?.message || 'Failed to update')
            });
        } else {
            this.serviceService.createService(payload).subscribe({
                next: (res) => {
                    if (res.success) {
                        this.loadServices();
                        this.closeCreateModal();
                    }
                },
                error: (err) => alert(err.error?.message || 'Failed to create')
            });
        }
    }

    deleteService(id: string, name: string) {
        if (confirm(`Are you sure you want to delete service "${name}"?`)) {
            this.serviceService.deleteService(id).subscribe({
                next: (res) => {
                    if (res.success) {
                        this.loadServices();
                    }
                },
                error: (err) => alert(err.error?.message || 'Failed to delete')
            });
        }
    }

    generateQR(service: any) {
        this.serviceService.generateQRCode(service._id).subscribe({
            next: (res) => {
                if (res.success && res.data?.qrCode) {
                    service.qrCode = res.data.qrCode;
                    this.cdr.detectChanges();
                }
            }
        });
    }

    freshStart(service: any) {
        const tokenNum = `${service.tokenPrefix || 'T'}${String(service.currentTokenNumber).padStart(3, '0')}`;
        const confirm1 = confirm(
            `🔄 Fresh Start for "${service.name}"\n\n` +
            `This will:\n` +
            `  • Reset token numbering back to ${service.tokenPrefix || 'T'}001\n` +
            `  • Cancel all currently active/waiting tokens (${tokenNum} and below)\n\n` +
            `Historical records will be preserved for analytics.\n\n` +
            `Start fresh for a new day?`
        );
        if (!confirm1) return;

        this.freshStartLoading[service._id] = true;
        this.freshStartSuccess[service._id] = false;
        this.cdr.detectChanges();

        this.serviceService.freshStart(service._id).subscribe({
            next: (res: any) => {
                if (res.success) {
                    service.currentTokenNumber = 0;
                    this.freshStartLoading[service._id] = false;
                    this.freshStartSuccess[service._id] = true;
                    this.cdr.detectChanges();
                    // Hide success badge after 4s
                    setTimeout(() => {
                        this.freshStartSuccess[service._id] = false;
                        this.cdr.detectChanges();
                    }, 4000);
                }
            },
            error: (err: any) => {
                this.freshStartLoading[service._id] = false;
                this.cdr.detectChanges();
                alert(err.error?.error || 'Failed to reset. Try again.');
            }
        });
    }

    padToken(n: number): string {
        return String(n || 0).padStart(3, '0');
    }

    // Helper: Format time for display
    formatTime(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Helper: Convert date to datetime-local input format
    toDatetimeLocal(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
    }
}

