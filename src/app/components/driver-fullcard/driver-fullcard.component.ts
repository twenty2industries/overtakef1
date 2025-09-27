import { Component, inject, Input, Signal } from '@angular/core';
import driver from '../../../data/driver.json';
import { Standing, Driver } from '../../shared/interfaces/driver.interface';
import { Team } from '../../shared/interfaces/constructor.interface';
import constructor from '../../../data/constructor.json';
import { trigger, transition, style, animate } from '@angular/animations';
import { StandingsDataService } from '../../shared/services/standings-data.service';
import { combineLatest, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FirebaseService } from '../../shared/services/firebase.service';
import { collectionData } from '@angular/fire/firestore';

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
  driverInput: string = 'career';
  drivers$!: Observable<Standing[]>;
  driver$!: Observable<Driver[]>;
  constructors$!: Observable<Team[]>;
  loaded!: Signal<boolean>;

  public currentDrivers: any[] = [];
  public firebaseDrivers: any[] = [];

  @Input() driver!: any;
  @Input() driverId!: string;

  @Input() team!: Team; 


  firestoreItems$: any;

  constructor(
    public standingsDataService: StandingsDataService,
    public firebaseService: FirebaseService
  ) {
    this.drivers$ = this.standingsDataService.getDriverStandings$();
    this.constructors$ = this.standingsDataService.getConstructorStandings$();
    this.driver$ = this.standingsDataService.getDriver$();

    this.loaded = toSignal(
      combineLatest([this.drivers$, this.constructors$]).pipe(map(() => true)),
      { initialValue: false }
    ); 
    this.firestoreItems$ = collectionData(this.firebaseService.getFirestoreCollectionDrivers())
    console.log(this.firestoreItems$);
    
  }

  ngOnInit() {
    this.standingsDataService.getDriversWithAssets().subscribe((data: any) => {
      this.currentDrivers = data;
    });
  }
}
