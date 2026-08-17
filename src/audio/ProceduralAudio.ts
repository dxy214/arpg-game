import type { AbilitySlot, DamageKind, GameplayEvent, PlayerForm } from '../gameplay';

type FrequencyBand = 'low' | 'mid' | 'high';

type ToneOptions = {
  frequency: number;
  duration: number;
  gain: number;
  band: FrequencyBand;
  type?: OscillatorType;
  attack?: number;
  filter?: number;
  detune?: number;
  slide?: number;
  pan?: number;
  delay?: number;
};

const FORM_ROOT: Readonly<Record<PlayerForm, number>> = {
  nightbound: 176,
  wraith: 392,
  dreadwolf: 112,
  stonewrought: 64,
};

const PRIMARY_ROOT: Readonly<Record<PlayerForm, number>> = {
  nightbound: 235,
  wraith: 540,
  dreadwolf: 164,
  stonewrought: 82,
};

const ELITE_TARGET_ID = 'enemy-11';

/**
 * Purpose-built Web Audio mix for the vertical slice. Every gameplay family
 * owns a different low/mid/high profile, while a conservative master limiter
 * protects headroom when an area attack lands on several targets at once.
 */
export class ProceduralAudio {
  private context?: AudioContext;
  private ambience?: GainNode;
  private lowBus?: GainNode;
  private midBus?: GainNode;
  private highBus?: GainNode;
  private noiseBuffer?: AudioBuffer;
  private enabled = false;
  private resumeOnFocus = false;
  private ambienceTimer = 0;
  private eliteRevealPlayed = false;
  private pendingTargetId = '';
  private pendingHitAmount = 0;
  private pendingHitKind: DamageKind = 'physical';
  private readonly cueGate = new Map<string, number>();

