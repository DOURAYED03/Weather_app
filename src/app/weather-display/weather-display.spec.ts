import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherDisplay } from './weather-display';

describe('WeatherDisplay', () => {
  let component: WeatherDisplay;
  let fixture: ComponentFixture<WeatherDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeatherDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
