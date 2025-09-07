import { Injectable } from '@angular/core';
import {
  Observable,
  of,
  interval,
  switchMap,
  forkJoin,
  startWith,
  catchError,
} from 'rxjs';
import { from, timer, bufferCount, concatMap, retryWhen, scan, delayWhen } from 'rxjs';
import { map } from 'rxjs/operators';
import { Standing } from '../interfaces/driver.interface';
import { Driver } from '../interfaces/driver.interface';
import { Team } from '../interfaces//constructor.interface';
import standings from '../../../data/standings.json';
import driver from '../../../data/driver.json';
import constructor from '../../../data/constructor.json';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Subscription } from 'rxjs';
import { DestroyRef, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StandingsDataService {
  selectedUser: Driver | null = null;
  selectedConstructor: Team | null = null;
  private destroyRef = inject(DestroyRef);
  private driverStandingCache: Record<number, any> = {};
  private driverStandingMapSubject = new BehaviorSubject<Record<number, any>>(
    {}
  );
  public driverStandingMap$ = this.driverStandingMapSubject.asObservable();
  driverStanding?: any | null = null;

  private simData: Record<number, any[]> = {};
  private simIndex: Record<number, number> = {};
  private simTimerSub?: Subscription;
  private simSpeed = 1; // 0.5, 1, 2, 4
  private simCurrentTs = 0; // ms since epoch

  private loadedDrivers = new Set<number>();


  private simMode = false;
  private livePollSub?: Subscription;

  constructor(private http: HttpClient) { }

loadSimulation(sessionKey: number, autoStart: boolean = true, speed: number = 4, startAtIso?: string) {
  this.simMode = true;
  if (this.livePollSub) { this.livePollSub.unsubscribe(); this.livePollSub = undefined; }

  const nums = driver.map(d => d.base.driverNumber as number);
  const batchSize = 3;
  const baseDelayMs = 1000;

  this.simData = {};
  this.simIndex = {};
  let minTs = Number.MAX_SAFE_INTEGER;

  from(nums).pipe(
    bufferCount(batchSize),
    concatMap((chunk, i) =>
      forkJoin(
        chunk.map(n =>
          this.http.get<any[]>(
            `https://api.openf1.org/v1/position?session_key=${sessionKey}&driver_number=${n}`
          ).pipe(
            retryWhen(err$ => err$.pipe(
              scan((acc, err) => {
                if (err.status !== 429 || acc >= 3) throw err;
                return acc + 1;
              }, 0),
              delayWhen(retry => timer((retry + 1) * 1000))
            )),
            catchError(() => of([]))
          )
        )
      ).pipe(delayWhen(() => timer(i * baseDelayMs)))
    )
  ).subscribe(resultArrays => {
    resultArrays.forEach(arr => {
      const sorted = [...arr].sort((a, b) => +new Date(a.date) - +new Date(b.date));
      if (sorted.length) {
        const dn = sorted[0].driver_number;
        this.simData[dn] = sorted;
        this.simIndex[dn] = 0;
        minTs = Math.min(minTs, +new Date(sorted[0].date));
      }
    });

    if (Object.keys(this.simData).length) {
      this.simCurrentTs = isFinite(minTs) ? minTs : 0;
      for (const k in this.simData) this.driverStandingCache[+k] = this.simData[+k][0];
      this.driverStandingMapSubject.next({ ...this.driverStandingCache });

      if (startAtIso) { this.seekSimulation(startAtIso); } // <<< Rennstart setzen (z.B. '2025-09-07T13:00:00Z')

      if (autoStart && !this.simTimerSub) {
        this.startSimulation(speed);
      }
    }
  });
}


  startSimulation(speed: number = 4, tickMs: number = 250) {
    this.simSpeed = speed;
    this.simMode = true;
    if (this.livePollSub) { this.livePollSub.unsubscribe(); this.livePollSub = undefined; }
    this.stopSimulation();
    this.simTimerSub = interval(tickMs).subscribe(() => {
      this.simCurrentTs += tickMs * this.simSpeed;
      let changed = false;
      for (const k in this.simData) {
        const dn = +k;
        const arr = this.simData[dn] ?? [];
        let i = this.simIndex[dn] ?? 0;
        while (i + 1 < arr.length && new Date(arr[i + 1].date).getTime() <= this.simCurrentTs) {
          i++; changed = true;
        }
        this.simIndex[dn] = i;
        if (arr[i]) this.driverStandingCache[dn] = arr[i];
      }
      if (changed) this.driverStandingMapSubject.next({ ...this.driverStandingCache });
    });
    console.log(tickMs);

  }

  pauseSimulation() { this.stopSimulation(); /* Sim bleibt geladen */ }

  private stopSimulation() {
    if (this.simTimerSub) { this.simTimerSub.unsubscribe(); this.simTimerSub = undefined; }
    this.simMode = false;
  }

  seekSimulation(targetIso: string) {
    this.simCurrentTs = new Date(targetIso).getTime();
    for (const k in this.simData) {
      const dn = +k,
        arr = this.simData[dn] ?? [];
      let i = 0;
      while (
        i + 1 < arr.length &&
        new Date(arr[i + 1].date).getTime() <= this.simCurrentTs
      )
        i++;
      this.simIndex[dn] = i;
      if (arr[i]) this.driverStandingCache[dn] = arr[i];
    }
    this.driverStandingMapSubject.next({ ...this.driverStandingCache });
  }


  getLiveDriverPosition() {
    if (this.simMode) return; // simulation hat vorrang
    const nums = driver.map(d => d.base.driverNumber);
    this.livePollSub = interval(3000).pipe(
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
          this.driverStandingCache[latest.driver_number] = latest;
          this.driverStanding = latest;
          changed = true;
        }
      });
      if (changed) this.driverStandingMapSubject.next({ ...this.driverStandingCache });
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
