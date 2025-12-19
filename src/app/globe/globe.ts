import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-globe',
    imports: [CommonModule],
    templateUrl: './globe.html',
    styleUrl: './globe.css'
})
export class Globe {
    @Output() select = new EventEmitter<void>();

    onClick() {
        this.select.emit();
    }
}
