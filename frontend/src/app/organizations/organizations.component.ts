import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrganizationService } from '../services/organization.service';
import { SidebarComponent } from '../components/sidebar/sidebar.component';

interface Organization {
    _id: string;
    name: string;
    description: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    logo?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

@Component({
    selector: 'app-organizations',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
    templateUrl: './organizations.component.html',
    styleUrls: ['./organizations.component.scss']
})
export class OrganizationsComponent implements OnInit {
    organizations: Organization[] = [];
    filteredOrganizations: Organization[] = [];
    loading: boolean = true;
    error: string = '';
    searchTerm: string = '';

    // Modal State
    showCreateModal: boolean = false;
    isEditing: boolean = false;
    isSidebarCollapsed: boolean = false;

    currentOrganization: Partial<Organization> = {
        name: '',
        description: ''
    };

    constructor(
        private organizationService: OrganizationService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadOrganizations();
    }

    loadOrganizations(showLoading: boolean = true): void {
        if (showLoading) this.loading = true;
        this.error = '';

        this.organizationService.getOrganizations().subscribe({
            next: (response) => {
                if (response.success && Array.isArray(response.data)) {
                    this.organizations = response.data;
                    this.filteredOrganizations = response.data;
                }
                this.loading = false;
                this.cdr.detectChanges(); // Force update
            },
            error: (error) => {
                this.error = error.error?.message || 'Failed to load organizations';
                this.loading = false;
                this.cdr.detectChanges(); // Force update
            }
        });
    }

    searchOrganizations(): void {
        if (!this.searchTerm.trim()) {
            this.filteredOrganizations = this.organizations;
            return;
        }

        const term = this.searchTerm.toLowerCase();
        this.filteredOrganizations = this.organizations.filter(org =>
            org.name.toLowerCase().includes(term) ||
            (org.description && org.description.toLowerCase().includes(term))
        );
    }

    // Open Modal for Create
    openCreateModal(): void {
        this.isEditing = false;
        this.isSubmitting = false;
        this.currentOrganization = { name: '', description: '' };
        this.showCreateModal = true;
    }

    // Open Modal for Edit
    openEditModal(org: Organization, event: Event): void {
        event.stopPropagation(); // Prevent card click
        this.isEditing = true;
        this.isSubmitting = false;
        this.currentOrganization = { ...org }; // Copy data
        this.showCreateModal = true;
    }

    closeCreateModal(): void {
        this.showCreateModal = false;
        this.currentOrganization = { name: '', description: '' };
    }

    isSubmitting: boolean = false;

    saveOrganization(): void {
        if (this.isSubmitting) return;

        if (!this.currentOrganization.name) {
            alert('Please enter organization name');
            return;
        }

        this.isSubmitting = true;

        if (this.isEditing && this.currentOrganization._id) {
            // Update
            this.organizationService.updateOrganization(this.currentOrganization._id, this.currentOrganization).subscribe({
                next: (response) => {
                    this.isSubmitting = false;
                    if (response.success) {
                        this.closeCreateModal();
                        this.loadOrganizations(false); // Refresh list
                        this.cdr.detectChanges();
                    }
                },
                error: (error) => {
                    this.isSubmitting = false;
                    alert(error.error?.message || 'Failed to update organization');
                    this.cdr.detectChanges();
                }
            });
        } else {
            // Create
            this.organizationService.createOrganization(this.currentOrganization).subscribe({
                next: (response) => {
                    this.isSubmitting = false;
                    if (response.success) {
                        this.closeCreateModal();
                        this.loadOrganizations(false); // Reload to ensure sync
                        this.cdr.detectChanges();
                    }
                },
                error: (error) => {
                    this.isSubmitting = false;
                    alert(error.error?.message || 'Failed to create organization');
                    this.cdr.detectChanges();
                }
            });
        }
    }

    viewOrganization(id: string): void {
        this.router.navigate(['/services'], { queryParams: { orgId: id } });
    }

    deleteOrganization(id: string, name: string): void {
        if (confirm(`Are you sure you want to delete "${name}"? This will delete all associated services and tokens.`)) {
            this.organizationService.deleteOrganization(id).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.organizations = this.organizations.filter(o => o._id !== id);
                        this.searchOrganizations();
                        this.cdr.detectChanges();
                    }
                },
                error: (error) => {
                    console.error('Delete failed:', error);
                    const msg = error.error?.error || error.error?.message || 'Failed to delete organization';
                    alert(msg);
                }
            });
        }
    }

    goBack(): void {
        this.router.navigate(['/dashboard']);
    }
}
