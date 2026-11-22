import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';

type RoomStatus = 'disponible' | 'reservado' | 'vendido' | 'comun';

interface RoomItem {
  id: string;
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
}

interface Room {
  id: string;
  name: string;
  short: string;
  type: string;
  area: number;
  beds: number;
  baths: number;
  price: string;
  status: RoomStatus;
  color: string;
  material: string;
  x: number;
  z: number;
  w: number;
  d: number;
  desc: string;
  items: RoomItem[];
}

type FloorKind = 'lobby' | 'residencial' | 'amenidades' | 'atico';

interface Floor {
  id: string;
  label: string;
  name: string;
  kind: FloorKind;
  rooms: Room[];
}

type ViewMode = 'tower' | 'floor' | 'room';
type Vec3 = [number, number, number];
type Point = { x: number; y: number };
type FaceKind = 'slab' | 'patch' | 'wall' | 'core' | 'glass' | 'frame' | 'furniture' | 'roof';

interface Face {
  pts: Vec3[];
  color: string;
  alpha: number;
  stroke?: string;
  roomId?: string;
  itemId?: string;
  itemName?: string;
  floorIndex?: number;
  kind: FaceKind;
  screen: Point[];
  depth: number;
}

type BoxOptions = {
  alpha?: number;
  stroke?: string;
  roomId?: string;
  itemId?: string;
  itemName?: string;
  floorIndex?: number;
  kind?: FaceKind;
  faces?: number;
};

type RoomTemplate = {
  suffix: string;
  name: string;
  short: string;
  type: string;
  area: number;
  beds: number;
  baths: number;
  color: string;
  material: string;
  pos: [number, number, number, number];
  desc: string;
};

const RESIDENTIAL_TEMPLATE: RoomTemplate[] = [
  { suffix: 'A', name: 'Residencia A', short: 'A', type: '2 Dormitorios', area: 92, beds: 2, baths: 2, color: '#8f9f96', material: '#b08d63', pos: [-4.9, -2.75, 5.8, 4.9], desc: 'Salón-comedor amplio, cocina equipada y dos dormitorios con baño propio.' },
  { suffix: 'B', name: 'Residencia B', short: 'B', type: '1 Dormitorio', area: 68, beds: 1, baths: 1, color: '#8fa3ad', material: '#c2a481', pos: [4.9, -2.75, 5.8, 4.9], desc: 'Espacio eficiente y luminoso, ideal para vivir en el corazón de la ciudad.' },
  { suffix: 'C', name: 'Studio C', short: 'C', type: 'Studio', area: 44, beds: 1, baths: 1, color: '#ac9b7b', material: '#c9c6bd', pos: [-4.9, 2.75, 5.8, 4.9], desc: 'Estudio flexible con zona de trabajo integrada y grandes ventanales.' },
  { suffix: 'D', name: 'Residencia D', short: 'D', type: '3 Dormitorios', area: 118, beds: 3, baths: 2, color: '#9a8f9e', material: '#9c7a56', pos: [4.9, 2.75, 5.8, 4.9], desc: 'La unidad más espaciosa, con terraza interior y vistas panorámicas.' },
];

const LOBBY_TEMPLATE: RoomTemplate[] = [
  { suffix: 'L1', name: 'Recepción', short: 'REC', type: 'Atención y conserjería', area: 86, beds: 0, baths: 0, color: '#b09a72', material: '#b9b4aa', pos: [-4.6, -2.6, 6.0, 4.8], desc: 'Acceso principal con conserjería 24 h, control de acceso y buzón inteligente.' },
  { suffix: 'L2', name: 'Lounge', short: 'LG', type: 'Sala de espera', area: 78, beds: 0, baths: 0, color: '#94a8ac', material: '#b08d63', pos: [4.6, -2.6, 6.0, 4.8], desc: 'Sala de estar con mobiliario de diseño y conexión Wi-Fi de alta velocidad.' },
  { suffix: 'L3', name: 'Cafetería', short: 'CAF', type: 'Coworking café', area: 72, beds: 0, baths: 0, color: '#9aab8f', material: '#c2bdb2', pos: [-4.6, 2.6, 6.0, 4.8], desc: 'Espacio de trabajo informal con máquinas de café y puntos de conexión.' },
  { suffix: 'L4', name: 'Sala de juntas', short: 'SJ', type: 'Reuniones privadas', area: 64, beds: 0, baths: 0, color: '#a29aa8', material: '#a9a49a', pos: [4.6, 2.6, 6.0, 4.8], desc: 'Sala privada con pantalla inteligente para reuniones de hasta 8 personas.' },
];

