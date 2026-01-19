import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-feature-card',
  imports: [],
  templateUrl: './feature-card.html',
})
export class FeatureCardComponent {
  @Input() title!: string;
  @Input() description!: string;

}