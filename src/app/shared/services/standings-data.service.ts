import { Injectable } from '@angular/core';
import { Observable, of, interval, switchMap, forkJoin, startWith, catchError  } from 'rxjs';
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
private driverStandingCache: Record<number, any> = {};
private driverStandingMapSubject = new BehaviorSubject<Record<number, any>>({});
public driverStandingMap$ = this.driverStandingMapSubject.asObservable();
  driverStanding?: any | null = null;

  constructor(private http: HttpClient) { }

// Deine bestehende Methode – nur der Subscribe-Block angepasst:
getLiveDriverPosition() {
  const nums = driver.map(d => d.base.driverNumber);
  interval(3000).pipe(
    startWith(0),
    switchMap(() =>
      forkJoin(
        nums.map(n =>
          this.http
            .get<any[]>(`https://api.openf1.org/v1/position?session_key=latest&driver_number=${n}`)
            .pipe(catchError(() => of([])))
        )
      )
    ),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(resultArrays => {
    let changed = false;

    resultArrays.forEach(arr => {
      const latest = arr?.[arr.length - 1] ?? null;
      if (latest && latest.driver_number != null) {
        // Last-known pro Fahrer aktualisieren (fehlende Fahrer bleiben erhalten)
        this.driverStandingCache[latest.driver_number] = latest;

        // Dein bestehendes Single-Subject weiter befüllen (optional, wie bisher)
        this.driverStanding = latest;
        console.log(latest);
        changed = true;
      }
    });

    // Nur senden, wenn sich etwas geändert hat
    if (changed) {
      this.driverStandingMapSubject.next({ ...this.driverStandingCache });
    }
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
      card.addEventListener(
        'animationend',
        () => {
          this.selectedUser = null;
          this.selectedConstructor = null;
        },
        { once: true }
      );
    }
    document.body.classList.remove('modal-open');
  }
}
