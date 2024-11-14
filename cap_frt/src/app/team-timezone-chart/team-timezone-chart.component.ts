import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { NavSidebarComponent } from '../nav-sidebar/nav-sidebar.component';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { TeamService } from '../my-team/team.service';

import { Employee } from '../team-dashboard/employee.model';

import * as moment from 'moment-timezone';  // Import moment-timezone
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
          <div class="best-meeting-time">
            <h3>Best Meeting Time</h3>
            <p>{{ bestMeetingTime }}</p>
          </div>
          <div class="chart-container">
            <canvas id="timezoneChart"></canvas>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
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
      .best-meeting-time {
        margin-bottom: 20px;
        padding: 15px;
        background-color: #f0f0f0;
        border-radius: 5px;
      }
      .chart-container {
        height: 400px;
        width: 100%;
      }
    `,
  ],
})
export class TeamTimezoneChartComponent implements OnInit {
  teamMembers: Employee[] = [];
  employeeTimeZones: { [employeeId: number]: EmployeeTimeZone } = {}; // Store by employeeId
  bestMeetingTime: string = '';
  chart: Chart | undefined;

  constructor(
    private teamService: TeamService,
    private timesheetService: TimesheetService
  ) {}

  ngOnInit() {
    // Fetch team members data
    this.teamService.getTeamMembers().subscribe({
      next: (members) => {
        this.teamMembers = members;
        // Now fetch the time zone data for each team member
        this.fetchEmployeeTimeZones();
      },
      error: (error) => {
        console.error('Error fetching team members', error);
      },
    });
  }

  fetchEmployeeTimeZones() {
    // Fetch time zone data for each team member
    this.teamMembers.forEach((member) => {
      this.timesheetService.getEmployeeTimeZone(member.id).subscribe({
        next: (timeZoneData) => {
          // Store the time zone data by employeeId
          this.employeeTimeZones[member.id] = timeZoneData;

          // After fetching data for all team members, create the chart
          if (Object.keys(this.employeeTimeZones).length === this.teamMembers.length) {
            this.createChart();
          }
        },
        error: (error) => {
          console.error(`Error fetching timezone data for employee ${member.id}`, error);
        },
      });
    });
  }

  createChart() {
    const ctx = document.getElementById('timezoneChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('Canvas element not found');
      return;
    }

    const data = this.generateChartData();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),  // Hours of the day (0-23)
        datasets: this.teamMembers.map((member, index) => {
          const timeZoneData = this.employeeTimeZones[member.id];
          return {
            label: member.name,
            data: data[member.id],  // Use the data generated based on time zone
            backgroundColor: `hsl(${index * 60}, 70%, 50%)`,  // Unique color for each employee
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 24,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });
  }

  generateChartData() {
    const data: { [employeeId: number]: number[] } = {};

    // Generate the working hours chart data for each employee
    this.teamMembers.forEach((member) => {
      const timeZoneData = this.employeeTimeZones[member.id];

      if (timeZoneData) {
        const workingHoursStart = this.convertToLocalTime(
          timeZoneData.workingHoursStart,
          timeZoneData.timeZone
        );
        const workingHoursEnd = this.convertToLocalTime(
          timeZoneData.workingHoursEnd,
          timeZoneData.timeZone
        );

        // Populate the data for the chart (work hours marked as 1, others as 0)
        data[member.id] = Array.from({ length: 24 }, (_, hour) => {
          return hour >= workingHoursStart && hour < workingHoursEnd ? 1 : 0;
        });
      }
    });

    return data;
  }

  convertToLocalTime(hourString: string, timeZone: string): number {
    // Convert the time to the local time in the specified time zone using moment-timezone
    const formattedTime = moment.tz(hourString, 'HH:mm', timeZone);
    return formattedTime.hours();  // Extract the hour part after conversion
  }
}
