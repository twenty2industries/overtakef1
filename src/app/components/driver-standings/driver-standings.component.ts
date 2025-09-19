import { Component, Input, Signal, effect } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Standing, Driver } from '../../shared/interfaces/driver.interface';
import { Team } from '../../shared/interfaces/constructor.interface';
import { trigger, transition, style, animate } from '@angular/animations';
import { StandingsDataService } from '../../shared/services/standings-data.service';
import { combineLatest, map, Observable, delay } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { DriverFullcardComponent } from '../driver-fullcard/driver-fullcard.component';
import { FlipDirective } from '../../shared/flip.directive';

@Component({
  selector: 'app-driver-standings',
  imports: [AsyncPipe, DriverFullcardComponent, DatePipe],
  templateUrl: './driver-standings.component.html',
  styleUrl: './driver-standings.component.scss',
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('verticalMove', [
      transition(':increment', [
        style({ transform: 'translateY(-30px)' }),
        animate('500ms ease-in-out', style({ transform: 'translateY(0)' })),
      ]),
      transition(':decrement', [
        style({ transform: 'translateY(30px)' }),
        animate('500ms ease-in-out', style({ transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class DriverStandingsComponent {
  races: any[] = [];
  openMenu: string = 'drivers-standing';
  drivers$!: Observable<Standing[]>;
  driver$!: Observable<Driver[]>;
  constructors$!: Observable<Team[]>;
  loaded!: Signal<boolean>;
  driverActive: boolean = true;
  constructorActive: boolean = false;

  driversSimSorted$!: Observable<Driver[]>;

  useSimulation: boolean = false; // true = Simulation, false = Live

  private lastPositions = new Map<number, number>();

  private prevIndex = new Map<number, number>();

  simView: boolean = false;

  constructor(public standingsDataService: StandingsDataService) {
    this.drivers$ = this.standingsDataService.getDriverStandings$();
    this.constructors$ = this.standingsDataService.getConstructorStandings$();
    this.driver$ = this.standingsDataService.getDriver$();
    this.sortWithNewestData();
    this.loaded = toSignal(
      combineLatest([this.drivers$, this.constructors$]).pipe(map(() => true)),
      { initialValue: false }
    );
  }

  ngOnInit() {
    this.standingsDataService.get2025Races().subscribe((data: any) => {
      this.races = data;
    });
    if (this.useSimulation) {
      this.startSim(1);
    }
  }

  sortWithLiveData() {
    this.driversSimSorted$ = combineLatest([
      // creates observable
      this.driver$,
      this.standingsDataService.driverStandingMap$, // sorting option
    ]).pipe(
      //neccessary to use map on obseravble
      map(([drivers, mapObj]) => {
        const sorted = [...drivers].sort(
          (a, b) =>
            (mapObj?.[a.base.driverNumber]?.position ?? 99) -
            (mapObj?.[b.base.driverNumber]?.position ?? 99)
        );

        // aktuelle Indizes merken
        const currIndex = new Map<number, number>();
        sorted.forEach((d, i) => currIndex.set(d.base.driverNumber, i));

        // Überholungen loggen (nur Moves nach vorn)
        sorted.forEach((d, i) => {
          const prev = this.prevIndex.get(d.base.driverNumber);
          if (prev !== undefined && i < prev) {
            const overtaken = sorted[i + 1]; // direkt hinter ihm nach dem Move
            const liveTextContainer = document.querySelector('.live-text-container');
            if (liveTextContainer) {
              liveTextContainer.innerHTML = ` <p>${d.base.driverName} overtook ${overtaken.base.driverName} → P${i + 1}</p>`;
            }

          }
        });

        this.prevIndex = currIndex;
        return sorted;
      })
    );
  }

  sortWithNewestData() {
    this.driversSimSorted$ = combineLatest([
      this.driver$,
      this.standingsDataService.driverStandingMap$, // sorting option
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
    this.standingsDataService.loadSimulation(
      9912,
      true,
      speed,
      '2025-09-07T13:00:00Z'
    );
  }

  pauseSim() {
    this.standingsDataService.stopSimulation();
  }

  seekSim(targetIso: string) {
    this.standingsDataService.seekSimulation(targetIso);
  }

  trackByDriver(index: number, d: Driver) {
    return d.base.driverNumber;
  }

  toggleSimView() {
    this.simView = !this.simView;
    this.openMenu = 'live-standings';
  }

  ngAfterViewInit() {
    effect(() => {
      if (this.loaded()) {
        console.log('Alles geladen, jetzt anzeigen!');
      }
    });
  }
}
