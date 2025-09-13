import { Directive, ElementRef, AfterViewInit, AfterViewChecked, Renderer2 } from '@angular/core';

@Directive({ selector: '[appFlip]' })
export class FlipDirective implements AfterViewInit, AfterViewChecked {
  private lastTop = 0;
  private firstMeasureDone = false;

  constructor(private el: ElementRef<HTMLElement>, private r: Renderer2) {
    this.r.setStyle(this.el.nativeElement, 'will-change', 'transform');
  }

  ngAfterViewInit() {
    this.lastTop = this.el.nativeElement.getBoundingClientRect().top;
    this.firstMeasureDone = true;
  }

  ngAfterViewChecked() {
    if (!this.firstMeasureDone) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    const delta = this.lastTop - rect.top;
    if (delta !== 0) {
      const node = this.el.nativeElement;
      node.style.transition = 'none';
      node.style.transform = `translateY(${delta}px)`;
      // Reflow erzwingen
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      node.offsetHeight;
      node.style.transition = 'transform 250ms ease';
      node.style.transform = 'translateY(0)';
    }
    this.lastTop = rect.top;
  }
}
