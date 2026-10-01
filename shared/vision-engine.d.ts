import type { SearchResults, Detection } from '../src/types/domain'
export interface VisionFrame {
  evidenceId: string
  cameraId: string
  recordedAt: string
  snapshotUrl: string
  provenance: 'sample-metadata'
  model: string
  inferencePerformed: false
  detections: Detection[]
}
export const visionEngineStatus: {
  provider: 'placeholder'
  model: string
  ready: boolean
  label: string
  detail: string
  inferenceConnected: boolean
  cameraConnected: boolean
}
export function placeholderVision(records: SearchResults, incidentId: string): VisionFrame[]
export function validateVisionFrame(value: unknown): {
  cameraId: string
  recordedAt: string
  detections: Omit<Detection, 'id'>[]
}
