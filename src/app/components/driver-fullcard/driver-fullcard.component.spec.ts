import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverFullcardComponent } from './driver-fullcard.component';

describe('DriverFullcardComponent', () => {
  let component: DriverFullcardComponent;
  let fixture: ComponentFixture<DriverFullcardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverFullcardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverFullcardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
