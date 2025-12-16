import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType, ScriptableContext } from 'chart.js';
import 'chart.js/auto';

@Component({
  selector: 'app-weather-chart',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './weather-chart.html',
  styleUrl: './weather-chart.css',
})
export class WeatherChart implements OnChanges {
  @Input() data: any[] = [];
  @Input() selectedDay: string = '';
  
  public hasData: boolean = false;

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 40, 0.95)',
        titleColor: '#FFD700',
        bodyColor: '#fff',
        padding: 15,
        cornerRadius: 10,
        displayColors: false,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 16 },
        callbacks: {
          title: (items) => items[0].label,
          label: (context) => `🌡️ ${context.parsed.y}°C`
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3
      },
      point: {
        radius: 5,
        hoverRadius: 8,
        borderWidth: 2
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 11, weight: 'bold' },
          maxRotation: 0
        },
        border: {
          display: false
        }
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
          lineWidth: 1
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: { size: 11 },
          padding: 10,
          callback: (value) => `${value}°`
        },
        border: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  public lineChartType: ChartType = 'line';

  ngOnChanges() {
    if (this.data && this.data.length > 0 && this.selectedDay) {
      // Filter data for the selected day
      const filteredData = this.data.filter(item => {
        const date = new Date(item.time.replace(' ', 'T'));
        return date.toDateString() === this.selectedDay;
      });
      
      this.hasData = filteredData.length > 0;

      // Build hourly data from API (3-hour intervals)
      const hourlyTemps: Map<number, number> = new Map();
      
      if (filteredData.length > 0) {
        filteredData.forEach(item => {
          const date = new Date(item.time.replace(' ', 'T'));
          hourlyTemps.set(date.getHours(), Math.round(item.temp));
        });

        // Interpolate missing hours for smooth curve
        const sortedHours = Array.from(hourlyTemps.keys()).sort((a, b) => a - b);
        for (let i = 0; i < sortedHours.length - 1; i++) {
          const h1 = sortedHours[i];
          const h2 = sortedHours[i + 1];
          const t1 = hourlyTemps.get(h1)!;
          const t2 = hourlyTemps.get(h2)!;
          for (let h = h1 + 1; h < h2; h++) {
            const ratio = (h - h1) / (h2 - h1);
            hourlyTemps.set(h, Math.round(t1 + (t2 - t1) * ratio));
          }
        }
      } else {
        // No data available for this day
        this.hasData = false;
        this.lineChartData = { datasets: [], labels: [] };
        return;
      }

      // Get all available hours sorted
      const hours = Array.from(hourlyTemps.keys()).sort((a, b) => a - b);
      const temps = hours.map(h => hourlyTemps.get(h)!);
      const labels = hours.map(h => `${h.toString().padStart(2, '0')}:00`);

      // Create gradient effect
      this.lineChartData = {
        datasets: [
          {
            data: temps,
            label: 'Temperature',
            backgroundColor: (context: ScriptableContext<'line'>) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return 'rgba(255, 215, 0, 0.3)';
              const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
              gradient.addColorStop(0.5, 'rgba(255, 180, 0, 0.2)');
              gradient.addColorStop(1, 'rgba(255, 150, 0, 0.05)');
              return gradient;
            },
            borderColor: '#FFD700',
            pointBackgroundColor: '#fff',
            pointBorderColor: '#FFD700',
            pointHoverBackgroundColor: '#FFD700',
            pointHoverBorderColor: '#fff',
            fill: true,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 7
          }
        ],
        labels: labels
      };
    }
  }
}
