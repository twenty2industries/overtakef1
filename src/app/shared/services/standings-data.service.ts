import { Injectable } from '@angular/core';
import { Observable, of, interval, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Standing } from '../interfaces/driver.interface';
import { Driver } from '../interfaces/driver.interface';
import { Team } from '../interfaces//constructor.interface';
import standings from '../../../data/standings.json';
import driver from '../../../data/driver.json';
import constructor from '../../../data/constructor.json';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';
import { DestroyRef, inject } from '@angular/core';


@Injectable({
  providedIn: 'root',
})
export class StandingsDataService {
  selectedUser: Driver | null = null;
  selectedConstructor: Team | null = null;
  private destroyRef = inject(DestroyRef);
private oscarStandingSubject = new BehaviorSubject<any | null>(null);
public oscarStanding$ = this.oscarStandingSubject.asObservable();
oscarStanding: any | null = null;



  constructor(private http: HttpClient) {
    this.getLiveDriverStandingOscar();
    interval(3000).pipe(
  switchMap(() => this.http.get<any[]>(
    'https://api.openf1.org/v1/position?session_key=latest&driver_number=81'
  )),
  takeUntilDestroyed(this.destroyRef)
).subscribe(arr => {
  const latest = arr[arr.length - 1];
  this.oscarStanding = latest;
  console.log(this.oscarStanding);
  
  this.oscarStandingSubject.next(latest);
});
  }

  getDriverStandings$(): Observable<Standing[]> {
    // The $ suffix is an angular/ts convention indicating that the value is an observable that should be subscribed to or consumed using async in the template
    return of(standings).pipe(
      map((a) => [...a].sort((x, y) => y.points - x.points))
    );
  }

  getDriver$(): Observable<Driver[]> {
    // The $ suffix is an angular/ts convention indicating that the value is an observable that should be subscribed to or consumed using async in the template
    return of(driver).pipe(
      map((a) => [...a].sort((x, y) => y.season.points - x.season.points))
    );
  }

  getConstructorStandings$(): Observable<Team[]> {
    return of(constructor).pipe(
      map((a) => [...a].sort((x, y) => y.points - x.points))
    );
  }

  get2025Races() {
    return this.http.get('https://api.openf1.org/v1/sessions?year=2025');
  }

  openDriverFullCard(driver: Driver) {
    this.selectedUser = driver;
    document.body.classList.add('modal-open');
  }

  openConstructorFullCard(constructor: Team) {
    this.selectedConstructor = constructor;
    document.body.classList.add('modal-open');
  }

  closeDriverFullCard() {
    const card = document.querySelector('app-driver-fullcard');
    if (card) {
      card.classList.add('fade-out');
      card.addEventListener('animationend', () => {
        this.selectedUser = null;
        this.selectedConstructor = null;
      }, { once: true });
    }
    document.body.classList.remove('modal-open');
  }

  getLiveDriverStanding() {
    fetch("https://api.openf1.org/v1/position?session_key=latest&driver_number=81")
      .then((response) => response.json())
      .then((jsonContent) => console.log(jsonContent));
  }

  getLiveDriverStandingOscar() {
  fetch("https://api.openf1.org/v1/position?session_key=latest&driver_number=81")
    .then((response) => response.json())
    .then((jsonContent) => {
      this.oscarStanding = jsonContent[jsonContent.length - 1];
      console.log("Oscar Piastri aktuelle Position:", this.oscarStanding.position);
    });
}

}
