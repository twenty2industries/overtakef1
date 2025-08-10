import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DriverStandingsComponent } from './components/driver-standings/driver-standings.component';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DriverStandingsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'overtake';
}
