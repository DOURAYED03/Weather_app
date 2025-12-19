import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-weather-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-container glass-panel">
      <div class="chart-header-replica" *ngIf="hasData">
         <div class="header-main">
           <span class="header-title">Panoramic Forecast</span>
         </div>
      </div>
      
      <div class="chart-wrapper-replica" *ngIf="hasData">
        <canvas baseChart
          [data]="lineChartData"
          [options]="lineChartOptions"
          [plugins]="lineChartPlugins"
          [type]="lineChartType">
        </canvas>
      </div>

      <div class="replica-no-data" *ngIf="!hasData">
        <div class="pulse-icon">🗓️</div>
        <p>Awaiting weather data...</p>
      </div>
    </div>
  `,
  styleUrls: ['./weather-chart.css']
})
export class WeatherChartComponent implements OnChanges, OnInit {
  @Input() data: any[] = [];
  @Input() selectedDay: string | null = null;

  hasData = false;
  private iconCache: Map<string, HTMLImageElement> = new Map();

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1500, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    elements: {
      line: {
        tension: 0.5,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        capBezierPoints: true,
        fill: false
      },
      point: { radius: 0 }
    },
    scales: {
      x: { display: false },
      y: { display: false, min: 'auto', max: 'auto', offset: true }
    },
    layout: {
      padding: { top: 120, bottom: 40, left: 40, right: 40 }
    }
  };

  public lineChartPlugins: any[] = [
    {
      id: 'imageStyleReplica',
      afterDatasetsDraw: (chart: any) => {
        const { ctx, data } = chart;
        const meta = chart.getDatasetMeta(0);
        const dataset = data.datasets[0];

        meta.data.forEach((element: any, index: number) => {
          const temp = dataset.data[index];
          const dayLabel = data.labels[index];
          const iconCode = dataset.icons ? dataset.icons[index] : '01d';

          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';

          // Draw Day
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '500 14px Inter, sans-serif';
          ctx.fillText(dayLabel, element.x, element.y - 85);

          // Draw Temp
          ctx.fillStyle = '#ffffff';
          ctx.font = '300 36px Inter, sans-serif';
          ctx.fillText(`${temp}°`, element.x, element.y - 45);
          ctx.restore();

          // Draw Circular Bubble
          ctx.save();
          const radius = 26;
          ctx.beginPath();
          ctx.arc(element.x, element.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw Weather Icon
          const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
          let img = this.iconCache.get(iconUrl);
          if (!img) {
            img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = iconUrl;
            img.onload = () => chart.draw();
            this.iconCache.set(iconUrl, img);
          }
          if (img.complete) {
            const size = 36;
            ctx.drawImage(img, element.x - size / 2, element.y - size / 2, size, size);
          }
          ctx.restore();
        });
      }
    }
  ];

  public lineChartType: ChartType = 'line';

  ngOnInit() { this.updateChart(); }
  ngOnChanges() { this.updateChart(); }

  updateChart() {
    if (!this.data || this.data.length === 0) {
      this.hasData = false;
      return;
    }

    const daily: { [key: string]: any } = {};
    this.data.forEach(item => {
      const date = new Date(item.time.replace(' ', 'T')).toDateString();
      if (!daily[date]) {
        daily[date] = { temps: [], icons: [] };
      }
      daily[date].temps.push(item.temp);
      daily[date].icons.push(item.icon);
    });

    const dates = Object.keys(daily).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).slice(0, 7);
    if (dates.length === 0) { this.hasData = false; return; }

    const temps: number[] = [];
    const labels: string[] = [];
    const icons: string[] = [];

    dates.forEach(dateStr => {
      const d = new Date(dateStr);
      const avgTemp = Math.round(daily[dateStr].temps.reduce((a: any, b: any) => a + b) / daily[dateStr].temps.length);

      const iconCounts: any = {};
      daily[dateStr].icons.forEach((ic: string) => iconCounts[ic] = (iconCounts[ic] || 0) + 1);
      const mainIcon = Object.keys(iconCounts).reduce((a, b) => iconCounts[a] > iconCounts[b] ? a : b);

      temps.push(avgTemp);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'long' }));
      icons.push(mainIcon);
    });

    this.hasData = true;
    this.lineChartData = {
      labels,
      datasets: [{
        data: temps,
        icons: icons,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 2,
        tension: 0.5,
        pointRadius: 0,
        fill: false
      }] as any
    };
  }
}
