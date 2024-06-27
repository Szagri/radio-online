import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private volume: number = 50;
  private isBrowser: boolean;
  private audioContext: AudioContext | null = null;
  private mediaElementSourceNode: MediaElementAudioSourceNode | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.loadVolumeFromStorage();
      this.createAudioElement();
    }
  }

  private createAudioElement(): void {
    if (this.isBrowser) {
      this.audio = new Audio();
      this.audio.crossOrigin = "anonymous";
      this.audio.volume = this.volume / 100;
      this.setupAudioContext();
    }
  }

  private setupAudioContext(): void {
    if (this.isBrowser && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private connectAudioToAnalyser(): void {
    if (this.audio && this.audioContext) {
      if (this.mediaElementSourceNode) {
        this.disconnectAudioFromAnalyser();
      }
      this.mediaElementSourceNode = this.audioContext.createMediaElementSource(this.audio);
    }
  }

  private disconnectAudioFromAnalyser(): void {
    if (this.audioContext && this.mediaElementSourceNode) {
      this.mediaElementSourceNode.disconnect();
      this.mediaElementSourceNode = null;
    }
  }

  private loadVolumeFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const savedVolume = localStorage.getItem('audioVolume');
      if (savedVolume !== null) {
        this.volume = parseFloat(savedVolume);
        if (this.audio) {
          this.audio.volume = this.volume / 100;
        }
      }
    }
  }

  playAudio(url: string): void {
    if (!this.audio) {
      this.createAudioElement();
    }
    if (this.audio) {
      if (this.audio.src !== url) {
        this.audio.src = url;
        this.audio.load();
      }
      this.audio.play().catch(error => {
        console.error('Play error:', error);
      });
      this.isPlaying = true;
      this.connectAudioToAnalyser();
    }
  }

  
  pauseAudio(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      this.disconnectAudioFromAnalyser();
    }
  }

  toggleAudio(url: string): void {
    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      this.playAudio(url);
    }
  }

  isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  setVolume(volume: number): void {
    this.volume = volume;
    if (this.audio) {
      this.audio.volume = this.volume / 100;
    }
    if(typeof localStorage !== 'undefined') {
      localStorage.setItem('audioVolume', this.volume.toString());
    }
  }
   
   getVolume(): number {
    return this.volume;
   }

   getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }

}
