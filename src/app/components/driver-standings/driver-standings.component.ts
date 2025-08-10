import { Component } from '@angular/core';
import { Standing } from '../../shared/interfaces/driver.interface';
import { Constructor } from '../../shared/interfaces/constructor.interface';
import standings from '../../../data/standings.json';
import constructor from '../../../data/constructor.json';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-driver-standings',
  imports: [],
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

  driverStandings: Standing[] = standings;
  
  constructosStandings: Constructor[] = constructor;

  constructor() {
    this.driverStandings = standings.sort((a, b) => b.points - a.points);
    this.constructosStandings = constructor.sort((a, b) => b.points - a.points);
  }
}
