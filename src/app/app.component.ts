import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChildren, AfterViewInit, QueryList, ElementRef, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RadioComponent } from './radio/radio.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RadioComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit{

  @ViewChildren('movingImage', { read: ElementRef }) movingImages?: QueryList<ElementRef<HTMLImageElement>>;

  private imagePositions: { x: number, y: number }[] = [];
  private directions: { x: number, y: number }[] = [];
  private isBrowser: boolean = typeof window !== 'undefined';

  constructor(private ngZone: NgZone) {}

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isBrowser) return;

    this.ngZone.runOutsideAngular(() => {
      const elements = [
        { selector: '.parallax-background', factorX: 95, factorY: 95 },
        { selector: '.parallax-moon', factorX: 35, factorY: 35 },
        { selector: '.parallax-asteroids', factorX: 55, factorY: 55 },
        { selector: '.parallax-earth', factorX: 75, factorY: 75 }
      ];

      elements.forEach(({ selector, factorX, factorY }) => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          const x = (window.innerWidth - event.pageX * 2) / factorX;
          const y = (window.innerHeight - event.pageY * 2) / factorY;
          element.style.transform = `translate(${x}px, ${y}px)`;
        }
      });
    });
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.initializePositions();
      this.animateImages();
    }
  }

  private initializePositions(): void {
    if (!this.isBrowser) return;
    const images = this.movingImages?.toArray().map((img: ElementRef<HTMLImageElement>) => img.nativeElement);
    if (!images || images.length === 0) return;

    images.forEach(img => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      this.imagePositions.push({ x, y });

      const directionX = Math.random() * 2 + 1;
      const directionY = (Math.random() - 0.5) * 2;
      this.directions.push({ x: directionX, y: directionY });
    });
  }

  private animateImages(): void {
    if (!this.isBrowser) return;

    const images = this.movingImages?.toArray().map((img: ElementRef<HTMLImageElement>) => img.nativeElement);
    if (!images || images.length === 0) return;

    const animate = () => {
      this.ngZone.runOutsideAngular(() => {
        images.forEach((img, i) => {
          this.imagePositions[i].x += this.directions[i].x;
          this.imagePositions[i].y += this.directions[i].y;

          if (this.imagePositions[i].x > window.innerWidth) {
            this.imagePositions[i].x = -img.width;
          }

          if (this.imagePositions[i].y <= 0 || this.imagePositions[i].y + img.height >= window.innerHeight) {
            this.directions[i].y *= -1;
          }

          img.style.transform = `translate(${this.imagePositions[i].x}px, ${this.imagePositions[i].y}px)`;
        });

        requestAnimationFrame(animate);
      });
    };

    animate();
  }
}
