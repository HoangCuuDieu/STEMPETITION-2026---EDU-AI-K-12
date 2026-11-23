export type PhysicsGroupId =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J';

export interface ParameterSpec {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface TelemetryReading {
  label: string;
  value: string;
  unit: string;
}

export interface GraphPoint {
  x: number;
  y: number;
}

export interface PhysicsSimulationResult {
  readings: TelemetryReading[];
  graphSeries?: {
    title: string;
    xLabel: string;
    yLabel: string;
    points: GraphPoint[];
  };
}

export interface PhysicsCatalogItem {
  id: string;
  orderNumber: number;
  name: string;
  groupId: PhysicsGroupId;
  groupName: string;
  suggestedGrades: number[];
  isTimeDependent: boolean;
  previewType:
    | 'motion'
    | 'projectile'
    | 'force'
    | 'energy'
    | 'orbit'
    | 'oscillation'
    | 'wave'
    | 'thermo'
    | 'electric'
    | 'magnetic'
    | 'optics';
  status: 'implemented' | 'pending';
}

export interface PhysicsSimulationSpec extends PhysicsCatalogItem {
  parameters: ParameterSpec[];
  formulasLatex: string[];
  explanationVi: string;
  assumptionsAndLimits: string[];
  stepAndRender: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    t: number,
    params: Record<string, number>,
    history: GraphPoint[],
  ) => PhysicsSimulationResult;
}
