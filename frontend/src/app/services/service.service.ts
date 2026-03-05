import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiConfigService } from './api-config.service';

interface Counter {
    name?: string;
    staffName?: string;
    status?: 'active' | 'inactive' | 'paused';
    currentToken?: string;
    _id?: string;
}

interface Service {
    _id?: string;
    name: string;
    description?: string;
    organizationId: string;
    counters?: Counter[];
    tokenPrefix?: string;
    currentTokenNumber?: number;
    estimatedServiceTime?: number;
    isActive?: boolean;
    qrCode?: string;
    stats?: any;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ServiceResponse {
    success: boolean;
    data?: Service | Service[];
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ServiceService {
    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private apiConfig: ApiConfigService
    ) { }

    private get apiUrl(): string {
        return this.apiConfig.getEndpoint('/services');
    }

    // Public methods for customers
    getPublicService(id: string): Observable<ServiceResponse> {
        return this.http.get<ServiceResponse>(`${this.apiUrl}/public/${id}`);
    }

    getPublicServicesByOrganization(orgId: string): Observable<ServiceResponse> {
        return this.http.get<ServiceResponse>(`${this.apiUrl}/public/organization/${orgId}`);
    }

    // Get all services
    getServices(): Observable<ServiceResponse> {
        return this.http.get<ServiceResponse>(this.apiUrl, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Get services by organization
    getServicesByOrganization(orgId: string): Observable<ServiceResponse> {
        return this.http.get<ServiceResponse>(`${this.apiUrl}/organization/${orgId}`, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Get service by ID
    getService(id: string): Observable<ServiceResponse> {
        return this.http.get<ServiceResponse>(`${this.apiUrl}/${id}`, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Create service
    createService(serviceData: Partial<Service>): Observable<ServiceResponse> {
        return this.http.post<ServiceResponse>(this.apiUrl, serviceData, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Update service
    updateService(id: string, serviceData: Partial<Service>): Observable<ServiceResponse> {
        return this.http.put<ServiceResponse>(`${this.apiUrl}/${id}`, serviceData, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Delete service
    deleteService(id: string): Observable<ServiceResponse> {
        return this.http.delete<ServiceResponse>(`${this.apiUrl}/${id}`, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Generate QR code
    generateQRCode(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/qr`, {}, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Get service statistics
    getServiceStats(id: string): Observable<any> {
        return this.http.get(`${this.apiConfig.getEndpoint('/analytics/service')}/${id}`, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Pause queue
    pauseQueue(id: string, message?: string): Observable<ServiceResponse> {
        return this.http.post<ServiceResponse>(`${this.apiUrl}/${id}/pause`, { message }, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Resume queue
    resumeQueue(id: string): Observable<ServiceResponse> {
        return this.http.post<ServiceResponse>(`${this.apiUrl}/${id}/resume`, {}, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Set queue schedule
    setSchedule(id: string, startTime?: string, endTime?: string, counterId?: string): Observable<ServiceResponse> {
        return this.http.post<ServiceResponse>(`${this.apiUrl}/${id}/schedule`, { startTime, endTime, counterId }, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Pause individual counter
    pauseCounter(serviceId: string, counterId: string): Observable<ServiceResponse> {
        return this.http.post<ServiceResponse>(`${this.apiUrl}/${serviceId}/counter/${counterId}/pause`, {}, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Resume individual counter
    resumeCounter(serviceId: string, counterId: string): Observable<ServiceResponse> {
        return this.http.post<ServiceResponse>(`${this.apiUrl}/${serviceId}/counter/${counterId}/resume`, {}, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Fresh Start — reset token counter to T001 for a new day
    freshStart(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/fresh-start`, {}, {
            headers: this.authService.getAuthHeaders()
        });
    }
}

