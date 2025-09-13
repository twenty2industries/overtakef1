import { Component, Input, Signal } from '@angular/core';
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
  imports: [AsyncPipe, DriverFullcardComponent, DatePipe, FlipDirective],
  templateUrl: './driver-standings.component.html',
  styleUrl: './driver-standings.component.scss',
animations: [
  trigger('fadeSlide', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('200ms ease-out', style({ opacity: 1 }))
    ]),
    transition(':leave', [
      animate('200ms ease-in', style({ opacity: 0 }))
    ]),
  ]),
  trigger('verticalMove', [
    transition(':increment', [
      style({ transform: 'translateY(-100px)' }),
      animate('500ms ease-in-out', style({ transform: 'translateY(0)' }))
    ]),
    transition(':decrement', [
      style({ transform: 'translateY(100px)' }),
      animate('500ms ease-in-out', style({ transform: 'translateY(0)' }))
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
      this.startSim(1); // Simulation starten
    }
  }

  sortWithLiveData() {
    this.driversSimSorted$ = combineLatest([
      // LIVEDATA SORTING OPTION
      this.driver$,
      this.standingsDataService.driverStandingMap$, // sorting option
    ]).pipe(
      map(([drivers, mapObj]) =>
        [...drivers].sort((a, b) => {
          const pa = mapObj?.[a.base.driverNumber]?.position ?? 99;
          const pb = mapObj?.[b.base.driverNumber]?.position ?? 99;
          return pa - pb;
        })
      )
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
    this.simView = true;
    this.sortWithLiveData();
    this.standingsDataService.loadSimulation(9912, true, speed, '2025-09-07T13:00:00Z');
  }

  pauseSim() {
    this.standingsDataService.stopSimulation();
  }

  seekSim(targetIso: string) {
    this.standingsDataService.seekSimulation(targetIso);
  }

  ngOnDestroy() {
    this.standingsDataService.stopSimulation();
  }

  trackByDriver(index: number, d: Driver) {
    return d.base.driverNumber;
  }
}