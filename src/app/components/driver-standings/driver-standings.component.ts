import { Component, Input, Signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Standing, Driver } from '../../shared/interfaces/driver.interface';
import { Constructor } from '../../shared/interfaces/constructor.interface';
import standings from '../../../data/standings.json';
import constructor from '../../../data/constructor.json';
import { trigger, transition, style, animate } from '@angular/animations';
import { StandingsDataService } from '../../shared/services/standings-data.service';
import { combineLatest, map, Observable, startWith, delay } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { DriverFullcardComponent } from '../driver-fullcard/driver-fullcard.component';

@Component({
  selector: 'app-driver-standings',
  imports: [AsyncPipe, DriverFullcardComponent],
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
  @Input() driver!: Driver;

  races: any[] = [];

  openMenu: string = 'drivers-standing';

  drivers$!: Observable<Standing[]>;

  driver$!: Observable<Driver[]>;

  constructors$!: Observable<Constructor[]>;

  loaded!: Signal<boolean>;


  driverActive: boolean = true;
  constructorActive: boolean = false;

  constructor(public standingsDataService: StandingsDataService) {
    this.drivers$ = this.standingsDataService.getDriverStandings$();
    this.constructors$ = this.standingsDataService.getConstructorStandings$();
    this.driver$ = this.standingsDataService.getDriver$();    

/*     this.loaded = toSignal(
      combineLatest([this.drivers$, this.constructors$]).pipe(
        map(() => true),
        delay(1500) // Ladezeit simulieren
      ),
      { initialValue: false }
    ); */

      this.loaded = toSignal(
      combineLatest([this.drivers$, this.constructors$]).pipe(map(() => true)),
      { initialValue: false }
    );  
  }


    ngOnInit() {
    this.standingsDataService.get2025Races().subscribe((data: any) => {
      this.races = data;
      console.log(this.races);
    });

  }

}
