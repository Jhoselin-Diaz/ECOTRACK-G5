import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenuComponent } from './component/usuario/menu/menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(private router: Router) {}

  isAuthRoute(): boolean {
    const url = this.router.url;
    return url === '/login' || url === '/register' || url.startsWith('/admin');
  }
}