const AMENITIES_TEMPLATE: RoomTemplate[] = [
  { suffix: 'G', name: 'Gimnasio', short: 'GYM', type: 'Fitness', area: 128, beds: 0, baths: 0, color: '#8ca895', material: '#858c88', pos: [-4.9, -2.75, 5.8, 4.9], desc: 'Sala de entrenamiento con equipos de última generación y zona de yoga.' },
  { suffix: 'S', name: 'Spa', short: 'SPA', type: 'Bienestar', area: 96, beds: 0, baths: 0, color: '#b39ba0', material: '#c9c2b6', pos: [4.9, -2.75, 5.8, 4.9], desc: 'Sauna, ducha sensorial y sala de masajes para los residentes.' },
  { suffix: 'P', name: 'Piscina cubierta', short: 'POOL', type: 'Piscina climatizada', area: 112, beds: 0, baths: 0, color: '#8fa9b5', material: '#7fa8b2', pos: [-4.9, 2.75, 5.8, 4.9], desc: 'Piscina climatizada de 18 m con luz natural y zona de descanso.' },
  { suffix: 'C', name: 'Coworking', short: 'CO', type: 'Espacio de trabajo', area: 84, beds: 0, baths: 0, color: '#ad9991', material: '#b08d63', pos: [4.9, 2.75, 5.8, 4.9], desc: 'Puestos de trabajo, cabinas de llamadas y sala de videoconferencias.' },
];

const PENTHOUSE_TEMPLATE: RoomTemplate[] = [
  { suffix: 'PH', name: 'Penthouse', short: 'PH', type: '4 Dormitorios · Dúplex', area: 226, beds: 4, baths: 3, color: '#b8a06b', material: '#a88461', pos: [-4.1, -2.6, 7.2, 5.4], desc: 'La residencia más exclusiva del edificio, con acabados premium y vistas de 270°.' },
  { suffix: 'SL', name: 'Sky Lounge', short: 'SKY', type: 'Salón privado', area: 104, beds: 0, baths: 0, color: '#9d94ad', material: '#bdb8ae', pos: [4.7, -2.6, 5.6, 5.4], desc: 'Salón panoral con barra, chimenea y acceso a la terraza superior.' },
  { suffix: 'TE', name: 'Terraza', short: 'TER', type: 'Terraza ajardinada', area: 154, beds: 0, baths: 0, color: '#8fae95', material: '#b99a72', pos: [0, 2.75, 15.0, 4.9], desc: 'Terraza con jardín, zona de barbacoa, pérgola y paneles fotovoltaicos integrados.' },
];

const STATUSES: RoomStatus[] = ['disponible', 'vendido', 'reservado', 'disponible'];

const STATUS_COLOR: Record<RoomStatus, string> = {
  disponible: '#3b82f6',
  reservado: '#b99550',
  vendido: '#a26963',
  comun: '#38bdf8',
};

