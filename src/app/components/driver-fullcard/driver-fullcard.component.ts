import { Component, Input } from '@angular/core';
import driver from '../../../data/driver.json';
import { Standing, Driver } from '../../shared/interfaces/driver.interface';
import constructor from '../../../data/constructor.json';
import { trigger, transition, style, animate } from '@angular/animations';


@Component({
  selector: 'app-driver-fullcard',
  imports: [],
  templateUrl: './driver-fullcard.component.html',
  styleUrl: './driver-fullcard.component.scss',
    animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms ease-in',
          style({ opacity: 0, transform: 'translateX(-100px)' })
        ),
      ]),
    ]),
  ],

})
export class DriverFullcardComponent {

  @Input() driver!:Driver;
}
