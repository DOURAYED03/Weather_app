import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherChart } from './weather-chart';

describe('WeatherChart', () => {
  let component: WeatherChart;
  let fixture: ComponentFixture<WeatherChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeatherChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
