import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  DEFAULT_KEYWORDS,
  SITE_NAME,
  SITE_ORIGIN,
} from './core/site-seo.constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [CommonModule, RouterOutlet, RouterModule, HeaderComponent, FooterComponent],
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  footer = 'Desarrollado por MQISoftware - 2025-2';
  isAdminLayout = false;
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const path = e.urlAfterRedirects.split('?')[0];
        this.isAdminLayout = path.startsWith('/admin');
        this.updateCanonical(path);

        if (this.isNoIndexRoute(path)) {
          this.title.setTitle(this.routeTitle(path));
          this.updateRobots(false);
          return;
        }
        this.updateRobots(true);
        if (path.startsWith('/detalle-producto')) {
          return;
        }
        this.applyDefaultMeta(path);
      });
  }

  private isNoIndexRoute(path: string): boolean {
    return (
      path.startsWith('/admin') ||
      path.startsWith('/login') ||
      path.startsWith('/register') ||
      path.startsWith('/cambiar-password') ||
      path.startsWith('/correo-recuperacion') ||
      path.startsWith('/verificar-cuenta')
    );
  }

  private routeTitle(path: string): string {
    if (path.startsWith('/admin')) {
      return `Administración | ${SITE_NAME}`;
    }
    if (path.startsWith('/login')) {
      return `Iniciar sesión | ${SITE_NAME}`;
    }
    if (path.startsWith('/register')) {
      return `Crear cuenta | ${SITE_NAME}`;
    }
    if (path.startsWith('/cambiar-password')) {
      return `Cambiar contraseña | ${SITE_NAME}`;
    }
    if (path.startsWith('/correo-recuperacion')) {
      return `Recuperar contraseña | ${SITE_NAME}`;
    }
    if (path.startsWith('/verificar-cuenta')) {
      return `Verificar cuenta | ${SITE_NAME}`;
    }
    return DEFAULT_SITE_TITLE;
  }

  private updateCanonical(path: string): void {
    const normalized =
      !path || path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`;
    const href = `${SITE_ORIGIN}${normalized === '/' ? '/' : normalized}`;
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private applyDefaultMeta(path: string): void {
    const pageUrl = `${SITE_ORIGIN}${path === '/' ? '' : path}`;
    this.title.setTitle(DEFAULT_SITE_TITLE);
    this.meta.updateTag({ name: 'description', content: DEFAULT_SITE_DESCRIPTION });
    this.meta.updateTag({ name: 'keywords', content: DEFAULT_KEYWORDS });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:title', content: DEFAULT_SITE_TITLE });
    this.meta.updateTag({ property: 'og:description', content: DEFAULT_SITE_DESCRIPTION });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: DEFAULT_SITE_TITLE });
    this.meta.updateTag({ name: 'twitter:description', content: DEFAULT_SITE_DESCRIPTION });
  }

  private updateRobots(indexable: boolean): void {
    this.meta.updateTag({
      name: 'robots',
      content: indexable ? 'index, follow' : 'noindex, nofollow',
    });
  }
}
