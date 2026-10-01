// Contract for a future YOLOv8n adapter. This placeholder reads labeled sample metadata only.
export const visionEngineStatus = {
  provider: 'placeholder',
  model: 'YOLOv8n',
  ready: true,
  label: 'YOLOv8n · placeholder',
  detail:
    'Workflow preview is available. Model inference and live camera ingestion are disconnected.',
  inferenceConnected: false,
  cameraConnected: false,
}

export function placeholderVision(records, incidentId) {
  const alert = records.alerts.find((item) => item.id === incidentId)
  if (!alert) throw new Error('Incident not found.')
  return records.evidence
    .filter((item) => alert.evidenceIds.includes(item.id))
    .slice(0, 20)
    .map((item) => ({
      evidenceId: item.id,
      cameraId: item.metadata.cameraId,
      recordedAt: item.metadata.ts,
      snapshotUrl: item.snapshotUrl,
      provenance: 'sample-metadata',
      model: 'YOLOv8n',
      inferencePerformed: false,
      detections: item.detections.map((detection) => ({
        ...detection,
        bbox: { ...detection.bbox },
      })),
    }))
}

export function validateVisionFrame(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    typeof value.cameraId !== 'string' ||
    value.cameraId.length > 100 ||
    !value.cameraId.trim() ||
    typeof value.recordedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.recordedAt)) ||
    !Array.isArray(value.detections) ||
    value.detections.length > 100
  )
    throw new Error('Invalid vision frame metadata.')
  for (const detection of value.detections) {
    if (
      !detection ||
      typeof detection.label !== 'string' ||
      !detection.label.trim() ||
      detection.label.length > 100 ||
      !Number.isFinite(detection.confidence) ||
      detection.confidence < 0 ||
      detection.confidence > 1 ||
      !detection.bbox ||
      !['x', 'y', 'width', 'height'].every(
        (key) =>
          Number.isFinite(detection.bbox[key]) &&
          detection.bbox[key] >= 0 &&
          detection.bbox[key] <= 1,
      ) ||
      detection.bbox.width === 0 ||
      detection.bbox.height === 0 ||
      detection.bbox.x + detection.bbox.width > 1 ||
      detection.bbox.y + detection.bbox.height > 1
    )
      throw new Error('Invalid vision detection or normalized bounding box.')
  }
  return {
    cameraId: value.cameraId.trim(),
    recordedAt: value.recordedAt,
    detections: value.detections.map((item) => ({
      label: item.label.trim(),
      confidence: item.confidence,
      bbox: { x: item.bbox.x, y: item.bbox.y, width: item.bbox.width, height: item.bbox.height },
    })),
  }
}
