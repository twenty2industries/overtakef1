import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Standing } from '../interfaces/driver.interface';
import { Constructor } from '../interfaces//constructor.interface';
import standings from '../../../data/standings.json';
import constructor from '../../../data/constructor.json';

@Injectable({
  providedIn: 'root'
})


export class StandingsDataService {


  constructor() { }

  
  getDriverStandings$(): Observable<Standing[]> { // The $ suffix is an angular/ts convention indicating that the value is an observable that should be subscribed to or consumed using async in the template
    return of(standings).pipe(map(a => [...a].sort((x,y)=>y.points-x.points)));
  }

    getConstructorStandings$(): Observable<Constructor[]> {
    return of(constructor).pipe(map(a => [...a].sort((x,y)=>y.points-x.points)));
  }
}
