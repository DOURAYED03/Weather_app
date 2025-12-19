import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SearchBar } from '../search-bar/search-bar';
@Component({
  selector: 'app-navbar',
  imports: [RouterModule, SearchBar],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  @Input() units: 'metric' | 'imperial' = 'metric';
  @Output() search = new EventEmitter<string>();
  @Output() toggleUnits = new EventEmitter<void>();

  onSearch(city: string) {
    this.search.emit(city);
  }

  onToggleUnits() {
    this.toggleUnits.emit();
  }
}
