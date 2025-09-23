import { Injectable } from '@angular/core';
import {
  Observable,
  of,
  interval,
  switchMap,
  forkJoin,
  startWith,
  catchError,
  combineLatest,
} from 'rxjs';
import {
  from,
  timer,
  bufferCount,
  concatMap,
  retryWhen,
  scan,
  delayWhen,
} from 'rxjs';
import { exhaustMap, map, toArray } from 'rxjs/operators';
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

@Injectable({ providedIn: 'root' })
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
  public simTimerSub?: Subscription;
  private simSpeed = 1; // 0.5, 1, 2, 4

  private simCurrentTs: number = 0; // ms since epoch

  private loadedDrivers: number = 0;

  simMode: boolean = false;
  private livePollSub?: Subscription;

  private simTimeSubject = new BehaviorSubject<number>(0);
  public simTime$ = this.simTimeSubject.asObservable();

  driversSimSorted$!: Observable<Driver[]>; // TODO: need to extract

  private prevIndex = new Map<number, number>();

  public useSimulation: boolean = false; // true = Simulation, false = Live

private overtakeMessagesSubject = new BehaviorSubject<string[]>([]);
public overtakeMessages$ = this.overtakeMessagesSubject.asObservable();

  driver$ = of(driver).pipe(
    map((a) => [...a].sort((x, y) => y.season.points - x.season.points))
  );

  constructor(private http: HttpClient) {}

  loadSimulation(
    sessionKey: number | string,
    autoStart: boolean = false,
    speed: number = 1,
    startAtIso?: string
  ) {
    this.simMode = true;
    if (this.livePollSub) {
      this.livePollSub.unsubscribe();
      this.livePollSub = undefined;
    }
    const nums = driver.map((d) => d.base.driverNumber as number);
    const batchSize = 6;
    const baseDelayMs = 900;
    this.simData = {};
    this.simIndex = {};
    let minTs = Number.MAX_SAFE_INTEGER;
    from(nums)
      .pipe(
        bufferCount(batchSize),
        concatMap((chunk, i) =>
          forkJoin(
            chunk.map((n) =>
              this.http
                .get<any[]>(
                  `https://api.openf1.org/v1/position?session_key=${sessionKey}&driver_number=${n}`
                )
                .pipe(
                  retryWhen((err$) =>
                    err$.pipe(
                      scan((acc, err) => {
                        if (err.status !== 429 || acc >= 3) throw err;
                        return acc + 1;
                      }, 0),
                      delayWhen((retry) => timer((retry + 1) * 1000))
                    )
                  ),
                  catchError(() => of([]))
                )
            )
          ).pipe(delayWhen(() => timer(i * baseDelayMs)))
        )
      )
      .subscribe((resultArrays) => {
        resultArrays.forEach((arr) => {
          const sorted = [...arr].sort(
            (a, b) => +new Date(a.date) - +new Date(b.date)
          );
          if (sorted.length) {
            const dn = sorted[0].driver_number;
            this.simData[dn] = sorted;
            this.simIndex[dn] = 0;
            minTs = Math.min(minTs, +new Date(sorted[0].date));
          }
        });
        this.loadedDrivers += 5;
        if (this.loadedDrivers >= nums.length) {
          if (Object.keys(this.simData).length) {
            this.simCurrentTs = isFinite(minTs) ? minTs : 0;
            this.simTimeSubject.next(this.simCurrentTs); // << zeit initial emitten
            for (const k in this.simData)
              this.driverStandingCache[+k] = this.simData[+k][0];
            this.driverStandingMapSubject.next({ ...this.driverStandingCache });

            if (startAtIso) {
              this.seekSimulation(startAtIso);
              this.simTimeSubject.next(this.simCurrentTs);
            }

            if (autoStart && !this.simTimerSub) {
              this.startSimulation(speed);
            }
          }
        }
      });
  }

  startSimulation(speed: number = 1, tickMs: number = 500) {
    this.simSpeed = speed;
    this.simMode = true;
    if (this.livePollSub) {
      this.livePollSub.unsubscribe();
      this.livePollSub = undefined;
    }
    this.simTimerSub = interval(tickMs).subscribe(() => {
      this.simCurrentTs += tickMs * this.simSpeed;
      let changed = false;
      for (const k in this.simData) {
        const dn = +k;
        const arr = this.simData[dn] ?? [];
        let i = this.simIndex[dn] ?? 0;
        while (
          i + 1 < arr.length &&
          new Date(arr[i + 1].date).getTime() <= this.simCurrentTs
        ) {
          i++;
          changed = true;
        }
        this.simIndex[dn] = i;
        if (arr[i]) this.driverStandingCache[dn] = arr[i];
      }
      if (changed)
        this.driverStandingMapSubject.next({ ...this.driverStandingCache });
      this.simTimeSubject.next(this.simCurrentTs); // << zeit emitten
    });
  }

  stopSimulation() {
    if (this.simTimerSub) {
      this.simTimerSub.unsubscribe();
      this.simTimerSub = undefined;
    }
    this.simMode = false;
    console.log('stopsimulation wurde ausgeführt');
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
    if (this.livePollSub) {
      this.livePollSub.unsubscribe();
      this.livePollSub = undefined;
    }

    const nums = driver.map((d) => d.base.driverNumber);
    const batchSize = 4; // wie viele parallel
    const baseDelayMs = 800; // abstand zwischen batches

    this.livePollSub = interval(800)
      .pipe(
        startWith(0),
        //bis eine komplette runde fertig ist (alle batches) bevor die nächste startet
        exhaustMap(() =>
          from(nums).pipe(
            bufferCount(batchSize),
            concatMap((chunk, i) =>
              forkJoin(
                chunk.map((n) =>
                  this.http
                    .get<any[]>(
                      `https://api.openf1.org/v1/position?session_key=latest&driver_number=${n}`
                    )
                    .pipe(
                      retryWhen((err$) =>
                        err$.pipe(
                          scan((acc, err) => {
                            if (err.status !== 429 || acc >= 2) throw err;
                            return acc + 1;
                          }, 0),
                          delayWhen((retry) => timer((retry + 1) * 1000)) // 1s, 2s backoff
                        )
                      ),
                      catchError(() => of([]))
                    )
                )
              ).pipe(delayWhen(() => timer(i * baseDelayMs)))
            ),
            toArray() // sammelt alle batch-ergebnisse dieser runde
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((batches) => {
        let changed = false;
        batches.forEach((resultArrays) => {
          resultArrays.forEach((arr) => {
            const latest = arr?.[arr.length - 1] ?? null;
            if (latest && latest.driver_number != null) {
              this.driverStandingCache[latest.driver_number] = latest;
              this.driverStanding = latest;
              changed = true;
            }
          });
        });
        if (changed)
          this.driverStandingMapSubject.next({ ...this.driverStandingCache });
        // optional: progress
        // console.log('live drivers updated:', Object.keys(this.driverStandingCache).length);
      });
  }

  getDriverStandings$(): Observable<Standing[]> {
    return of(standings).pipe(
      map((a) => [...a].sort((x, y) => y.points - x.points))
    );
  }

  getDriver$(): Observable<Driver[]> {
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

    sortWithLiveData() {
    this.driversSimSorted$ = combineLatest([
      this.driver$,
      this.driverStandingMap$,
    ]).pipe(
      map(([drivers, mapObj]) => {
        const sorted = [...drivers].sort(
          (a, b) =>
            (mapObj?.[a.base.driverNumber]?.position ?? 99) -
            (mapObj?.[b.base.driverNumber]?.position ?? 99)
        );
        this.proccessLiveOvertakes(sorted);
        return sorted;
      })
    );
  }

  proccessLiveOvertakes(sortedDriverStanding: Array<Driver>) {
    this.proccessOvertakeData(sortedDriverStanding);
    this.prevIndex = this.calculateCurrentPositions(sortedDriverStanding);
    return sortedDriverStanding;
  }

  proccessOvertakeData(overtakeData: Array<Driver>){
        overtakeData.forEach((d, i) => {
      const prev = this.prevIndex.get(d.base.driverNumber);
      if (prev !== undefined && i < prev) {
        const overtaken = overtakeData[i + 1]; // direkt hinter ihm nach dem Move
        const liveTextContainer = document.querySelector(
          '.live-text-container'
        );
        if (liveTextContainer) {
          liveTextContainer.innerHTML = ` <p>${d.base.driverName} overtook ${
            overtaken.base.driverName
          } → P${i + 1}</p>`;
        }
      }
    });
  }

  addOvertakeMessage(msg: string): void {
  const current = this.overtakeMessagesSubject.getValue();
  this.overtakeMessagesSubject.next([...current, msg]);
}

  calculateCurrentPositions(driverStandings: Array<Driver>) {
    // aktuelle Indizes merken
    const currentIndex = new Map<number, number>();
    driverStandings.forEach((d, i) =>
      currentIndex.set(d.base.driverNumber, i)
    );
    return currentIndex;
  }

  sortWithNewestData() {
    this.driversSimSorted$ = combineLatest([
      this.driver$,
      this.driverStandingMap$, // sorting option
    ]).pipe(
      map(([drivers, mapObj]) =>
        [...drivers].sort((a, b) => {
          const pa = a.season.points ?? 0;
          const pb = b.season.points ?? 0;
          return pb - pa;
        })
      )
    );
  }

  startSim(speed: number = 1) {
    this.sortWithLiveData();
    this.loadSimulation('latest', true, speed, '2025-09-21T11:00:00Z');
  }
}