function makeItems(t: RoomTemplate, kind: FloorKind, index: number): RoomItem[] {
  const [x, z, w, d] = t.pos;
  const items: RoomItem[] = [];
  const add = (key: string, name: string, ox: number, oz: number, iw: number, idepth: number, h: number, color: string) => {
    items.push({
      id: `f${index}-${t.suffix}-${key}`,
      name,
      x: x + ox * w,
      z: z + oz * d,
      w: iw * w,
      d: idepth * d,
      h,
      color,
    });
  };

  if (kind === 'residencial') {
    if (t.suffix === 'A' || t.suffix === 'D') {
      add('bed1', 'Cama principal queen', -0.24, -0.22, 0.34, 0.3, 0.54, '#eeeae1');
      add('bed2', 'Segunda cama', 0.24, -0.22, 0.28, 0.26, 0.5, '#e4dfd5');
      add('ward', 'Armario empotrado', 0.37, 0.06, 0.12, 0.42, 1.18, '#9d7c5b');
      add('sofa', 'Sofá de salón', -0.08, 0.26, 0.42, 0.16, 0.56, '#909a95');
      add('table', 'Mesa de comedor', 0.2, 0.26, 0.22, 0.18, 0.48, '#ad8a64');
      add('plant', 'Planta decorativa', -0.37, 0.36, 0.1, 0.1, 0.72, '#648b68');
    } else if (t.suffix === 'B') {
      add('bed', 'Cama doble', -0.2, -0.2, 0.36, 0.3, 0.54, '#eeeae1');
      add('desk', 'Escritorio', 0.24, -0.22, 0.3, 0.16, 0.52, '#9d7c5b');
      add('sofa', 'Sofá individual', 0.04, 0.26, 0.34, 0.18, 0.56, '#909a95');
      add('plant', 'Planta decorativa', -0.37, 0.34, 0.1, 0.1, 0.72, '#648b68');
    } else {
      add('bed', 'Cama convertible', -0.2, -0.2, 0.36, 0.28, 0.52, '#eeeae1');
      add('desk', 'Mesa de trabajo', 0.24, -0.2, 0.3, 0.15, 0.5, '#9d7c5b');
      add('sofa', 'Sofá compacto', 0, 0.26, 0.4, 0.18, 0.54, '#909a95');
      add('plant', 'Planta decorativa', -0.37, 0.35, 0.1, 0.1, 0.72, '#648b68');
    }
  } else if (kind === 'lobby') {
    if (t.suffix === 'L1') {
      add('desk', 'Mostrador de recepción', -0.06, -0.08, 0.52, 0.14, 0.95, '#a88765');
      add('sofa', 'Sofá de espera', 0.24, 0.28, 0.38, 0.16, 0.6, '#909a95');
      add('plant', 'Planta de interior', -0.36, 0.3, 0.12, 0.12, 0.86, '#648b68');
    } else if (t.suffix === 'L2') {
      add('sofa1', 'Sofá de tres plazas', -0.18, -0.12, 0.44, 0.17, 0.58, '#8e9893');
      add('sofa2', 'Butaca', 0.26, 0.16, 0.24, 0.2, 0.58, '#a3a9a1');
      add('table', 'Mesa de centro', 0.02, 0.16, 0.2, 0.16, 0.4, '#b08d63');
      add('plant', 'Planta de interior', -0.36, 0.34, 0.12, 0.12, 0.86, '#648b68');
    } else if (t.suffix === 'L3') {
      add('bar', 'Barra de café', -0.1, -0.14, 0.5, 0.16, 0.95, '#a88765');
      add('table1', 'Mesa alta', 0.24, 0.16, 0.22, 0.2, 0.68, '#c2bdb2');
      add('table2', 'Mesa alta', -0.26, 0.3, 0.22, 0.2, 0.68, '#c2bdb2');
      add('plant', 'Planta de interior', 0.36, -0.3, 0.12, 0.12, 0.86, '#648b68');
    } else {
      add('table', 'Mesa de juntas', 0, 0, 0.52, 0.3, 0.55, '#a88765');
      add('screen', 'Pantalla inteligente', 0, -0.42, 0.34, 0.05, 1.1, '#5c6668');
      add('chair1', 'Silla de reunión', -0.3, 0.28, 0.14, 0.14, 0.5, '#7d8781');
      add('chair2', 'Silla de reunión', 0.3, 0.28, 0.14, 0.14, 0.5, '#7d8781');
    }
  } else if (kind === 'amenidades') {
    if (t.suffix === 'G') {
      add('tread1', 'Cinta de correr', -0.24, -0.16, 0.16, 0.38, 0.5, '#666e6b');
      add('tread2', 'Cinta de correr', 0.02, -0.16, 0.16, 0.38, 0.5, '#666e6b');
      add('bench', 'Banco de pesas', 0.28, 0.12, 0.3, 0.16, 0.48, '#7b837f');
      add('mat', 'Zona de yoga', -0.2, 0.3, 0.36, 0.22, 0.08, '#8ba493');
    } else if (t.suffix === 'S') {
      add('sauna', 'Sauna', -0.24, -0.18, 0.34, 0.34, 1.05, '#a88765');
      add('bed1', 'Camilla de masaje', 0.24, -0.14, 0.36, 0.18, 0.48, '#e4dfd5');
      add('bed2', 'Camilla de masaje', 0.24, 0.2, 0.36, 0.18, 0.48, '#e4dfd5');
      add('plant', 'Planta decorativa', -0.36, 0.34, 0.1, 0.1, 0.7, '#648b68');
    } else if (t.suffix === 'P') {
      add('water', 'Lámina de agua', 0, -0.02, 0.72, 0.62, 0.14, '#6fa8b8');
      add('chair1', 'Tumbonal', -0.4, -0.3, 0.14, 0.2, 0.34, '#c2bdb2');
      add('chair2', 'Tumbonal', 0.4, 0.3, 0.14, 0.2, 0.34, '#c2bdb2');
    } else {
      add('desk', 'Mesa de trabajo', -0.12, -0.1, 0.5, 0.24, 0.56, '#a88765');
      add('chair', 'Silla ergonómica', -0.12, 0.22, 0.14, 0.14, 0.5, '#737d78');
      add('booth', 'Cabina de llamadas', 0.32, -0.16, 0.2, 0.26, 1.2, '#98a39d');
      add('plant', 'Planta decorativa', 0.32, 0.34, 0.1, 0.1, 0.72, '#648b68');
    }
  } else {
    if (t.suffix === 'PH') {
      add('bed', 'Cama king', -0.24, -0.2, 0.38, 0.3, 0.58, '#eeeae1');
      add('sofa', 'Sofá de diseño', 0.2, 0.16, 0.42, 0.18, 0.6, '#9aa39c');
      add('table', 'Mesa baja', 0.18, -0.16, 0.24, 0.18, 0.4, '#ad8a64');
      add('plant', 'Planta decorativa', -0.36, 0.34, 0.1, 0.1, 0.78, '#648b68');
    } else if (t.suffix === 'SL') {
      add('bar', 'Barra del salón', -0.2, -0.18, 0.42, 0.16, 0.95, '#a88765');
      add('sofa', 'Sofá lounge', 0.2, 0.14, 0.4, 0.2, 0.6, '#9aa39c');
      add('fire', 'Chimenea', -0.32, 0.3, 0.16, 0.16, 0.9, '#8d8b83');
      add('plant', 'Planta decorativa', 0.36, -0.3, 0.1, 0.1, 0.78, '#648b68');
    } else {
      add('deck', 'Plataforma de madera', 0, 0, 0.86, 0.66, 0.08, '#a88765');
      add('garden1', 'Jardinera', -0.34, -0.3, 0.18, 0.2, 0.6, '#648b68');
      add('garden2', 'Jardinera', 0.34, 0.3, 0.18, 0.2, 0.6, '#648b68');
      add('table', 'Mesa exterior', 0, 0.06, 0.24, 0.22, 0.48, '#b7b1a5');
      add('bbq', 'Barbacoa', 0.36, -0.3, 0.16, 0.14, 0.72, '#7c807d');
    }
  }
  return items;
}

