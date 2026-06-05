import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from './app/features/auth/services/auth.service';
import { WebPushService } from './app/core/notifications/web-push.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <router-outlet></router-outlet>
  `,
  styles: [``]
})
export class AppComponent implements OnInit {
  title = 'AuxilioSCZ Frontend';

  constructor(
    private readonly authService: AuthService,
    private readonly webPushService: WebPushService,
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      void this.webPushService.registerDevice();
    }
  }
}
