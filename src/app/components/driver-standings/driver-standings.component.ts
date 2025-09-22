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

  constructors$!: Observable<Team[]>;

  loaded!: Signal<boolean>;

  driverActive: boolean = true;

  constructorActive: boolean = false;


  simView: boolean = false;

  constructor(public standingsDataService: StandingsDataService) {
    this.drivers$ = this.standingsDataService.getDriverStandings$();
    this.constructors$ = this.standingsDataService.getConstructorStandings$();
    this.standingsDataService.sortWithNewestData();

    this.loaded = toSignal(
      combineLatest([this.drivers$, this.constructors$]).pipe(map(() => true)),
      { initialValue: false }
    );

    effect(() => {
      if (this.loaded()) {
        console.log('Alles geladen, jetzt anzeigen!');
      }
    });
  }

  ngOnInit() {
    this.standingsDataService.get2025Races().subscribe((data: any) => {
      this.races = data;
    });
    if (this.standingsDataService.useSimulation) {
      this.standingsDataService.startSim(1);
    }
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
}