function buildRooms(index: number, kind: FloorKind): Room[] {
  let templates: RoomTemplate[];
  if (kind === 'lobby') templates = LOBBY_TEMPLATE;
  else if (kind === 'amenidades') templates = AMENITIES_TEMPLATE;
  else if (kind === 'atico') templates = PENTHOUSE_TEMPLATE;
  else templates = RESIDENTIAL_TEMPLATE;

  return templates.map((t, i) => {
    const heightFactor = kind === 'residencial' ? 1 + index * 0.012 : 1;
    const area = Math.round(t.area * heightFactor);
    return {
      id: `f${index}-${t.suffix}`,
      name: t.name,
      short: t.short,
      type: t.type,
      area,
      beds: t.beds,
      baths: t.baths,
      price: kind === 'lobby' || kind === 'amenidades' || t.suffix === 'TE' ? 'Común' : `$${Math.round((area * 2.35 + index * 7) / 5) * 5}k`,
      status: kind === 'lobby' || kind === 'amenidades' || t.suffix === 'TE' ? 'comun' : STATUSES[(index + i) % STATUSES.length],
      color: t.color,
      material: t.material,
      x: t.pos[0],
      z: t.pos[1],
      w: t.pos[2],
      d: t.pos[3],
      desc: t.desc,
      items: makeItems(t, kind, index),
    };
  });
}

function buildFloors(): Floor[] {
  const kinds: FloorKind[] = [];
  for (let i = 0; i <= 11; i++) {
    if (i === 0) kinds.push('lobby');
    else if (i === 9) kinds.push('amenidades');
    else if (i === 11) kinds.push('atico');
    else kinds.push('residencial');
  }
  return kinds.map((kind, i) => ({
    id: `floor-${i}`,
    label: i === 0 ? 'PB' : i === 11 ? 'AT' : String(i).padStart(2, '0'),
    name: i === 0 ? 'Lobby y recepción' : i === 9 ? 'Amenidades y spa' : i === 11 ? 'Ático y terraza' : `Piso ${String(i).padStart(2, '0')}`,
    kind,
    rooms: buildRooms(i, kind),
  }));
}

const FLOORS = buildFloors();
const FLOOR_HEIGHT = 3.5;
const EXPLODE_GAP = 1.35;
const STATUS_LABEL: Record<RoomStatus, string> = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  vendido: 'Vendido',
  comun: 'Zona común',
};

