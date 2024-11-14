import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmployeeTimeZone } from './team-timezone.interface';

@Injectable({
    providedIn: 'root'
  })
  export class TimesheetService {
    private apiUrl = 'http://localhost:8081/api/timezone';
  
    constructor(private http: HttpClient) { }
  
    saveEmployeeTimeZone(employeeTimeZone: EmployeeTimeZone): Observable<EmployeeTimeZone> {
        return this.http.post<EmployeeTimeZone>(this.apiUrl, employeeTimeZone); // no '/save'
      }
      
    submitEmployeeTimeZone(employeeTimeZone: EmployeeTimeZone): Observable<EmployeeTimeZone> {
      return this.http.post<EmployeeTimeZone>(this.apiUrl, employeeTimeZone);
    }
  
    updateEmployeeTimeZone(employeeId: number, employeeTimeZone: EmployeeTimeZone): Observable<EmployeeTimeZone> {
      return this.http.put<EmployeeTimeZone>(`${this.apiUrl}/${employeeId}`, employeeTimeZone);
    }
  
    getEmployeeTimeZone(employeeId: number): Observable<EmployeeTimeZone> {
      return this.http.get<EmployeeTimeZone>(`${this.apiUrl}/${employeeId}`);
    }
  }