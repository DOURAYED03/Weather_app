import { Component, Output, EventEmitter } from '@angular/core';
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
  @Output() search = new EventEmitter<string>();
  
  onSearch(city: string) {
    this.search.emit(city);
  }
}
