import { provideTemplateFrom } from './directives/original-template/original-template.directive';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [provideTemplateFrom(AppComponent)]
})
export class AppComponent {
  title = 'app works!';

  // Add this properties if you want to work in AOT compilation mode
  custom: string;
  inner: string;
  notPrecise: string;
  precise: string;
}
