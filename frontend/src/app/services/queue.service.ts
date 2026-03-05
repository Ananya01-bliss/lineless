import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiConfigService } from './api-config.service';

interface Token {
    _id: string;
    serviceId: string;
    organizationId: string;
    tokenNumber: string;
    status: 'waiting' | 'called' | 'serving' | 'served' | 'skipped';
    priority: 'normal' | 'priority';
    customerName?: string;
    customerPhone?: string;
    joinedAt: Date;
    calledAt?: Date;
    servedAt?: Date;
    waitDuration?: number;
    serviceDuration?: number;
    position?: number;
    estimatedWaitTime?: number;
}

interface QueueStatus {
    totalWaiting: number;
    totalServing: number;
    averageWaitTime: number;
    queue: Token[];
}

interface TokenResponse {
    success: boolean;
    data?: Token | Token[];
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class QueueService {
    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private apiConfig: ApiConfigService
    ) { }

    private get apiUrl(): string {
        return this.apiConfig.getEndpoint('/tokens');
    }

    // Join queue
    joinQueue(queueData: {
        serviceId: string;
        customerName?: string;
        customerPhone?: string;
        priority?: 'normal' | 'priority';
    }): Observable<TokenResponse> {
        return this.http.post<TokenResponse>(`${this.apiUrl}/join`, queueData);
    }

    // Get queue status for a service
    getQueueStatus(serviceId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/service/${serviceId}/queue`);
    }

    // Get token by ID (Status only for customers)
    getToken(tokenId: string): Observable<TokenResponse> {
        return this.http.get<TokenResponse>(`${this.apiUrl}/${tokenId}/status`);
    }

    // Call next token (staff only)
    callNextToken(serviceId: string, counterId: string): Observable<TokenResponse> {
        return this.http.post<TokenResponse>(`${this.apiUrl}/call-next`, {
            serviceId,
            counterId
        }, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Mark token as served (staff only)
    serveToken(tokenId: string): Observable<TokenResponse> {
        return this.http.post<TokenResponse>(`${this.apiUrl}/${tokenId}/serve`, {}, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Skip token (staff only)
    skipToken(tokenId: string): Observable<TokenResponse> {
        return this.http.post<TokenResponse>(`${this.apiUrl}/${tokenId}/skip`, {}, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Get all tokens for a service
    getServiceTokens(serviceId: string): Observable<TokenResponse> {
        return this.http.get<TokenResponse>(`${this.apiUrl}/service/${serviceId}`, {
            headers: this.authService.getAuthHeaders()
        });
    }

    // Get customer's active tokens
    getMyTokens(): Observable<TokenResponse> {
        return this.http.get<TokenResponse>(`${this.apiUrl}/my-tokens`);
    }
}
