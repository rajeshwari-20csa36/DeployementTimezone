// team.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Employee } from '../team-dashboard/employee.model';


@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private teamMembersSubject = new BehaviorSubject<Employee[]>([]);
  teamMembers$: Observable<Employee[]> = this.teamMembersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Fetch team members from backend
  getTeamMembers() {
    this.http.get<Employee[]>('http://localhost:8081/api/employees').subscribe(members => {
      this.teamMembersSubject.next(members);
    });
    return this.teamMembers$;
  }

  // Add a team member
  addTeamMember(employee: Employee) {
    const currentMembers = this.teamMembersSubject.value;
    this.teamMembersSubject.next([...currentMembers, employee]);
  }

  // Remove a team member
  removeTeamMember(employeeId: number) {
    const currentMembers = this.teamMembersSubject.value.filter(emp => emp.employeeId !== employeeId);
    this.teamMembersSubject.next(currentMembers);
  }
}