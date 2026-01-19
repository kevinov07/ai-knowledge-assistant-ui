import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureCardComponent } from './feature-card';

describe('FeatureCard', () => {
  let component: FeatureCardComponent;
  let fixture: ComponentFixture<FeatureCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeatureCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
