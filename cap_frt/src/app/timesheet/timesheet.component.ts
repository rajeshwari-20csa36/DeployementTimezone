import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavSidebarComponent } from '../nav-sidebar/nav-sidebar.component';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { EmployeeTimeZone } from './team-timezone.interface';
import { TimesheetService } from './timesheet.service';

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [CommonModule, FormsModule, NavSidebarComponent, TopBarComponent],
  templateUrl: './timesheet.component.html'
})
export class TimesheetComponent implements OnInit {
  employeeTimeZone: EmployeeTimeZone = {
    employeeId: 0,
    timeZone: '',
    workingHoursStart: '',
    workingHoursEnd: '',
    id: 0,
    isSubmitted: false
  };

  timeZones: string[] = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Europe/London',
    'Europe/Paris',
    'Australia/Sydney'
  ];

  isSubmitted = false;
  isSaved = false;
  message = '';

  constructor(private timesheetService: TimesheetService) {}

  ngOnInit(): void {
    // Check if there's existing data for the employee
    const savedEmployeeId = localStorage.getItem('currentEmployeeId');
    if (savedEmployeeId) {
      this.timesheetService.getEmployeeTimeZone(Number(savedEmployeeId))
        .subscribe({
          next: (data) => {
            this.employeeTimeZone = data;
            this.isSaved = true;
          },
          error: (error) => {
            console.error('Error fetching employee timezone:', error);
          }
        });
    }
  }

  onSave(): void {
    this.timesheetService.saveEmployeeTimeZone(this.employeeTimeZone)
      .subscribe({
        next: (response) => {
          this.message = 'Time zone settings saved successfully!';
          this.isSaved = true;
          localStorage.setItem('currentEmployeeId', response.employeeId.toString());
        },
        error: (error) => {
          this.message = 'Error saving time zone settings';
          console.error('Error:', error);
        }
      });
  }

  onSubmit(): void {
    this.isSubmitted = true;
    this.message = 'Time zone settings submitted successfully!';
  }

  onUpdate(): void {
    if (!this.employeeTimeZone.id) {
      this.message = 'Error: No employee ID found for update';
      return;
    }

    this.timesheetService.updateEmployeeTimeZone(this.employeeTimeZone.id, this.employeeTimeZone)
      .subscribe({
        next: () => {
          this.message = 'Time zone settings updated successfully!';
        },
        error: (error) => {
          this.message = 'Error updating time zone settings';
          console.error('Error:', error);
        }
      });
  }
}