import { Component, Signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Standing } from '../../shared/interfaces/driver.interface';
import { Constructor } from '../../shared/interfaces/constructor.interface';
import standings from '../../../data/standings.json';
import constructor from '../../../data/constructor.json';
import { trigger, transition, style, animate } from '@angular/animations';
import { StandingsDataService } from '../../shared/services/standings-data.service';
import { combineLatest, map, Observable, startWith, delay } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-driver-standings',
  imports: [AsyncPipe],
  templateUrl: './driver-standings.component.html',
  styleUrl: './driver-standings.component.scss',
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms ease-in',
          style({ opacity: 0, transform: 'translateX(-20px)' })
        ),
      ]),
    ]),
  ],
})
export class DriverStandingsComponent {
  openMenu: string = 'drivers-standing';

  drivers$!: Observable<Standing[]>;
  constructors$!: Observable<Constructor[]>;
  loaded!: Signal<boolean>;

  constructor(private standingsDataService: StandingsDataService) {
    this.drivers$ = this.standingsDataService.getDriverStandings$();
    this.constructors$ = this.standingsDataService.getConstructorStandings$();
/*this.loaded = toSignal(
  combineLatest([this.drivers$, this.constructors$]).pipe(
    map(() => true),
    delay(1500) // Ladezeit simulieren
  ),
  { initialValue: false }
);*/

    this.loaded = toSignal(
      combineLatest([this.drivers$, this.constructors$]).pipe(map(() => true)),
      { initialValue: false }
    ); 
  }

  
}