@Component({
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('scene') private sceneRef?: ElementRef<HTMLCanvasElement>;

  readonly floors = FLOORS;
  readonly statusLabel = STATUS_LABEL;
  readonly totalRooms = FLOORS.reduce((sum, floor) => sum + floor.rooms.length, 0);
  readonly requestSent = signal(false);
  readonly view = signal<ViewMode>('tower');
  readonly selectedFloor = signal<number | null>(null);
  readonly selectedRoom = signal<Room | null>(null);
  readonly selectedItem = signal<RoomItem | null>(null);
  readonly hoveredRoom = signal<string | null>(null);
  readonly tooltip = signal<{ x: number; y: number; title: string; sub: string } | null>(null);
  readonly furnished = signal(true);
  readonly tour = signal(false);
  readonly exploded = signal(true);
  readonly night = signal(false);
  readonly autoRotate = signal(true);

  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private raf = 0;
  private resizeObserver?: ResizeObserver;
  private width = 0;
  private height = 0;
  private time = 0;
  private dragging = false;
  private moved = false;
  private lastX = 0;
  private lastY = 0;
  private explode = 0.55;
  private cam = { yaw: 0.68, pitch: 0.62, zoom: 0.8, targetY: 25 };
  private goal = { yaw: 0.68, pitch: 0.62, zoom: 0.8, targetY: 25, explode: 0.55 };
  private faces: Face[] = [];
  private shadeCache = new Map<string, string>();

  ngAfterViewInit(): void {
    this.canvas = this.sceneRef?.nativeElement;
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.resize();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas);
    }
    if (typeof requestAnimationFrame !== 'undefined') {
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.raf);
  }

  private resize(): void {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private tick = (): void => {
    const k = 0.12;
    if (this.tour() && this.selectedRoom()) {
      this.goal.yaw += 0.007;
      this.goal.pitch = 0.48;
      this.goal.zoom = this.selectedItem() ? 2.9 : 2.45;
    } else if (this.autoRotate() && !this.dragging) {
      this.goal.yaw += 0.0018;
    }
    this.cam.yaw += (this.goal.yaw - this.cam.yaw) * k;
    this.cam.pitch += (this.goal.pitch - this.cam.pitch) * k;
    this.cam.zoom += (this.goal.zoom - this.cam.zoom) * k;
    this.cam.targetY += (this.goal.targetY - this.cam.targetY) * k;
    this.explode += (this.goal.explode - this.explode) * 0.07;
    this.time += 0.016;
    this.render();
    if (typeof requestAnimationFrame !== 'undefined') this.raf = requestAnimationFrame(this.tick);
  };

  private floorY(index: number): number {
    const float = Math.sin(this.time * 0.65 + index * 0.55) * 0.085 * this.explode;
    return index * FLOOR_HEIGHT + index * this.explode * EXPLODE_GAP + float;
  }

  private midY(): number {
    const top = (FLOORS.length - 1) * (FLOOR_HEIGHT + this.explode * EXPLODE_GAP);
    return top / 2;
  }

  private project([x, y, z]: Vec3): { x: number; y: number; depth: number } {
    const cy = Math.cos(this.cam.yaw);
    const sy = Math.sin(this.cam.yaw);
    const cp = Math.cos(this.cam.pitch);
    const sp = Math.sin(this.cam.pitch);
    const dy = y - this.cam.targetY;
    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;
    const y2 = dy * cp - z1 * sp;
    const z2 = dy * sp + z1 * cp;
    const depth = Math.max(6, 52 - z2);
    const f = Math.min(this.width, this.height) * this.cam.zoom * 1.06;
    return { x: this.width / 2 + (x1 * f) / depth, y: this.height / 2 - (y2 * f) / depth, depth };
  }

  private shade(hex: string, factor: number): string {
    const key = `${hex}|${factor}|${this.night()}`;
    const cached = this.shadeCache.get(key);
    if (cached) return cached;
    const raw = hex.replace('#', '');
    const adjust = (part: string) => {
      const base = parseInt(part, 16);
      const night = this.night() ? 0.78 : 1;
      return Math.max(0, Math.min(255, Math.round(base * factor * night))).toString(16).padStart(2, '0');
    };
    const result = `#${adjust(raw.slice(0, 2))}${adjust(raw.slice(2, 4))}${adjust(raw.slice(4, 6))}`;
    this.shadeCache.set(key, result);
    return result;
  }

  private rgba(hex: string, alpha: number): string {
    const raw = hex.replace('#', '');
    return `rgba(${parseInt(raw.slice(0, 2), 16)},${parseInt(raw.slice(2, 4), 16)},${parseInt(raw.slice(4, 6), 16)},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
  }

  private quad(
    target: Face[],
    pts: Vec3[],
    color: string,
    opts: BoxOptions = {},
  ): void {
    target.push({
      pts,
      color,
      alpha: opts.alpha ?? 1,
      stroke: opts.stroke,
      roomId: opts.roomId,
      itemId: opts.itemId,
      itemName: opts.itemName,
      floorIndex: opts.floorIndex,
      kind: opts.kind ?? 'wall',
      screen: [],
      depth: 0,
    });
  }

  private box(
    target: Face[],
    cx: number,
    cy: number,
    cz: number,
    sx: number,
    sy: number,
    sz: number,
    color: string,
    opts: BoxOptions = {},
  ): void {
    const x0 = cx - sx / 2;
    const x1 = cx + sx / 2;
    const y0 = cy - sy / 2;
    const y1 = cy + sy / 2;
    const z0 = cz - sz / 2;
    const z1 = cz + sz / 2;
    const base = { ...opts, kind: opts.kind ?? 'wall' };
    const top = (c: string) => this.quad(target, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], c, base);
    const front = (c: string) => this.quad(target, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], c, base);
    const back = (c: string) => this.quad(target, [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], c, base);
    const right = (c: string) => this.quad(target, [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], c, base);
    const left = (c: string) => this.quad(target, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], c, base);

    top(this.shade(color, 1.16));
    front(this.shade(color, 0.84));
    right(this.shade(color, 0.7));
    left(this.shade(color, 0.76));
    if ((opts.faces ?? 5) > 4) back(this.shade(color, 0.62));
  }

  private buildFaces(): Face[] {
    const target: Face[] = [];
    const detailFloor = this.selectedFloor();

    for (let i = 0; i < FLOORS.length; i++) {
      const floor = FLOORS[i];
      const y = this.floorY(i);
      const detail = this.view() === 'tower' || i === detailFloor;
      const slabColor = i === 0 ? '#8f928c' : i === 9 ? '#929792' : i === 11 ? '#a5a39b' : '#9b9d96';

      this.box(target, 0, y + 0.17, 0, 16.4, 0.34, 11.4, slabColor, { floorIndex: i, kind: 'slab', faces: 5 });

      const glassColor = this.night() ? '#bcd7f7' : '#cbdcf2';
      const glassAlpha = this.night() ? 0.16 : 0.13;
      const glassStroke = this.night() ? 'rgba(191,219,254,.35)' : 'rgba(255,255,255,.2)';
      const glassOpts: BoxOptions = { floorIndex: i, kind: 'glass', alpha: glassAlpha, stroke: glassStroke };
      this.quad(target, [[-8, y + 0.42, 5.5], [8, y + 0.42, 5.5], [8, y + 3.36, 5.5], [-8, y + 3.36, 5.5]], glassColor, glassOpts);
      this.quad(target, [[8, y + 0.42, -5.5], [-8, y + 0.42, -5.5], [-8, y + 3.36, -5.5], [8, y + 3.36, -5.5]], glassColor, glassOpts);
      this.quad(target, [[-8, y + 0.42, -5.5], [-8, y + 0.42, 5.5], [-8, y + 3.36, 5.5], [-8, y + 3.36, -5.5]], glassColor, glassOpts);
      this.quad(target, [[8, y + 0.42, 5.5], [8, y + 0.42, -5.5], [8, y + 3.36, -5.5], [8, y + 3.36, 5.5]], glassColor, glassOpts);

      const frameOpts: BoxOptions = { floorIndex: i, kind: 'frame', alpha: 0.95 };
      for (const px of [-8, 0, 8]) {
        for (const pz of [-5.5, 5.5]) {
          this.box(target, px, y + 1.88, pz, 0.16, 3.1, 0.16, '#79827f', { ...frameOpts, faces: 3 });
        }
      }

      if (!detail) continue;

      this.box(target, 0, y + 1.38, 0, 3.3, 2.1, 3.3, '#7e8581', { floorIndex: i, kind: 'core', faces: 5 });
      this.box(target, 0, y + 2.48, 0, 3.5, 0.1, 3.5, '#b0a893', { floorIndex: i, kind: 'core', faces: 1 });

      for (const room of floor.rooms) {
        const opts: BoxOptions = { roomId: room.id, floorIndex: i, alpha: 0.95 };
        const inset = 0.14;
        this.quad(target, [
          [room.x - room.w / 2 + inset, y + 0.35, room.z - room.d / 2 + inset],
          [room.x + room.w / 2 - inset, y + 0.35, room.z - room.d / 2 + inset],
          [room.x + room.w / 2 - inset, y + 0.35, room.z + room.d / 2 - inset],
          [room.x - room.w / 2 + inset, y + 0.35, room.z + room.d / 2 - inset],
        ], room.material, { ...opts, kind: 'patch', alpha: room.status === 'vendido' ? 0.72 : 0.96, stroke: 'rgba(255,255,255,.16)' });

        if (this.night()) {
          this.quad(target, [
            [room.x - room.w * 0.32, y + 0.36, room.z - room.d * 0.3],
            [room.x + room.w * 0.32, y + 0.36, room.z - room.d * 0.3],
            [room.x + room.w * 0.32, y + 0.36, room.z + room.d * 0.3],
            [room.x - room.w * 0.32, y + 0.36, room.z + room.d * 0.3],
          ], '#cfe3ff', { ...opts, kind: 'patch', alpha: 0.14 });
        }

        const wallH = 0.92;
        const wallY = y + 0.36 + wallH / 2;
        const wallColor = '#dcd8cf';
        this.box(target, room.x, wallY, room.z - room.d / 2 + 0.08, room.w, wallH, 0.16, wallColor, { ...opts, faces: 4 });
        this.box(target, room.x, wallY, room.z + room.d / 2 - 0.08, room.w, wallH, 0.16, wallColor, { ...opts, faces: 4 });
        this.box(target, room.x - room.w / 2 + 0.08, wallY, room.z, 0.16, wallH, room.d, wallColor, { ...opts, faces: 4 });
        this.box(target, room.x + room.w / 2 - 0.08, wallY, room.z, 0.16, wallH, room.d, wallColor, { ...opts, faces: 4 });

        if (this.furnished()) {
          const visible = this.view() === 'tower' ? room.items.slice(0, 2) : room.items;
          for (const item of visible) {
            this.box(target, item.x, y + 0.36 + item.h / 2, item.z, item.w, item.h, item.d, item.color, {
              ...opts,
              itemId: item.id,
              itemName: item.name,
              kind: 'furniture',
              faces: 4,
            });
          }
        }

        this.box(target, room.x + room.w / 2 - 0.42, y + 0.58, room.z + room.d / 2 - 0.42, 0.3, 0.3, 0.3, STATUS_COLOR[room.status], { ...opts, kind: 'furniture', faces: 4 });
      }

      if (floor.kind === 'atico' || i === 0) {
        for (const px of [-6.6, 6.6]) {
          for (const pz of [-4.2, 4.2]) {
            this.box(target, px, y + 0.72, pz, 1.5, 0.66, 1.5, '#6b6357', { floorIndex: i, kind: 'roof', faces: 3, alpha: 0.9 });
            this.box(target, px, y + 1.16, pz, 1.1, 0.42, 1.1, '#658a68', { floorIndex: i, kind: 'roof', faces: 3, alpha: 0.9 });
          }
        }
      }
    }
    return target;
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.lineWidth = 1;
    for (let g = -28; g <= 28; g += 4) {
      const a = this.project([g, -0.45, -28]);
      const b = this.project([g, -0.45, 28]);
      const c = this.project([-28, -0.45, g]);
      const d = this.project([28, -0.45, g]);
      ctx.strokeStyle = this.night() ? 'rgba(56,189,248,.075)' : 'rgba(59,130,246,.1)';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCompass(ctx: CanvasRenderingContext2D): void {
    const x = this.width - 54;
    const y = this.height - 54;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(148,163,184,.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(-this.cam.yaw);
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(5, 3);
    ctx.lineTo(0, -1);
    ctx.lineTo(-5, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(226,232,240,.9)';
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', 0, -25);
    ctx.restore();
  }

  private drawLabels(ctx: CanvasRenderingContext2D): void {
    const selected = this.selectedFloor();
    if (this.view() === 'tower') {
      for (let i = 0; i < FLOORS.length; i++) {
        const p = this.project([-10.6, this.floorY(i) + 1.5, 0]);
        const scale = Math.max(0.72, Math.min(1.15, 52 / p.depth));
        const label = FLOORS[i].label;
        const w = 34 * scale;
        const h = 22 * scale;
        const active = selected === i;
        ctx.save();
        this.roundRect(ctx, p.x - w / 2, p.y - h / 2, w, h, 7 * scale);
        ctx.fillStyle = active ? 'rgba(30,64,175,.96)' : 'rgba(12,22,25,.88)';
        ctx.fill();
        ctx.strokeStyle = active ? '#bfdbfe' : 'rgba(191,219,254,.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = active ? '#eff6ff' : '#e3e9e6';
        ctx.font = `700 ${11 * scale}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, p.x, p.y + 0.5);
        ctx.restore();
      }
      return;
    }

    if (selected === null) return;
    for (const room of FLOORS[selected].rooms) {
      const p = this.project([room.x, this.floorY(selected) + 1.45, room.z]);
      const scale = Math.max(0.8, Math.min(1.3, 58 / p.depth));
      const active = this.selectedRoom()?.id === room.id;
      const hovered = this.hoveredRoom() === room.id;
      const text = `${room.short} · ${room.area} m²`;
      ctx.save();
      ctx.font = `700 ${11 * scale}px system-ui, sans-serif`;
      const w = ctx.measureText(text).width + 22 * scale;
      const h = 24 * scale;
      this.roundRect(ctx, p.x - w / 2, p.y - h / 2, w, h, 8 * scale);
      ctx.fillStyle = active ? 'rgba(23,47,90,.96)' : 'rgba(12,22,25,.9)';
      ctx.fill();
      ctx.strokeStyle = active || hovered ? '#93c5fd' : 'rgba(191,219,254,.3)';
      ctx.lineWidth = active ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = active ? '#eff6ff' : '#e6ece9';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, p.x, p.y + 0.5);
      ctx.beginPath();
      ctx.arc(p.x - w / 2 + 9 * scale, p.y, 3 * scale, 0, Math.PI * 2);
      ctx.fillStyle = STATUS_COLOR[room.status];
      ctx.fill();
      ctx.restore();
    }
  }

  private render(): void {
    const ctx = this.ctx;
    if (!ctx || this.width < 2 || this.height < 2) return;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawGrid(ctx);

    const faces = this.buildFaces();
    for (const face of faces) {
      const pts = face.pts.map((p) => this.project(p));
      face.screen = pts;
      face.depth = pts.reduce((sum, p) => sum + p.depth, 0) / pts.length;
    }
    faces.sort((a, b) => b.depth - a.depth);
    this.faces = faces;

    const selectedRoomId = this.selectedRoom()?.id;
    const selectedItemId = this.selectedItem()?.id;
    const hoveredId = this.hoveredRoom();
    const selectedFloor = this.selectedFloor();

    for (const face of faces) {
      let alpha = face.alpha;
      if (this.view() !== 'tower' && face.floorIndex !== selectedFloor) alpha *= 0.14;
      if (face.kind === 'glass' && this.view() === 'floor') alpha *= 0.6;
      if (face.roomId === hoveredId) alpha = Math.min(1, alpha + 0.12);
      if (face.roomId === selectedRoomId) alpha = Math.min(1, alpha + 0.04);
      if (face.itemId === selectedItemId) alpha = 1;
      if (alpha <= 0.01) continue;

      const roomHighlighted = !!face.roomId && (face.roomId === hoveredId || face.roomId === selectedRoomId);
      const itemSelected = !!face.itemId && face.itemId === selectedItemId;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(face.screen[0].x, face.screen[0].y);
      for (let i = 1; i < face.screen.length; i++) ctx.lineTo(face.screen[i].x, face.screen[i].y);
      ctx.closePath();
      ctx.fillStyle = this.rgba(face.color, alpha);
      if (roomHighlighted && face.kind === 'patch') {
        ctx.shadowColor = 'rgba(147,197,253,.85)';
        ctx.shadowBlur = 9 + Math.sin(this.time * 2.4) * 3;
      }
      if (itemSelected) {
        ctx.shadowColor = '#93c5fd';
        ctx.shadowBlur = 14;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      if (face.stroke || roomHighlighted || itemSelected) {
        ctx.strokeStyle = itemSelected ? '#bfdbfe' : roomHighlighted ? 'rgba(239,246,255,.92)' : (face.stroke ?? 'transparent');
        ctx.lineWidth = itemSelected ? 2.4 : roomHighlighted ? 1.6 : 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    this.drawLabels(ctx);
    this.drawCompass(ctx);
  }

  private pointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      if (yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  private pick(event: PointerEvent): Face | null {
    if (!this.canvas) return null;
    const rect = this.canvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    for (let i = this.faces.length - 1; i >= 0; i--) {
      const face = this.faces[i];
      if (face.kind === 'glass' || face.kind === 'frame') continue;
      if (this.view() !== 'tower' && face.floorIndex !== this.selectedFloor()) continue;
      if (this.pointInPolygon(point, face.screen)) return face;
    }
    return null;
  }

  onPointerDown(event: PointerEvent): void {
    this.dragging = true;
    this.moved = false;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (this.dragging) {
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.moved = true;
      this.goal.yaw += dx * 0.006;
      this.goal.pitch = Math.max(0.18, Math.min(1.08, this.goal.pitch + dy * 0.004));
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.tooltip.set(null);
      return;
    }
    const face = this.pick(event);
    this.hoveredRoom.set(face?.roomId ?? null);
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left + 16;
    const y = event.clientY - rect.top + 16;
    const floorIndex = face?.floorIndex;
    if (face?.itemName && floorIndex !== undefined) {
      const room = FLOORS[floorIndex].rooms.find((r) => r.id === face.roomId);
      this.tooltip.set({ x, y, title: face.itemName, sub: room ? `${room.name} · clic para ver el elemento` : 'Elemento del espacio' });
    } else if (face?.roomId && floorIndex !== undefined) {
      const room = FLOORS[floorIndex].rooms.find((r) => r.id === face.roomId);
      if (room) this.tooltip.set({ x, y, title: room.name, sub: `${room.area} m² · ${STATUS_LABEL[room.status]} · clic para entrar` });
    } else if (floorIndex !== undefined) {
      this.tooltip.set({ x, y, title: FLOORS[floorIndex].name, sub: 'Nivel del edificio · clic para explorar' });
    } else {
      this.tooltip.set(null);
    }
  }

  onPointerUp(event: PointerEvent): void {
    this.dragging = false;
    if (this.moved) return;
    const face = this.pick(event);
    if (!face) return;
    const floorIndex = face.floorIndex;
    const room = face.roomId && floorIndex !== undefined ? FLOORS[floorIndex].rooms.find((r) => r.id === face.roomId) : undefined;
    if (!room || floorIndex === undefined) {
      if (floorIndex !== undefined) this.selectFloor(floorIndex);
      return;
    }
    if (face.itemId) {
      const item = room.items.find((i) => i.id === face.itemId);
      if (item) this.selectItem(item, room, floorIndex);
    } else {
      this.selectRoom(room, floorIndex);
    }
  }

  onPointerLeave(): void {
    this.dragging = false;
    this.hoveredRoom.set(null);
    this.tooltip.set(null);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.zoomBy(event.deltaY > 0 ? 0.91 : 1.09);
  }

  selectFloor(index: number): void {
    this.selectedFloor.set(index);
    this.selectedRoom.set(null);
    this.selectedItem.set(null);
    this.tour.set(false);
    this.tooltip.set(null);
    this.view.set('floor');
    this.goal.targetY = this.floorY(index) + 1.2;
    this.goal.zoom = 1.62;
    this.goal.pitch = 0.72;
  }

  selectRoom(room: Room, floorIndex: number): void {
    this.requestSent.set(false);
    this.selectedRoom.set(room);
    this.selectedItem.set(null);
    this.selectedFloor.set(floorIndex);
    this.view.set('room');
    this.tour.set(false);
    this.tooltip.set(null);
    this.goal.targetY = this.floorY(floorIndex) + 1.2;
    this.goal.zoom = 2.05;
    this.goal.pitch = 0.8;
  }

  selectItem(item: RoomItem, room: Room, floorIndex: number): void {
    this.requestSent.set(false);
    this.selectedItem.set(item);
    this.selectedRoom.set(room);
    this.selectedFloor.set(floorIndex);
    this.view.set('room');
    this.tooltip.set(null);
    this.goal.targetY = this.floorY(floorIndex) + 1.2;
    this.goal.zoom = 2.6;
    this.goal.pitch = 0.72;
  }

  clearItem(): void {
    this.selectedItem.set(null);
    this.goal.zoom = this.tour() ? 2.45 : 2.05;
    this.goal.pitch = this.tour() ? 0.48 : 0.8;
  }

  toggleFurnished(): void {
    this.furnished.update((v) => !v);
    if (!this.furnished()) this.selectedItem.set(null);
  }

  toggleTour(): void {
    const next = !this.tour();
    this.tour.set(next);
    if (!next) {
      this.goal.pitch = this.selectedItem() ? 0.72 : 0.8;
      this.goal.zoom = this.selectedItem() ? 2.6 : 2.05;
    }
  }

  backToTower(): void {
    this.selectedFloor.set(null);
    this.selectedRoom.set(null);
    this.selectedItem.set(null);
    this.tour.set(false);
    this.tooltip.set(null);
    this.view.set('tower');
    this.goal.targetY = this.midY() + 1.7;
    this.goal.zoom = this.exploded() ? 0.8 : 0.7;
    this.goal.pitch = 0.62;
  }

  stepFloor(direction: number): void {
    const current = this.selectedFloor() ?? (direction > 0 ? -1 : FLOORS.length);
    const next = Math.max(0, Math.min(FLOORS.length - 1, current + direction));
    this.selectFloor(next);
  }

  toggleExplode(): void {
    const next = !this.exploded();
    this.exploded.set(next);
    this.goal.explode = next ? 0.55 : 0;
    if (this.view() === 'tower') this.goal.targetY = this.midY() + 1.7;
  }

  toggleNight(): void {
    this.night.update((v) => !v);
    this.shadeCache.clear();
  }

  toggleAutoRotate(): void {
    this.autoRotate.update((v) => !v);
  }

  requestInfo(): void {
    this.requestSent.set(true);
  }

  zoomBy(factor: number): void {
    this.goal.zoom = Math.max(0.48, Math.min(3.2, this.goal.zoom * factor));
  }

  reset(): void {
    this.requestSent.set(false);
    this.goal.yaw = 0.68;
    this.goal.pitch = 0.62;
    this.goal.explode = 0.55;
    this.exploded.set(true);
    this.autoRotate.set(true);
    this.backToTower();
  }

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.stepFloor(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.stepFloor(1);
    } else if (event.key === 'Escape') {
      if (this.selectedItem()) this.clearItem();
      else this.backToTower();
    }
  }
}
