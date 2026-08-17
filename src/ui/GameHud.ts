import type { BossPhase } from '../boss/BellSaintBoss';
import { FORM_DEFINITIONS } from '../gameplay/formData';
import type { AbilitySlot, PlayerForm, PlayerSnapshot } from '../gameplay';

type BossSnapshot = {
  active: boolean;
  health: number;
  maxHealth: number;
  phase: BossPhase;
  defeated: boolean;
};

const FORM_PRESENTATION: Record<PlayerForm, {
  crest: string;
  role: string;
  primary: string;
  secondary: string;
  dash: string;
  ultimate: string;
}> = {
  nightbound: { crest: 'NB', role: 'BALANCED · BLOOD CRESCENT RESTORES VITALITY', primary: 'Dusk Blades', secondary: 'Blood Crescent', dash: 'Shade Step', ultimate: 'Eclipse' },
  wraith: { crest: 'WR', role: 'RANGED · PHASE SLIP IGNORES HARM', primary: 'Soul Lance', secondary: 'Veil Burst', dash: 'Phase Slip', ultimate: 'Soulstorm' },
  dreadwolf: { crest: 'DW', role: 'PREDATOR · POUNCE AND RUSH BOTH REND', primary: 'Raking Claws', secondary: 'Ruinous Pounce', dash: 'Hunt Rush', ultimate: 'Blood Moon' },
  stonewrought: { crest: 'SW', role: 'JUGGERNAUT · HALF DAMAGE, CRUSHING IMPACTS', primary: 'Hammerfist', secondary: 'Seismic Slam', dash: 'Bulwark Charge', ultimate: 'Worldbreak' },
};

const PHASES: Partial<Record<BossPhase, { label: string; weakness: string }>> = {
  1: { label: 'PHASE I · THE TOLL', weakness: 'FRACTURE · REND' },
  2: { label: 'PHASE II · THE CHOIR BELOW', weakness: 'FRACTURE · SPECTRAL' },
  3: { label: 'PHASE III · LAST RESONANCE', weakness: 'FRACTURE · CRUSH' },
};

const COOLDOWN_MAX: Record<PlayerForm, Record<AbilitySlot, number>> = {
  nightbound: { primary: 0.24, secondary: FORM_DEFINITIONS.nightbound.secondaryCooldown, dash: FORM_DEFINITIONS.nightbound.dashCooldown, ultimate: 14 },
  wraith: { primary: 0.16, secondary: FORM_DEFINITIONS.wraith.secondaryCooldown, dash: FORM_DEFINITIONS.wraith.dashCooldown, ultimate: 14 },
  dreadwolf: { primary: 0.18, secondary: FORM_DEFINITIONS.dreadwolf.secondaryCooldown, dash: FORM_DEFINITIONS.dreadwolf.dashCooldown, ultimate: 14 },
  stonewrought: { primary: 0.38, secondary: FORM_DEFINITIONS.stonewrought.secondaryCooldown, dash: FORM_DEFINITIONS.stonewrought.dashCooldown, ultimate: 14 },
};

export class GameHud {
  private readonly root: HTMLElement;
  private readonly location: HTMLElement;
  private readonly healthFill: HTMLElement;
  private readonly resourceFill: HTMLElement;
  private readonly formName: HTMLElement;
  private readonly formRole: HTMLElement;
  private readonly crest: HTMLElement;
  private readonly bossBar: HTMLElement;
  private readonly bossFill: HTMLElement;
  private readonly bossPhase: HTMLElement;
  private readonly bossWeakness: HTMLElement;
  private readonly objective: HTMLElement;
  private readonly deathCard: HTMLElement;
  private readonly victoryCard: HTMLElement;
  private readonly statusLine: HTMLElement;
  private readonly helpPanel: HTMLElement;
  private readonly audioState: HTMLElement;
  private readonly abilityElements: Record<AbilitySlot, HTMLElement>;
  private titleTimer = 5;
  private status = '';
  private statusTimer = 0;
  private bossActive = false;
  private previousBossPhase: BossPhase = 0;
  private previousHealth = 1;
  private damageFlash = 0;
  private helpOpen = false;
  private victoryRevealDelay = 0;
  private bossWasDefeated = false;

