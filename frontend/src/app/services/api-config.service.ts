import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ApiConfigService {
    private _apiUrl: string;

    constructor() {
        // Dynamically determine API URL based on current hostname
        const hostname = window.location.hostname;

        // If accessing from localhost, use localhost
        // Otherwise, use the same hostname (for mobile/network access)
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            this._apiUrl = 'http://localhost:3000/api';
        } else {
            // Use same IP that the browser is using to access the frontend
            this._apiUrl = `http://${hostname}:3000/api`;
        }

        console.log('API URL configured as:', this._apiUrl);
    }

    get apiUrl(): string {
        return this._apiUrl;
    }

    getEndpoint(path: string): string {
        return `${this._apiUrl}${path}`;
    }
}
