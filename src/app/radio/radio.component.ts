import { Component, ElementRef, OnInit, ViewChild, Inject, PLATFORM_ID} from '@angular/core';
import { AudioService } from '../audio.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-radio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.css'
})
export class RadioComponent implements OnInit {
  @ViewChild('visualizerCanvas', { static: true }) visualizerCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('startButton', { static: true }) startButton?: ElementRef<HTMLButtonElement>;

  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private dataArray?: Uint8Array;
  private bufferLength?: number;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private isBrowser: boolean;
  private audioInitialized: boolean = false;
  private mediaElementSourceNode?: MediaElementAudioSourceNode;

  constructor(private audioService: AudioService, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.drawVisualizer();
      this.audioService.setVolume(this.audioService.getVolume());
    }
  }

  private initializeAudio(): void {
    if (this.audioService.getAudioElement() && !this.audioInitialized) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.mediaElementSourceNode = this.audioContext.createMediaElementSource(this.audioService.getAudioElement()!);
      this.mediaElementSourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      this.analyser.fftSize = 512;
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
      this.audioInitialized = true;
    }
  }

  playMusic(): void {
    if (this.isBrowser) {
      if (!this.audioInitialized) {
        this.initializeAudio();
      }
      this.audioContext?.resume();
      this.audioService.toggleAudio("http://138.2.165.181:8000/radio.mp3");
    }
  }

  isPlaying(): boolean {
    return this.audioService.isAudioPlaying();
  }

  volumeMusic(event: any): void {
    this.audioService.setVolume(event.target.value);
  }

  getVolume(): number {
    return this.audioService.getVolume();
  }

  private drawVisualizer() {
    if (!this.isBrowser) return;

    requestAnimationFrame(() => this.drawVisualizer());

    if (!this.visualizerCanvas || !this.audioContext || !this.analyser || !this.dataArray || !this.startButton || !this.bufferLength) return;

    this.analyser.getByteFrequencyData(this.dataArray);

    const canvas = this.visualizerCanvas.nativeElement;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const dpi = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpi;
    canvas.height = canvas.clientHeight * dpi;

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) / 3; // Reduced circle radius

    // Create radial gradient using the specified color palette with extended inner colors
    const gradient = canvasCtx.createRadialGradient(centerX, centerY, radius / 0.6, centerX, centerY, radius);
    gradient.addColorStop(1, '#00CED1');
    gradient.addColorStop(0.6, '#FF69B4');
    gradient.addColorStop(0, '#8A2BE2');

    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = gradient;

    // Enhance glow effect with gradient color
    canvasCtx.shadowBlur = 15;
    canvasCtx.shadowColor = 'rgba(255, 255, 255, 0.9)'; // Shadow color to match gradient

    // Frequency range to display (e.g., 10% to 60% of the data array)
    const start = Math.floor(this.bufferLength * 0.1);
    const end = Math.floor(this.bufferLength * 0.6);
    const visibleLength = end - start;

    // Interpolation function for smoother transitions
    const interpolate = (i: number, j: number, t: number) => {
      if (this.dataArray) {
        return this.dataArray[i] * (1 - t) + this.dataArray[j] * t;
      }
      return 0; // Default value or handle as needed when dataArray is undefined
    };

    // Function to draw a circular line with Bézier curves
    const drawCircularLine = (offset: number, flipVertical: boolean) => {
      canvasCtx.save(); // Save the current canvas context state
    
      // Translate and flip vertically if needed
      if (flipVertical) {
        canvasCtx.translate(centerX, centerY); // Translate to the center
        canvasCtx.scale(1, -1); // Flip vertically
        canvasCtx.translate(-centerX, -centerY); // Translate back
      }
    
      canvasCtx.beginPath();
      if (this.dataArray) {
        const drawHalf = (startOffset: number, angleOffset: number) => {
          const points = [];
    
          // Generate points for the path
          for (let i = 0; i < visibleLength; i++) {
            const angle = (i / (visibleLength - 1)) * Math.PI + angleOffset;
            const value = interpolate(start + i, start + i + 1, 0.5) / 255;
            const x = centerX + (radius + offset * value * 1.5) * Math.cos(angle); // Increased audio response
            const y = centerY + (radius + offset * value * 1.5) * Math.sin(angle); // Increased audio response
            points.push({ x, y });
          }
    
          // Move to the first point
          canvasCtx.moveTo(points[0].x, points[0].y);
    
          // Draw a smooth curve through all points
          for (let i = 1; i < points.length - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            canvasCtx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
          }
    
          // Draw the last segment as a straight line to the end
          canvasCtx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        };
    
        // Draw one half of the circle (0 to PI)
        drawHalf(0, -Math.PI / 2);
    
        // Draw mirrored half of the circle (PI to 2PI)
        drawHalf(0, Math.PI / 2);
      }
      canvasCtx.restore(); // Restore the canvas context to its original state
      canvasCtx.stroke();
    };


    // Additional lines with smaller offsets
    const offsets = [150, 125, 100, 75, 50, 25, 0, -25, -50]; // Increased gaps between lines
    offsets.forEach(offset => {
      drawCircularLine(offset, true);
      drawCircularLine(offset, false);
    });
  }
}