  constructor(root: HTMLElement) {
    this.root = root;
    root.setAttribute('aria-live', 'off');
    root.innerHTML = `
      <div class="veil-vignette" aria-hidden="true"></div>
      <div class="veil-grain" aria-hidden="true"></div>
      <div class="low-health-veil" aria-hidden="true"></div>

      <section class="location-card" aria-label="Location discovered">
        <small>THE HOLLOW MARCH</small><strong>Where every bell tolls twice</strong>
      </section>

      <section class="objective" aria-label="Current objective">
        <span aria-hidden="true">✦</span><div><small>PILGRIM'S END</small><strong>Cross the drowned graveway</strong></div>
      </section>

      <section class="bossbar" aria-label="Boss: Ossivar, Last Voice of the March" aria-hidden="true">
        <div class="boss-heading"><small>THE BELL-SAINT</small><strong>OSSIVAR, LAST VOICE OF THE MARCH</strong></div>
        <div class="boss-track" role="progressbar" aria-label="Boss vitality" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i></i></div>
        <div class="boss-state"><em>AWAITING THE FIRST TOLL</em><span></span></div>
      </section>

      <section class="player-hud" aria-label="Player status">
        <div class="form-crest" aria-hidden="true"><b>NB</b><i></i></div>
        <div class="bars">
          <div class="bar-label"><span>VITALITY</span><output class="health-value">100%</output></div>
          <div class="health" role="progressbar" aria-label="Vitality" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i></i></div>
          <div class="resource" role="progressbar" aria-label="Veil energy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i></i></div>
          <div class="form-copy"><small class="form-name">NIGHTBOUND</small><span class="form-role">BALANCED · BLOOD CRESCENT RESTORES VITALITY</span></div>
        </div>
      </section>

      <section class="ability-bar" aria-label="Combat abilities">
        ${this.abilityMarkup('primary', 'LMB', 'Dusk Blades')}
        ${this.abilityMarkup('secondary', 'Q', 'Blood Crescent')}
        ${this.abilityMarkup('dash', 'SPACE', 'Shade Step')}
        ${this.abilityMarkup('ultimate', 'R', 'Eclipse')}
      </section>

      <section class="forms" aria-label="Transformations">
        <div data-form="nightbound"><kbd>1</kbd><span><b>NIGHTBOUND</b><small>BALANCED</small></span></div>
        <div data-form="wraith"><kbd>2</kbd><span><b>WRAITH</b><small>PHASE / RANGE</small></span></div>
        <div data-form="dreadwolf"><kbd>3</kbd><span><b>DREADWOLF</b><small>SPEED / REND</small></span></div>
        <div data-form="stonewrought"><kbd>4</kbd><span><b>STONEWROUGHT</b><small>ARMOR / CRUSH</small></span></div>
      </section>

      <section class="controls" aria-label="Quick controls">
        <span><kbd>WASD</kbd> MOVE</span><span><kbd>MOUSE</kbd> AIM</span><span><kbd>LMB</kbd> STRIKE</span><span><kbd>Q</kbd> FORM ART</span><span><kbd>H</kbd> GUIDE</span>
      </section>
      <div class="audio-state" aria-live="polite"><i></i><span>CLICK OR PRESS A KEY TO AWAKEN SOUND</span></div>

      <section class="status-line" role="status" aria-live="assertive" aria-atomic="true"></section>

      <section class="help-panel" aria-hidden="true" aria-label="Field guide">
        <div class="help-frame">
          <small>FIELD GUIDE · <kbd>H</kbd> TO CLOSE</small>
          <strong>MASTER THE VEIL</strong>
          <p>Move with <kbd>WASD</kbd>, aim with the mouse, and strike with <kbd>LMB</kbd>. Every form changes your pace, defense, Form Art, and traverse attack.</p>
          <div class="help-grid">
            <article><b>WRAITH</b><span>Fight at range. Phase Slip is invulnerable; Veil Burst blinks through danger.</span></article>
            <article><b>DREADWOLF</b><span>Fast pursuit. Hunt Rush and Ruinous Pounce damage everything in their path.</span></article>
            <article><b>STONEWROUGHT</b><span>Take half damage. Bulwark Charge and Seismic Slam break packed enemies.</span></article>
            <article><b>BOSS FRACTURES</b><span>Match the halo: rend the crimson toll, haunt the cyan choir, crush the amber resonance.</span></article>
          </div>
          <p class="help-note">There is no inventory or crafting. Roam, transform, hunt, and reach the drowned cathedral.</p>
        </div>
      </section>

      <section class="death-card" aria-hidden="true">
        <small>THE MARCH REMEMBERS</small><strong>YOU HAVE FALLEN</strong><span><kbd>ENTER</kbd> RISE AT THE GRAVEWAY</span>
      </section>
      <section class="victory-card" aria-hidden="true">
        <small>THE SILENCE AFTER</small><strong>THE BELL-SAINT IS STILL</strong><span>Victory · the Hollow March is yours to roam</span>
      </section>
    `;

    this.location = this.required('.location-card');
    this.healthFill = this.required('.health i');
    this.resourceFill = this.required('.resource i');
    this.formName = this.required('.form-name');
    this.formRole = this.required('.form-role');
    this.crest = this.required('.form-crest b');
    this.bossBar = this.required('.bossbar');
    this.bossFill = this.required('.boss-track i');
    this.bossPhase = this.required('.bossbar em');
    this.bossWeakness = this.required('.boss-state span');
    this.objective = this.required('.objective strong');
    this.deathCard = this.required('.death-card');
    this.victoryCard = this.required('.victory-card');
    this.statusLine = this.required('.status-line');
    this.helpPanel = this.required('.help-panel');
    this.audioState = this.required('.audio-state');
    this.abilityElements = {
      primary: this.required('[data-slot="primary"]'),
      secondary: this.required('[data-slot="secondary"]'),
      dash: this.required('[data-slot="dash"]'),
      ultimate: this.required('[data-slot="ultimate"]'),
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('veilfall:audio-state', this.onAudioState as EventListener);
    this.syncAudioState(document.documentElement.dataset.audio ?? 'locked');
  }

  update(dt: number, player: PlayerSnapshot, boss: BossSnapshot) {
    this.titleTimer -= dt;
    this.location.classList.toggle('hidden', this.titleTimer <= 0 || boss.active);

    const healthRatio = Math.max(0, player.health / player.maxHealth);
    const resourceRatio = Math.max(0, player.resource / player.maxResource);
    if (player.health < this.previousHealth - 0.1) this.damageFlash = 0.26;
    this.previousHealth = player.health;
    this.damageFlash = Math.max(0, this.damageFlash - dt);
    this.root.classList.toggle('damage-flash', this.damageFlash > 0);
    this.root.classList.toggle('low-health', healthRatio > 0 && healthRatio <= 0.3);
    this.root.classList.toggle('resource-ready', resourceRatio >= 0.99);

    this.healthFill.style.width = `${healthRatio * 100}%`;
    this.resourceFill.style.width = `${resourceRatio * 100}%`;
    this.setProgress('.health', healthRatio);
    this.setProgress('.resource', resourceRatio);
    this.required('.health-value').textContent = `${Math.ceil(healthRatio * 100)}%`;

    const presentation = FORM_PRESENTATION[player.form];
    this.formName.textContent = player.form.toUpperCase();
    this.formRole.textContent = presentation.role;
    this.crest.textContent = presentation.crest;
    this.root.dataset.form = player.form;
    this.root.querySelectorAll<HTMLElement>('.forms [data-form]').forEach((element) => {
      const active = element.dataset.form === player.form;
      element.classList.toggle('active', active);
      element.setAttribute('aria-current', active ? 'true' : 'false');
    });
    this.updateAbilities(player, presentation);

    const showBoss = boss.active && !boss.defeated;
    this.root.classList.toggle('boss-active', showBoss);
    this.bossBar.classList.toggle('active', showBoss);
    this.bossBar.setAttribute('aria-hidden', String(!showBoss));
    const bossRatio = Math.max(0, boss.health / boss.maxHealth);
    this.bossFill.style.width = `${bossRatio * 100}%`;
    this.setProgress('.boss-track', bossRatio);

    const phase = PHASES[boss.phase];
    this.bossPhase.textContent = phase?.label ?? 'AWAITING THE FIRST TOLL';
    this.bossWeakness.textContent = phase?.weakness ?? '';
    this.bossBar.dataset.phase = String(boss.phase);
    if (showBoss && boss.phase !== this.previousBossPhase) {
      this.bossBar.classList.remove('phase-change');
      void this.bossBar.offsetWidth;
      this.bossBar.classList.add('phase-change');
    }
    this.previousBossPhase = boss.phase;

    const dead = player.health <= 0;
    if (boss.defeated && !this.bossWasDefeated) this.victoryRevealDelay = 1.1;
    this.bossWasDefeated = boss.defeated;
    this.victoryRevealDelay = Math.max(0, this.victoryRevealDelay - dt);
    const showVictory = boss.defeated && this.victoryRevealDelay <= 0;
    this.deathCard.classList.toggle('active', dead);
    this.deathCard.setAttribute('aria-hidden', String(!dead));
    this.victoryCard.classList.toggle('active', showVictory);
    this.victoryCard.setAttribute('aria-hidden', String(!showVictory));
    this.root.classList.toggle('end-state', dead || showVictory);

    if (boss.active !== this.bossActive) {
      this.bossActive = boss.active;
      this.objective.textContent = boss.active ? 'Silence the Bell-Saint' : 'Cross the drowned graveway';
      this.required('.objective').classList.toggle('boss-objective', boss.active);
    }

    this.statusTimer = Math.max(0, this.statusTimer - dt);
    if (this.statusTimer <= 0) this.status = '';
    this.statusLine.textContent = this.status;
    this.statusLine.classList.toggle('active', this.status.length > 0);
  }

  announce(message: string) {
    this.status = message;
    this.statusTimer = 2.3;
  }

  private abilityMarkup(slot: AbilitySlot, key: string, label: string) {
    return `<div class="ability" data-slot="${slot}" style="--cooldown:0">
      <i class="ability-shade" aria-hidden="true"></i><kbd>${key}</kbd><span>${label}</span><output></output>
    </div>`;
  }

  private updateAbilities(player: PlayerSnapshot, presentation: typeof FORM_PRESENTATION[PlayerForm]) {
    const labels: Record<AbilitySlot, string> = {
      primary: presentation.primary,
      secondary: presentation.secondary,
      dash: presentation.dash,
      ultimate: presentation.ultimate,
    };
    (Object.keys(this.abilityElements) as AbilitySlot[]).forEach((slot) => {
      const element = this.abilityElements[slot];
      const remaining = player.cooldowns[slot] ?? 0;
      const ratio = Math.min(1, remaining / COOLDOWN_MAX[player.form][slot]);
      element.style.setProperty('--cooldown', ratio.toFixed(3));
      element.classList.toggle('cooling', remaining > 0.08);
      element.querySelector('span')!.textContent = labels[slot];
      element.querySelector('output')!.textContent = remaining > 0.08 ? (remaining < 1 ? remaining.toFixed(1) : Math.ceil(remaining).toString()) : '';
      element.setAttribute('aria-label', `${labels[slot]}${remaining > 0.08 ? `, ready in ${remaining.toFixed(1)} seconds` : ', ready'}`);
    });
  }

  private setProgress(selector: string, ratio: number) {
    const bar = this.required(selector);
    bar.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  }

  private required(selector: string): HTMLElement {
    const element = this.root.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`HUD element missing: ${selector}`);
    return element;
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.code !== 'KeyH' || event.repeat) return;
    this.helpOpen = !this.helpOpen;
    this.helpPanel.classList.toggle('active', this.helpOpen);
    this.helpPanel.setAttribute('aria-hidden', String(!this.helpOpen));
  };

  private onAudioState = (event: CustomEvent<string>) => this.syncAudioState(event.detail);

  private syncAudioState(state: string) {
    const message = state === 'running' ? 'SOUND AWAKENED' : state === 'suspended' ? 'SOUND PAUSED · RETURN TO RESUME' : 'CLICK OR PRESS A KEY TO AWAKEN SOUND';
    this.audioState.querySelector('span')!.textContent = message;
    this.audioState.dataset.state = state;
    if (state === 'running') window.setTimeout(() => this.audioState.classList.add('settled'), 1800);
    else this.audioState.classList.remove('settled');
  }
}
