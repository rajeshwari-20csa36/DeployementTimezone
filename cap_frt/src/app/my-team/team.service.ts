// team.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Employee } from '../team-dashboard/employee.model';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private teamMembersSubject: BehaviorSubject<Employee[]> = new BehaviorSubject<Employee[]>([]);
  private apiUrl = "http://localhost:8081/api/employees";

  constructor(private http: HttpClient) {}

  // Get the current list of team members as an observable
  getTeamMembers(): Observable<Employee[]> {
    return this.teamMembersSubject.asObservable();
  }

  // Fetch the team members from the backend (if needed)
  fetchTeamMembers(): void {
    this.http.get<Employee[]>(`${this.apiUrl}/team`).subscribe(
      teamMembers => {
        this.teamMembersSubject.next(teamMembers); // Update the local state
      },
      error => {
        console.error('Error fetching team members', error);
      }
    );
  }

  // Add an employee to the local team list
  addTeamMember(employee: Employee): void {
    const currentTeam = this.teamMembersSubject.value;

    // Check if the employee is already part of the team
    if (!currentTeam.some((member) => member.id === employee.id)) {
      const updatedTeam = [...currentTeam, employee];
      this.teamMembersSubject.next(updatedTeam); // Push updated team to the BehaviorSubject
    }
  }

  // Remove a team member from the local team list
  removeTeamMember(employeeId: number): void {
    const currentTeam = this.teamMembersSubject.value;
    const updatedTeam = currentTeam.filter(emp => emp.id !== employeeId);
    this.teamMembersSubject.next(updatedTeam); // Update the local state
  }

  // Clear the local team list
  clearTeam(): void {
    this.teamMembersSubject.next([]);
  }
}
