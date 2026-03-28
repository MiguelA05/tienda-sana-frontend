import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [CommonModule, RouterOutlet, RouterModule, HeaderComponent, FooterComponent],
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'tienda-sana-frontend';
  footer = 'Desarrollado por MQISoftware - 2025-2';
  isAdminLayout = false;
  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const path = e.urlAfterRedirects.split('?')[0];
        this.isAdminLayout = path.startsWith('/admin');
      });
  }
}
