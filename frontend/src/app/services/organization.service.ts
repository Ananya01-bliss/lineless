import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiConfigService } from './api-config.service';

interface Organization {
    _id: string;
    name: string;
    description: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
    logo?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface OrganizationResponse {
    success: boolean;
    data?: Organization | Organization[];
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class OrganizationService {
    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private apiConfig: ApiConfigService
    ) { }

    private get apiUrl(): string {
        return this.apiConfig.getEndpoint('/organizations');
    }

    // Public method for customers scanning QR
    getPublicOrganization(id: string): Observable<OrganizationResponse> {
        return this.http.get<OrganizationResponse>(`${this.apiUrl}/public/${id}`);
    }

    // Get all organizations
    getOrganizations(): Observable<OrganizationResponse> {
        return this.http.get<OrganizationResponse>(this.apiUrl, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Get organization by ID
    getOrganization(id: string): Observable<OrganizationResponse> {
        return this.http.get<OrganizationResponse>(`${this.apiUrl}/${id}`, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Create organization
    createOrganization(orgData: Partial<Organization>): Observable<OrganizationResponse> {
        return this.http.post<OrganizationResponse>(this.apiUrl, orgData, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Update organization
    updateOrganization(id: string, orgData: Partial<Organization>): Observable<OrganizationResponse> {
        return this.http.put<OrganizationResponse>(`${this.apiUrl}/${id}`, orgData, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Delete organization
    deleteOrganization(id: string): Observable<OrganizationResponse> {
        return this.http.delete<OrganizationResponse>(`${this.apiUrl}/${id}`, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Get organization statistics
    getOrganizationStats(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}/stats`, {
            headers: this.authService.getAuthHeaders()
        });
    }
}
