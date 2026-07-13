import { canonicalJson } from '../../shared/canonical-json.js'
import { ReportDocumentSchema } from '../../shared/workspace-contracts.js'

export const REPORT_CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"

const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`

function resultRows(result) {
  const rows = []
  for (const entry of result.entries) {
    const terminal = entry.result
    rows.push([entry.entryId, 'outcome', terminal.outcome, ''])
    rows.push([entry.entryId, 'iterations', terminal.diagnostics.iterations, 'count'])
    if (terminal.data?.engine === 'ode') {
      for (const series of terminal.data.trajectories) rows.push([entry.entryId, series.id, series.values.at(-1), series.unit.symbol])
    } else if (terminal.data?.engine === 'ssa') {
      for (const summary of terminal.data.summaries) rows.push([entry.entryId, `${summary.id}.mean`, summary.mean, summary.unit.symbol])
    } else if (terminal.data?.engine === 'fba') {
      rows.push([entry.entryId, 'objective', terminal.data.objective, terminal.data.objectiveUnit.symbol])
      for (const flux of terminal.data.fluxes) rows.push([entry.entryId, flux.id, flux.value, flux.unit.symbol])
    }
  }
  return rows
}

function reportSvg(document) {
  const entries = document.result.entries
  const width = 720
  const rowHeight = 42
  const height = 70 + entries.length * rowHeight
  const rows = entries.map((entry, index) => {
    const successful = entry.result.outcome === 'successful'
    const bar = successful ? 520 : 190
    const color = successful ? '#4eaa91' : '#c16f5d'
    const y = 44 + index * rowHeight
    return `<text x="16" y="${y + 18}" fill="#dce9e4" font-family="sans-serif" font-size="13">${escapeHtml(entry.entryId)} · ${escapeHtml(entry.result.outcome)}</text><rect x="180" y="${y}" width="${bar}" height="24" fill="${color}"/>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Run outcomes by portfolio entry"><rect width="100%" height="100%" fill="#101b19"/><text x="16" y="24" fill="#73d5be" font-family="sans-serif" font-size="16">Controlled experiment outcomes</text>${rows}</svg>`
}

export function generateReportFiles(input) {
  const document = ReportDocumentSchema.parse(input)
  const json = canonicalJson(document)
  const rows = resultRows(document.result)
  const csv = `${['entry', 'metric', 'value', 'unit'].map(escapeCsv).join(',')}\n${rows.map((row) => row.map(escapeCsv).join(',')).join('\n')}\n`
  const svg = reportSvg(document)
  const warningItems = document.warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>No engine warning was reported.</li>'
  const boundaryItems = document.scientificBoundaries.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
  const resultRowsHtml = rows.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${REPORT_CSP}"><title>${escapeHtml(document.experiment.name)} report</title><style>body{max-width:960px;margin:0 auto;padding:2rem;background:#101b19;color:#dce9e4;font:16px/1.5 system-ui,sans-serif}h1,h2{color:#73d5be}code{overflow-wrap:anywhere}table{width:100%;border-collapse:collapse}th,td{padding:.5rem;border:1px solid #38534d;text-align:left}svg{width:100%;height:auto}.boundary{border-left:4px solid #f0a65a;padding-left:1rem}</style></head><body><header><p>Deterministic controlled experiment report</p><h1>${escapeHtml(document.experiment.name)}</h1><code>${escapeHtml(document.attempt.runId)}</code></header><main><h2>Outcome</h2><p>${escapeHtml(document.attempt.outcome)}</p>${svg}<h2>Results</h2><table><thead><tr><th>Entry</th><th>Metric</th><th>Value</th><th>Unit</th></tr></thead><tbody>${resultRowsHtml}</tbody></table><h2>Warnings</h2><ul>${warningItems}</ul><section class="boundary"><h2>Scientific boundaries</h2><ul>${boundaryItems}</ul></section><h2>Provenance</h2><p>Revision <code>${escapeHtml(document.revision.revisionId)}</code></p><p>Specification <code>${escapeHtml(document.revision.specificationDigest)}</code></p><p>Knowledge snapshot <code>${escapeHtml(document.revision.snapshotDigest)}</code></p></main></body></html>`
  return {
    html: Buffer.from(html),
    json: Buffer.from(json),
    csv: Buffer.from(csv),
    svg: Buffer.from(svg)
  }
}
