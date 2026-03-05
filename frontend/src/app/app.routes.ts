import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { OrganizationsComponent } from './organizations/organizations.component';
import { QueueComponent } from './queue/queue.component';
import { AuthGuard } from './guards/auth.guard';

import { AnalyticsComponent } from './analytics/analytics.component';
import { ServicesListComponent } from './services-list/services-list.component';
import { QueueDisplayComponent } from './queue-display/queue-display.component';
import { CustomerJoinComponent } from './customer/customer-join/customer-join.component';

export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'login', component: LoginComponent },
    { path: 'join/:id', component: CustomerJoinComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'organizations', component: OrganizationsComponent, canActivate: [AuthGuard] },
    { path: 'analytics', component: AnalyticsComponent, canActivate: [AuthGuard] },
    { path: 'services', component: ServicesListComponent, canActivate: [AuthGuard] },
    { path: 'display/:id', component: QueueDisplayComponent },
    { path: 'queue', component: QueueComponent },
    { path: 'queue/:id', component: QueueComponent },
    { path: '**', redirectTo: '' }
];
