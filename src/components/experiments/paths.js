// Download links of the workspace API (served by the same origin).
export const encodeArtifactPath = (artifactId) => `/api/v7/workspace/artifacts/${encodeURIComponent(artifactId)}`
export const encodeReportPath = (reportId, format) => `/api/v7/workspace/reports/${encodeURIComponent(reportId)}/files/${format}`