  constructor(element: HTMLElement) {
    document.documentElement.dataset.audio = 'locked';
    element.addEventListener('pointerdown', this.unlock, { passive: true });
    window.addEventListener('keydown', this.unlock);
    window.addEventListener('focus', this.onFocus);
    window.addEventListener('pageshow', this.onFocus);
    window.addEventListener('pagehide', this.onPageHide);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  async start() {
    if (this.context) {
      if (this.context.state === 'suspended') await this.context.resume();
      this.syncState();
      return;
    }

    try {
      const context = new AudioContext({ latencyHint: 'interactive' });
      this.context = context;

      // Peak layers are deliberately quiet before the limiter. The compressor
      // is used as a safety ceiling, not as the source of perceived loudness.
      const master = context.createGain();
      const limiter = context.createDynamicsCompressor();
      master.gain.value = 0.34;
      limiter.threshold.value = -7;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.09;
      master.connect(limiter).connect(context.destination);
      const effectsSum = context.createGain();
      effectsSum.gain.value = 0.68;
      effectsSum.connect(master);
      this.lowBus = this.createBandBus(context, effectsSum, 'low', 0.72);
      this.midBus = this.createBandBus(context, effectsSum, 'mid', 0.7);
      this.highBus = this.createBandBus(context, effectsSum, 'high', 0.54);

      this.ambience = context.createGain();
      this.ambience.gain.value = 0.12;
      this.ambience.connect(master);

      // One shared five-second noise bed serves ambience and every transient.
      // No hit path creates AudioBuffers or typed arrays.
      this.noiseBuffer = this.createNoiseBuffer(context, 5);
      this.createAmbience();
      this.enabled = true;
      context.onstatechange = () => this.syncState();
      if (context.state === 'suspended') await context.resume();
      this.syncState();
      this.playUnlockSigil();
    } catch {
      void this.context?.close();
      this.context = undefined;
      this.enabled = false;
      document.documentElement.dataset.audio = 'unavailable';
      this.dispatchState('unavailable');
    }
  }

  onGameplayEvent = (event: GameplayEvent) => {
    if (event.type === 'hit') {
      // The named hit cue follows synchronously. Keep its target metadata in
      // scalar fields so the hot hit path does not allocate a companion object.
      this.pendingTargetId = event.targetId;
      this.pendingHitAmount = event.hit.amount;
      this.pendingHitKind = event.hit.kind;
      if (event.targetId === ELITE_TARGET_ID && !this.eliteRevealPlayed && this.canPlay()) {
        this.eliteRevealPlayed = true;
        this.playEliteReveal();
      }
      return;
    }
    // PlayerController emits one named audio event beside each attack/hit/form
    // event. Consuming that channel prevents duplicate base impacts.
    if (event.type === 'audio') this.playCue(event.cue, event.intensity ?? 1);
  };

  /** Boss phase transition, called by the boss state owner. */
  bell(phase = 1) {
    if (!this.canPlay()) return;
    this.duckAmbience(phase === 3 ? 0.28 : 0.4, 2.6);

    if (phase === 1) {
      // Bronze awakening: a grounded fundamental and recognizable bell partials.
      this.playNoise(0.12, 0.075, 1180, -0.08, 'bandpass', 'high');
      this.playTone({ frequency: 48, duration: 1.45, gain: 0.13, band: 'low', type: 'sine', slide: 0.91, filter: 190 });
      this.playBellPartials(96, [1, 2.01, 2.73, 4.16], 0.13, 2.35, 0);
      return;
    }

    if (phase === 2) {
      // The choir rises above phase one with glassy, beating upper partials.
      this.playNoise(0.42, 0.07, 2850, 0.08, 'highpass', 'high');
      this.playTone({ frequency: 61, duration: 1.3, gain: 0.09, band: 'low', type: 'sine', slide: 1.03, filter: 230 });
      this.playBellPartials(121, [1, 1.498, 2.07, 3.12, 4.42], 0.11, 2.55, 7);
      this.playTone({ frequency: 716, duration: 1.75, gain: 0.055, band: 'high', type: 'sine', detune: -9, slide: 1.08, filter: 3900, pan: 0.28, delay: 0.08 });
      return;
    }

    // Last resonance: the high choir falls away and a dissonant sub toll owns
    // the mix, making escalation legible even without looking at the HUD.
    this.playNoise(0.5, 0.085, 340, 0, 'lowpass', 'low');
    this.playTone({ frequency: 35, duration: 2.15, gain: 0.16, band: 'low', type: 'sine', slide: 0.72, filter: 145 });
    this.playTone({ frequency: 70, duration: 2.05, gain: 0.11, band: 'low', type: 'triangle', slide: 0.87, filter: 320, detune: -5 });
    this.playBellPartials(70, [1.414, 2.71, 3.92], 0.1, 2.7, -11);
    this.playTone({ frequency: 208, duration: 2.35, gain: 0.075, band: 'mid', type: 'sawtooth', slide: 0.79, filter: 960, pan: -0.22, delay: 0.05 });
  }

  private unlock = () => {
    void this.start();
  };

  private canPlay() {
    return this.enabled && this.context?.state === 'running' && !!this.midBus;
  }

  private playCue(cue: string, intensity: number) {
    if (!this.canPlay() || !this.context) return;
    const family = cue.replace(/-(nightbound|wraith|dreadwolf|stonewrought)$/, '');
    const now = this.context.currentTime;
    const last = this.cueGate.get(family) ?? -10;
    const gate = family.startsWith('hit') ? 0.032 : family.includes('primary') ? 0.055 : 0.09;
    if (now - last < gate) return;
    this.cueGate.set(family, now);

    const form = this.formFromCue(cue);
    if (cue.startsWith('hit-')) {
      this.playImpact(this.pendingHitKind, intensity, this.pendingTargetId, this.pendingHitAmount);
      this.pendingTargetId = '';
      return;
    }
    if (cue.startsWith('player-hurt')) {
      this.playPlayerHurt();
      return;
    }
    if (cue.startsWith('transform-')) {
      this.playTransform(form ?? 'nightbound');
      return;
    }
    if (cue.startsWith('dash-')) {
      this.playDash(form ?? 'nightbound');
      return;
    }

    const slot: AbilitySlot = cue.endsWith('-ultimate')
      ? 'ultimate'
      : cue.endsWith('-secondary')
        ? 'secondary'
        : 'primary';
    this.playAttack(form ?? 'nightbound', slot, intensity);
  }

  private playAttack(form: PlayerForm, slot: AbilitySlot, intensity: number) {
    const variation = this.pitchVariation();
    const pan = this.panVariation(0.18);
    const root = PRIMARY_ROOT[form] * variation;

    if (slot === 'primary') {
      // Fast high transient + form-colored mid body. Stone alone earns sub weight.
      this.playNoise(form === 'stonewrought' ? 0.09 : 0.055, 0.045 * intensity, form === 'wraith' ? 3200 : 1950, pan, 'highpass', 'high');
      this.playTone({
        frequency: root,
        duration: form === 'stonewrought' ? 0.19 : 0.105,
        gain: 0.08 * intensity,
        band: form === 'stonewrought' ? 'low' : form === 'wraith' ? 'high' : 'mid',
        type: form === 'wraith' ? 'sine' : 'triangle',
        slide: form === 'wraith' ? 1.22 : form === 'dreadwolf' ? 0.6 : 0.74,
        filter: form === 'wraith' ? 3900 : form === 'stonewrought' ? 430 : 1300,
        pan,
      });
      if (form === 'dreadwolf') this.playTone({ frequency: 83 * variation, duration: 0.12, gain: 0.055, band: 'low', type: 'sawtooth', slide: 0.7, filter: 360, pan: -pan });
      return;
    }

    if (slot === 'secondary') {
      // Arts have a short anticipation/body/transient sequence rather than a
      // louder copy of the primary attack.
      this.playTone({ frequency: Math.max(42, root * 0.47), duration: form === 'stonewrought' ? 0.48 : 0.29, gain: 0.1, band: 'low', type: 'triangle', slide: form === 'wraith' ? 1.7 : 0.67, filter: 430, pan: -pan });
      this.playTone({ frequency: root * 0.82, duration: 0.32, gain: 0.105, band: 'mid', type: form === 'wraith' ? 'sine' : 'sawtooth', slide: form === 'wraith' ? 1.72 : 0.76, filter: form === 'wraith' ? 2800 : 1250, pan, delay: 0.025 });
      this.playNoise(form === 'stonewrought' ? 0.3 : 0.14, 0.065, form === 'wraith' ? 3200 : 1450, pan, form === 'wraith' ? 'highpass' : 'bandpass', 'high', 0.04);
      if (form === 'dreadwolf') this.playTone({ frequency: 236, duration: 0.18, gain: 0.055, band: 'mid', type: 'square', slide: 0.5, filter: 1100, pan: -0.25, delay: 0.06 });
      return;
    }

    this.duckAmbience(0.44, 1.25);
    const ultimateRoot = FORM_ROOT[form] * 0.52;
    this.playTone({ frequency: Math.max(31, ultimateRoot * 0.5), duration: 1.0, gain: 0.13, band: 'low', type: 'sine', slide: form === 'wraith' ? 1.44 : 0.79, filter: 260 });
    this.playTone({ frequency: ultimateRoot, duration: 0.82, gain: 0.115, band: 'mid', type: form === 'wraith' ? 'sine' : 'sawtooth', slide: 2.08, filter: 1800, pan: -0.12, delay: 0.035 });
    this.playTone({ frequency: ultimateRoot * 2.4, duration: 1.1, gain: 0.065, band: 'high', type: 'sine', slide: form === 'stonewrought' ? 0.64 : 1.38, filter: 4200, pan: 0.2, delay: 0.065 });
    this.playNoise(0.62, 0.08, form === 'wraith' ? 2600 : 780, 0, 'bandpass', form === 'wraith' ? 'high' : 'mid', 0.045);
  }

  private playImpact(kind: DamageKind, intensity: number, targetId: string, amount: number) {
    const strength = Math.max(0.55, Math.min(1.25, intensity || amount / 50));
    const variation = this.pitchVariation();
    const pan = this.panVariation(0.28);

    if (kind === 'crush') {
      this.playTone({ frequency: 57 * variation, duration: 0.22, gain: 0.105 * strength, band: 'low', type: 'sine', slide: 0.48, filter: 250, pan });
      this.playTone({ frequency: 172 * variation, duration: 0.11, gain: 0.065 * strength, band: 'mid', type: 'square', slide: 0.64, filter: 930, pan: -pan, delay: 0.008 });
      this.playNoise(0.13, 0.06 * strength, 1550, pan, 'highpass', 'high');
    } else if (kind === 'spectral') {
      this.playTone({ frequency: 486 * variation, duration: 0.17, gain: 0.07 * strength, band: 'high', type: 'sine', slide: 1.31, filter: 4100, pan });
      this.playTone({ frequency: 243 * variation, duration: 0.21, gain: 0.06 * strength, band: 'mid', type: 'triangle', slide: 0.86, filter: 1850, pan: -pan, delay: 0.012 });
      this.playNoise(0.08, 0.036 * strength, 3400, pan, 'highpass', 'high');
    } else if (kind === 'rend') {
      this.playNoise(0.105, 0.072 * strength, 2100, pan, 'highpass', 'high');
      this.playTone({ frequency: 184 * variation, duration: 0.13, gain: 0.075 * strength, band: 'mid', type: 'sawtooth', slide: 0.48, filter: 1250, pan: -pan });
      this.playTone({ frequency: 78 * variation, duration: 0.11, gain: 0.045 * strength, band: 'low', type: 'triangle', slide: 0.73, filter: 320, pan, delay: 0.01 });
    } else {
      this.playNoise(0.07, 0.052 * strength, 1800, pan, 'bandpass', 'high');
      this.playTone({ frequency: 216 * variation, duration: 0.105, gain: 0.072 * strength, band: 'mid', type: 'triangle', slide: 0.69, filter: 1250, pan });
      if (strength > 1) this.playTone({ frequency: 72, duration: 0.12, gain: 0.04, band: 'low', type: 'sine', slide: 0.62, filter: 290, pan: -pan });
    }

    if (targetId === 'boss-ossivar') this.playBossArmorImpact(kind, strength);
    else if (targetId === ELITE_TARGET_ID) this.playEliteArmorImpact(strength);
  }

  private playBossArmorImpact(kind: DamageKind, strength: number) {
    const affinity = kind === 'spectral' ? 1.5 : kind === 'crush' ? 1.24 : kind === 'rend' ? 1.12 : 1;
    this.playTone({ frequency: 92 * affinity, duration: 0.28, gain: 0.06 * strength, band: 'low', type: 'sine', slide: 0.83, filter: 420, pan: -0.1, delay: 0.018 });
    this.playTone({ frequency: 610 * affinity, duration: 0.32, gain: 0.042 * strength, band: 'high', type: 'sine', slide: 0.94, filter: 3900, pan: 0.14, delay: 0.024 });
  }

  private playEliteReveal() {
    this.duckAmbience(0.62, 0.75);
    this.playTone({ frequency: 51, duration: 0.65, gain: 0.1, band: 'low', type: 'sine', slide: 0.76, filter: 230 });
    this.playTone({ frequency: 153, duration: 0.52, gain: 0.075, band: 'mid', type: 'sawtooth', slide: 1.08, filter: 980, pan: -0.16, delay: 0.035 });
    this.playTone({ frequency: 472, duration: 0.7, gain: 0.045, band: 'high', type: 'sine', slide: 0.89, filter: 3400, pan: 0.2, delay: 0.08 });
  }

  private playEliteArmorImpact(strength: number) {
    this.playTone({ frequency: 118, duration: 0.19, gain: 0.055 * strength, band: 'low', type: 'triangle', slide: 0.71, filter: 480, pan: -0.12, delay: 0.012 });
    this.playTone({ frequency: 720, duration: 0.17, gain: 0.034 * strength, band: 'high', type: 'sine', slide: 0.91, filter: 4100, pan: 0.18, delay: 0.018 });
  }

  private playPlayerHurt() {
    const variation = this.pitchVariation();
    this.duckAmbience(0.72, 0.28);
    this.playNoise(0.19, 0.07, 460, -0.1, 'lowpass', 'low');
    this.playTone({ frequency: 88 * variation, duration: 0.29, gain: 0.105, band: 'low', type: 'sawtooth', slide: 0.52, filter: 390, pan: -0.12 });
    this.playTone({ frequency: 164, duration: 0.14, gain: 0.045, band: 'mid', type: 'square', slide: 0.74, filter: 690, pan: 0.14, delay: 0.012 });
  }

  private playDash(form: PlayerForm) {
    const variation = this.pitchVariation();
    const pan = this.panVariation(0.18);
    const spectral = form === 'wraith';
    const heavy = form === 'stonewrought';
    this.playNoise(heavy ? 0.25 : 0.14, spectral ? 0.045 : 0.06, spectral ? 3100 : heavy ? 520 : 1450, pan, spectral ? 'highpass' : 'bandpass', spectral ? 'high' : heavy ? 'low' : 'mid');
    this.playTone({
      frequency: FORM_ROOT[form] * variation,
      duration: heavy ? 0.31 : 0.18,
      gain: 0.08,
      band: spectral ? 'high' : heavy ? 'low' : 'mid',
      type: spectral ? 'sine' : 'triangle',
      slide: spectral ? 2.16 : heavy ? 0.49 : 0.62,
      filter: spectral ? 3900 : heavy ? 390 : 1150,
      pan,
    });
    if (form === 'dreadwolf') this.playTone({ frequency: 58, duration: 0.16, gain: 0.05, band: 'low', type: 'sawtooth', slide: 1.15, filter: 310, pan: -pan });
  }

  private playTransform(form: PlayerForm) {
    const root = FORM_ROOT[form];
    this.duckAmbience(0.55, 0.72);

    if (form === 'wraith') {
      this.playNoise(0.46, 0.052, 2900, 0, 'highpass', 'high');
      this.playTone({ frequency: root, duration: 0.58, gain: 0.072, band: 'high', type: 'sine', slide: 2.66, filter: 4400, pan: -0.22 });
      this.playTone({ frequency: root * 1.51, duration: 0.74, gain: 0.045, band: 'high', type: 'sine', slide: 1.72, filter: 5100, pan: 0.24, attack: 0.045, delay: 0.035 });
      return;
    }
    if (form === 'dreadwolf') {
      this.playNoise(0.34, 0.07, 880, -0.08, 'bandpass', 'mid');
      this.playTone({ frequency: 49, duration: 0.52, gain: 0.105, band: 'low', type: 'sawtooth', slide: 1.62, filter: 310, pan: -0.2 });
      this.playTone({ frequency: root * 1.8, duration: 0.27, gain: 0.065, band: 'mid', type: 'square', slide: 0.52, filter: 1300, pan: 0.2, delay: 0.09 });
      return;
    }
    if (form === 'stonewrought') {
      this.playNoise(0.52, 0.085, 470, 0, 'lowpass', 'low');
      this.playTone({ frequency: 33, duration: 0.78, gain: 0.13, band: 'low', type: 'sine', slide: 0.68, filter: 170 });
      this.playTone({ frequency: root * 2.1, duration: 0.34, gain: 0.07, band: 'mid', type: 'square', slide: 0.55, filter: 880, pan: 0.18, delay: 0.08 });
      this.playNoise(0.18, 0.05, 2300, -0.16, 'highpass', 'high', 0.11);
      return;
    }

    this.playNoise(0.38, 0.058, 1700, 0, 'bandpass', 'mid');
    this.playTone({ frequency: root, duration: 0.54, gain: 0.085, band: 'mid', type: 'triangle', slide: 2.08, filter: 1900, pan: -0.18 });
    this.playTone({ frequency: root * 1.5, duration: 0.66, gain: 0.052, band: 'high', type: 'sine', slide: 1.38, filter: 3600, pan: 0.2, attack: 0.035, delay: 0.04 });
  }

  private playBellPartials(root: number, partials: readonly number[], gain: number, duration: number, detune: number) {
    for (let index = 0; index < partials.length; index += 1) {
      const partial = partials[index] ?? 1;
      this.playTone({
        frequency: root * partial,
        duration: duration - index * 0.16,
        gain: gain / (1 + index * 0.7),
        band: index === 0 ? 'mid' : 'high',
        type: 'sine',
        attack: 0.004 + index * 0.007,
        filter: 2200 + index * 620,
        detune: index % 2 ? detune : -detune * 0.45,
        pan: (index - (partials.length - 1) / 2) * 0.12,
        delay: index * 0.012,
      });
    }
  }

  private playTone(options: ToneOptions) {
    if (!this.context) return;
    const output = this.busFor(options.band);
    if (!output) return;
    const now = this.context.currentTime + (options.delay ?? 0);
    const duration = Math.max(0.035, options.duration);
    const osc = this.context.createOscillator();
    const amp = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const panner = this.context.createStereoPanner();
    osc.type = options.type ?? 'sine';
    osc.frequency.setValueAtTime(Math.max(20, options.frequency), now);
    if (options.slide && options.slide > 0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, options.frequency * options.slide), now + duration);
    osc.detune.value = options.detune ?? 0;
    filter.type = 'lowpass';
    filter.frequency.value = options.filter ?? Math.max(240, options.frequency * 4);
    filter.Q.value = 0.62;
    panner.pan.value = Math.max(-1, Math.min(1, options.pan ?? 0));
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.001, options.gain), now + Math.min(options.attack ?? 0.008, duration * 0.35));
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(filter).connect(amp).connect(panner).connect(output);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  private playNoise(
    duration: number,
    gain: number,
    frequency: number,
    pan: number,
    type: BiquadFilterType,
    band: FrequencyBand,
    delay = 0,
  ) {
    if (!this.context || !this.noiseBuffer) return;
    const output = this.busFor(band);
    if (!output) return;
    const now = this.context.currentTime + delay;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const amp = this.context.createGain();
    const panner = this.context.createStereoPanner();
    source.buffer = this.noiseBuffer;
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = type === 'bandpass' ? 0.85 : 0.28;
    panner.pan.value = pan;
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), now + Math.min(0.012, duration * 0.25));
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(amp).connect(panner).connect(output);
    const maxOffset = Math.max(0, this.noiseBuffer.duration - duration - 0.02);
    source.start(now, Math.random() * maxOffset, duration);
  }

  private createBandBus(context: AudioContext, destination: AudioNode, band: FrequencyBand, level: number) {
    const input = context.createGain();
    const eq = context.createBiquadFilter();
    const output = context.createGain();
    output.gain.value = level;
    if (band === 'low') {
      eq.type = 'lowpass';
      eq.frequency.value = 420;
      eq.Q.value = 0.32;
    } else if (band === 'mid') {
      eq.type = 'bandpass';
      eq.frequency.value = 1040;
      eq.Q.value = 0.34;
    } else {
      eq.type = 'highpass';
      eq.frequency.value = 1850;
      eq.Q.value = 0.28;
    }
    input.connect(eq).connect(output).connect(destination);
    return input;
  }

  private busFor(band: FrequencyBand) {
    return band === 'low' ? this.lowBus : band === 'mid' ? this.midBus : this.highBus;
  }

  private createNoiseBuffer(context: AudioContext, duration: number) {
    const sampleCount = Math.ceil(context.sampleRate * duration);
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < sampleCount; index += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.72 + white * 0.28;
      data[index] = last;
    }
    return buffer;
  }

  private createAmbience() {
    if (!this.context || !this.ambience) return;
    const lowpass = this.context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 175;
    lowpass.Q.value = 0.7;
    lowpass.connect(this.ambience);

    for (const [index, frequency] of [43, 64.5].entries()) {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = index ? 'triangle' : 'sawtooth';
      osc.frequency.value = frequency;
      osc.detune.value = index ? -7 : 4;
      gain.gain.value = index ? 0.15 : 0.1;
      osc.connect(gain).connect(lowpass);
      osc.start();
    }

    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    lfo.frequency.value = 0.075;
    lfoGain.gain.value = 45;
    lfo.connect(lfoGain).connect(lowpass.frequency);
    lfo.start();
    this.scheduleGust();
  }

  private scheduleGust() {
    window.clearTimeout(this.ambienceTimer);
    this.ambienceTimer = window.setTimeout(() => {
      if (this.context?.state === 'running' && this.ambience && this.noiseBuffer) {
        const context = this.context;
        const duration = 2.6 + Math.random() * 2.2;
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        const panner = context.createStereoPanner();
        const now = context.currentTime;
        source.buffer = this.noiseBuffer;
        filter.type = 'bandpass';
        filter.frequency.value = 420 + Math.random() * 420;
        filter.Q.value = 0.75;
        panner.pan.value = this.panVariation(0.62);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.018, now + 0.7);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        source.connect(filter).connect(gain).connect(panner).connect(this.ambience);
        source.start(now, Math.random() * Math.max(0, this.noiseBuffer.duration - duration - 0.02), duration);
      }
      this.scheduleGust();
    }, 6500 + Math.random() * 8500);
  }

  private duckAmbience(depth: number, duration: number) {
    if (!this.context || !this.ambience) return;
    const now = this.context.currentTime;
    const gain = this.ambience.gain;
    const floor = Math.max(0.025, 0.12 * depth);
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(Math.max(0.001, gain.value), now);
    gain.exponentialRampToValueAtTime(floor, now + 0.025);
    gain.exponentialRampToValueAtTime(0.12, now + duration);
  }

  private playUnlockSigil() {
    this.playTone({ frequency: 146, duration: 0.3, gain: 0.045, band: 'mid', type: 'sine', slide: 1.5, pan: -0.18 });
    this.playTone({ frequency: 219, duration: 0.42, gain: 0.034, band: 'high', type: 'sine', slide: 1.34, pan: 0.18, attack: 0.035, delay: 0.03 });
  }

  private pitchVariation() {
    return 0.95 + Math.random() * 0.1;
  }

  private panVariation(width: number) {
    return (Math.random() - 0.5) * width * 2;
  }

  private formFromCue(cue: string): PlayerForm | undefined {
    if (cue.includes('wraith')) return 'wraith';
    if (cue.includes('dreadwolf')) return 'dreadwolf';
    if (cue.includes('stonewrought')) return 'stonewrought';
    if (cue.includes('nightbound')) return 'nightbound';
    return undefined;
  }

  private onVisibilityChange = () => {
    if (!this.context || !this.enabled) return;
    if (document.hidden && this.context.state === 'running') {
      this.resumeOnFocus = true;
      void this.context.suspend();
    } else if (!document.hidden && this.resumeOnFocus) {
      this.resumeOnFocus = false;
      void this.context.resume();
    }
  };

  private onPageHide = () => {
    if (this.context?.state === 'running') {
      this.resumeOnFocus = true;
      void this.context.suspend();
    }
  };

  private onFocus = () => {
    if (!this.context || !this.enabled || !this.resumeOnFocus || document.hidden) return;
    this.resumeOnFocus = false;
    void this.context.resume();
  };

  private syncState() {
    const state = this.context?.state ?? 'locked';
    document.documentElement.dataset.audio = state;
    this.dispatchState(state);
  }

  private dispatchState(state: string) {
    window.dispatchEvent(new CustomEvent('veilfall:audio-state', { detail: state }));
  }
}
