import { Component, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
    selector: 'app-map',
    imports: [CommonModule],
    template: `
    <div class="map-container">
        <div id="map"></div>
        <div class="map-hint">Click anywhere to select a location</div>
        <button class="close-btn" (click)="close()">×</button>
    </div>
  `,
    styles: [`
    .map-container {
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        z-index: 1000;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.3s ease;
    }
    #map {
        width: 90%;
        height: 80%;
        border-radius: 20px;
        box-shadow: 0 0 50px rgba(0,0,0,0.5);
        border: 2px solid rgba(255,255,255,0.2);
    }
    .map-hint {
        position: absolute;
        top: 50px;
        background: rgba(0,0,0,0.6);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        backdrop-filter: blur(5px);
        pointer-events: none;
        z-index: 1001;
    }
    .close-btn {
        position: absolute;
        top: 30px;
        right: 30px;
        background: transparent;
        border: none;
        color: white;
        font-size: 3rem;
        cursor: pointer;
        z-index: 1002;
    }
    .close-btn:hover { color: #ff6b6b; }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
  `]
})
export class MapComponent implements AfterViewInit {
    @Output() locationSelected = new EventEmitter<{ lat: number, lon: number }>();
    @Output() closeMap = new EventEmitter<void>();

    private map: L.Map | undefined;

    close() {
        this.closeMap.emit();
    }

    ngAfterViewInit() {
        this.initMap();
    }

    private initMap(): void {
        this.map = L.map('map').setView([20, 0], 2); // World view

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(this.map);

        // Fix marker icon issue in Angular/Webpack
        const iconRetinaUrl = 'assets/marker-icon-2x.png';
        const iconUrl = 'assets/marker-icon.png';
        const shadowUrl = 'assets/marker-shadow.png';
        const iconDefault = L.icon({
            iconRetinaUrl,
            iconUrl,
            shadowUrl,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            tooltipAnchor: [16, -28],
            shadowSize: [41, 41]
        });
        // L.Marker.prototype.options.icon = iconDefault; // Might fail type check or context

        this.map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;

            L.popup()
                .setLatLng(e.latlng)
                .setContent("Checking weather here... 🌤️")
                .openOn(this.map!);

            setTimeout(() => {
                this.locationSelected.emit({ lat, lon: lng });
            }, 800);
        });
    }
}
