import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Feedbacktable } from './feedbacktable';

describe('Feedbacktable', () => {
  let component: Feedbacktable;
  let fixture: ComponentFixture<Feedbacktable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Feedbacktable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Feedbacktable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
