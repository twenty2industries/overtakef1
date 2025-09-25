import {
  Component,
  ElementRef,
  Input,
  Signal,
  ViewChild,
  effect,
} from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Standing, Driver } from '../../shared/interfaces/driver.interface';
import { Team } from '../../shared/interfaces/constructor.interface';
import { trigger, transition, style, animate } from '@angular/animations';
import { StandingsDataService } from '../../shared/services/standings-data.service';
import { combineLatest, map, Observable, delay } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { DriverFullcardComponent } from '../driver-fullcard/driver-fullcard.component';

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
  private races: any[] = [];

  public currentDrivers: any[] = [];

  public openMenu: string = 'drivers-standing';

  public drivers$!: Observable<Standing[]>;

  public constructors$!: Observable<Team[]>;

  public loaded!: Signal<boolean>;

  public driverActive: boolean = true;

  public constructorActive: boolean = false;

  public simView: boolean = false;
  

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

  @ViewChild('liveTextContainer') private scrollContainer!: ElementRef;

  ngOnInit() {
    this.standingsDataService.get2025Races().subscribe((data: any) => {
      this.races = data;
    });
    if (this.standingsDataService.useSimulation) {
      this.standingsDataService.startSim(1);
    }

      this.standingsDataService.getCurrentDrivers().subscribe((data: any) => {
    this.currentDrivers = data;
  });
  }

  pauseSim() {
    this.standingsDataService.stopSimulation();
  }

  seekSim(targetIso: string) {
    this.standingsDataService.seekSimulation(targetIso);
  }

  trackByDriver(index: number, d: Driver): number {
    return d.base.driverNumber;
  }

  toggleSimView(): void {
    this.simView = !this.simView;
    this.openMenu = 'live-standings';
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    });
  }

  liveOvertakeMessagesSubscription() {
    this.standingsDataService.overtakeMessages$.subscribe(() => {
      this.scrollToBottom();
    });
  }

  ngAfterViewInit(): void {
    this.liveOvertakeMessagesSubscription();
    console.log(this.currentDriver());
    
  }

  currentDriver(): void{
    this.standingsDataService.getCurrentDrivers().subscribe(subDrivers => {
      return subDrivers;
    })
  }
}
