import { Component } from '@angular/core';
import { Standing } from '../../shared/interfaces/driver.interface';
import { Constructor } from '../../shared/interfaces/constructor.interface';
import standings from '../../../data/standings.json'
import constructor from '../../../data/constructor.json'


@Component({
  selector: 'app-driver-standings',
  imports: [],
  templateUrl: './driver-standings.component.html',
  styleUrl: './driver-standings.component.scss'
})
export class DriverStandingsComponent {

openMenu: string = 'drivers-standing'

driverStandings: Standing[] = standings;
constructosStandings: Constructor[] = constructor;

}
