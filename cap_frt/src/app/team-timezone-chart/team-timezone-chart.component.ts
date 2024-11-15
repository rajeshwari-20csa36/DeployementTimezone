import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { NavSidebarComponent } from '../nav-sidebar/nav-sidebar.component';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { TeamService } from '../my-team/team.service';
import { Employee } from '../team-dashboard/employee.model';
import moment from 'moment-timezone';

import { EmployeeTimeZone } from '../timesheet/team-timezone.interface';
import { TimesheetService } from '../timesheet/timesheet.service';

Chart.register(...registerables);

@Component({
  selector: 'app-team-timezone-chart',
  standalone: true,
  imports: [CommonModule, NavSidebarComponent, TopBarComponent],
  template: `
    <div class="team-timezone-container">
      <app-nav-sidebar [activePage]="'Team Timezone'"></app-nav-sidebar>
      <main class="main-content">
        <app-top-bar [currentPage]="'Team Timezone'"></app-top-bar>
        <div class="chart-content">
          <div class="timezone-info">
            <div class="best-meeting-time" *ngIf="bestMeetingTime">
              <h3>Recommended Meeting Time</h3>
              <p>{{ bestMeetingTime }}</p>
            </div>
            <div class="overlap-info" *ngIf="overlapHours">
              <h3>Overlap Window</h3>
              <p>{{ overlapHours }}</p>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="timezoneChart"></canvas>
          </div>
          <div class="legend-container">
            <div class="legend-item">
              <span class="legend-color working-hours"></span>
              <span>Working Hours</span>
            </div>
            <div class="legend-item">
              <span class="legend-color overlap"></span>
              <span>Overlap Time</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .team-timezone-container {
      display: flex;
      height: 100vh;
    }
    .main-content {
      flex-grow: 1;
      overflow-y: auto;
    }
    .chart-content {
      padding: 20px;
    }
    .timezone-info {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    .best-meeting-time, .overlap-info {
      flex: 1;
      padding: 15px;
      background-color: #f0f0f0;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .chart-container {
      height: 400px;
      width: 100%;
      margin-bottom: 20px;
    }
    .legend-container {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 10px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 4px;
    }
    .working-hours {
      background-color: rgba(75, 192, 192, 0.2);
      border: 1px solid rgba(75, 192, 192, 1);
    }
    .overlap {
      background-color: rgba(153, 102, 255, 0.2);
      border: 1px solid rgba(153, 102, 255, 1);
    }
  `]
})
export class TeamTimezoneChartComponent implements OnInit {
  teamMembers: Employee[] = [];
  employeeTimeZones: { [employeeId: number]: EmployeeTimeZone } = {};
  bestMeetingTime: string = '';
  overlapHours: string = '';
  chart: Chart | undefined;

  constructor(
    private teamService: TeamService,
    private timesheetService: TimesheetService
  ) {}

  ngOnInit() {
    this.teamService.getTeamMembers().subscribe({
      next: (members) => {
        this.teamMembers = members;
        this.fetchEmployeeTimeZones();
      },
      error: (error) => {
        console.error('Error fetching team members', error);
      },
    });
  }

  fetchEmployeeTimeZones() {
    const promises = this.teamMembers.map(member =>
      this.timesheetService.getEmployeeTimeZone(member.employeeId).toPromise()
    );

    Promise.all(promises).then(timeZones => {
      timeZones.forEach((timeZone, index) => {
        if (timeZone) {
          this.employeeTimeZones[this.teamMembers[index].employeeId] = timeZone;
        }
      });
      this.calculateOverlap();
      this.createChart();
    });
  }

  calculateOverlap() {
    const workingHours = Object.values(this.employeeTimeZones).map(tz => {
      const start = moment.tz(`2024-01-01 ${tz.workingHoursStart}`, tz.timeZone);
      const end = moment.tz(`2024-01-01 ${tz.workingHoursEnd}`, tz.timeZone);
      return {
        start: start.utc(),
        end: end.utc()
      };
    });

    // Find overlap
    const latestStart = moment.max(...workingHours.map(h => h.start));
    const earliestEnd = moment.min(...workingHours.map(h => h.end));

    if (latestStart.isBefore(earliestEnd)) {
      this.overlapHours = `${latestStart.format('HH:mm')} - ${earliestEnd.format('HH:mm')} UTC`;
      this.bestMeetingTime = this.calculateBestMeetingTime(latestStart, earliestEnd);
    } else {
      this.overlapHours = 'No overlap found';
      this.bestMeetingTime = 'No suitable meeting time available';
    }
  }

  calculateBestMeetingTime(start: moment.Moment, end: moment.Moment): string {
    // Aim for middle of overlap window
    const midPoint = moment(start).add(moment.duration(end.diff(start)).asMinutes() / 2, 'minutes');
    
    // Format the time for each team member's timezone
    const times = Object.values(this.employeeTimeZones).map(tz => {
      return midPoint.tz(tz.timeZone).format('HH:mm z');
    });

    return `${midPoint.format('HH:mm')} UTC (${times.join(' / ')})`;
  }

  createChart() {
    const ctx = document.getElementById('timezoneChart') as HTMLCanvasElement;
    if (!ctx) return;

    const datasets = this.generateDatasets();
    
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Time (UTC)'
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            max: this.teamMembers.length,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const datasetLabel = context.dataset.label || '';
                const hour = context.label;
                const value = context.raw as number;
                return value > 0 ? `${datasetLabel} (${hour})` : '';
              }
            }
          }
        }
      }
    });
  }

  generateDatasets() {
    const hourlyData = Array(24).fill(0);
    const workingHoursData = Array(24).fill(0);
    const overlapData = Array(24).fill(0);

    // Count team members working at each hour
    Object.values(this.employeeTimeZones).forEach(tz => {
      const start = parseInt(tz.workingHoursStart.split(':')[0]);
      const end = parseInt(tz.workingHoursEnd.split(':')[0]);

      for (let hour = 0; hour < 24; hour++) {
        if (hour >= start && hour < end) {
          workingHoursData[hour]++;
        }
      }
    });

    // Calculate overlap
    for (let hour = 0; hour < 24; hour++) {
      if (workingHoursData[hour] === this.teamMembers.length) {
        overlapData[hour] = workingHoursData[hour];
        workingHoursData[hour] = 0;
      }
    }

    return [
      {
        label: 'Working Hours',
        data: workingHoursData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: 'Overlap',
        data: overlapData,
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }
    ];
  }
}