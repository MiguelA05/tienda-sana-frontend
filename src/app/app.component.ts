import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterOutlet, RouterModule, HeaderComponent, FooterComponent],
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'tienda-sana-frontend';
  footer = 'Desarrollado por MQISoftware - 2025-2';
  
}
