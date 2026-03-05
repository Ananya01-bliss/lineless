import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SidebarComponent } from '../components/sidebar/sidebar.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, SidebarComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    userName: string = 'User';
    currentTime: string = '';
    isSidebarCollapsed: boolean = false;

    // Dashboard guide steps
    guideSteps = [
        {
            title: '1. Create Organization',
            desc: 'Set up your business profile, location, and contact details.',
            icon: '🏢',
            action: 'createOrganization',
            color: 'from-blue-500 to-indigo-600'
        },
        {
            title: '2. Add Services',
            desc: 'Define services (e.g., General Ward) and assign counters.',
            icon: '⚡',
            action: 'createService',
            color: 'from-purple-500 to-pink-600'
        },
        {
            title: '3. Manage Queue',
            desc: 'Start the queue, call tokens, and track live performance.',
            icon: '🚀',
            action: 'viewQueue',
            color: 'from-emerald-500 to-teal-600'
        }
    ];

    constructor(
        private router: Router,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        const user = this.authService.getCurrentUser();
        if (user) {
            this.userName = user.name;
        }

        this.updateTime();
        setInterval(() => {
            this.updateTime();
            this.cdr.detectChanges();
        }, 60000);
    }

    updateTime(): void {
        const now = new Date();
        this.currentTime = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    createOrganization(): void {
        this.router.navigate(['/organizations']);
    }

    createService(): void {
        this.router.navigate(['/services']);
    }

    viewQueue(): void {
        this.router.navigate(['/queue']);
    }
}
