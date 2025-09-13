import {
  Directive,
  ElementRef,
  AfterViewInit,
  AfterViewChecked,
  Renderer2,
} from '@angular/core';

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
      // bestehende Transition merken (inkl. height/width)
      const prev = getComputedStyle(node).transition || '';

      // Phase 1: ohne transform-Transition zurückspringen, andere Transitions behalten
      node.style.transition = (prev ? prev + ', ' : '') + 'transform 0s';
      node.style.transform = `translateY(${delta}px)`;
      // Reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      node.offsetHeight;

      // Phase 2: transform animieren, andere Transitions bleiben intakt
      node.style.transition =
        (prev ? prev + ', ' : '') + 'transform 250ms ease';
      node.style.transform = 'translateY(0)';
    }
    this.lastTop = rect.top;
  }
}
