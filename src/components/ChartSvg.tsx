import type { ChartEl } from "@/lib/layout";
import { FONT_STACKS } from "@/lib/templates";

const hex = (c: string) => `#${c}`;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

const fmt = (v: number) => (Math.abs(v) >= 1000 ? `${+(v / 1000).toFixed(1)}k` : `${+v.toFixed(1)}`);

/** Draws a chart element in slide units; mirrors the native chart in the PPTX export. */
export function ChartSvg({ el }: { el: ChartEl }) {
  const { chart, w, h, colors } = el;
  const font = FONT_STACKS[el.font];
  const unit = chart.unit ?? "";
  const labels = chart.labels;
  const series = chart.series.filter((s) => s.values?.length);

  if (chart.type === "pie" || chart.type === "doughnut") {
    const values = (series[0]?.values ?? []).map((v) => Math.max(0, v));
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const r = Math.min(h, w * 0.5) / 2 - 8;
    const cx = r + 10;
    const cy = h / 2;
    const starts = values.map((_, i) => -Math.PI / 2 + (values.slice(0, i).reduce((a, b) => a + b, 0) / total) * Math.PI * 2);
    const arcs = values.map((v, i) => {
      const a0 = starts[i];
      const a1 = a0 + (v / total) * Math.PI * 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const d =
        values.length === 1
          ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
          : `M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
      const mid = (a0 + a1) / 2;
      return { d, mid, pct: (v / total) * 100, color: colors[i % colors.length] };
    });
    const legendX = cx + r + 40;
    const rowH = Math.min(40, (h - 20) / Math.max(labels.length, 1));
    return (
      <svg width={w} height={h} style={{ fontFamily: font, overflow: "visible" }}>
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={hex(a.color)} stroke={hex("FFFFFF")} strokeWidth={2} />
        ))}
        {chart.type === "doughnut" && <circle cx={cx} cy={cy} r={r * 0.55} style={{ fill: "var(--slide-bg)" }} />}
        {arcs.map((a, i) =>
          a.pct >= 6 ? (
            <text
              key={i}
              x={cx + r * (chart.type === "doughnut" ? 0.78 : 0.62) * Math.cos(a.mid)}
              y={cy + r * (chart.type === "doughnut" ? 0.78 : 0.62) * Math.sin(a.mid)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={15}
              fontWeight={700}
              fill="#FFFFFF"
            >
              {Math.round(a.pct)}%
            </text>
          ) : null,
        )}
        {labels.map((l, i) => (
          <g key={i} transform={`translate(${legendX}, ${h / 2 - (labels.length * rowH) / 2 + i * rowH})`}>
            <rect width={16} height={16} y={rowH / 2 - 8} rx={4} fill={hex(colors[i % colors.length])} />
            <text x={28} y={rowH / 2} dominantBaseline="central" fontSize={17} fill={hex(el.text)}>
              {l}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  const legend = series.length > 1;
  const top = legend ? 34 : 14;
  const left = 54;
  const bottom = 34;
  const pw = w - left - 10;
  const ph = h - top - bottom;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values), 0));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const y = (v: number) => top + ph - (Math.max(0, v) / max) * ph;
  const groupW = pw / Math.max(labels.length, 1);

  return (
    <svg width={w} height={h} style={{ fontFamily: font, overflow: "visible" }}>
      {legend &&
        series.map((s, i) => (
          <g key={i} transform={`translate(${left + i * 150}, 4)`}>
            <rect width={14} height={14} rx={3} fill={hex(colors[i % colors.length])} />
            <text x={22} y={7} dominantBaseline="central" fontSize={14} fill={hex(el.text)}>
              {s.name}
            </text>
          </g>
        ))}
      {ticks.map((tk) => (
        <g key={tk}>
          <line x1={left} x2={left + pw} y1={y(tk * max)} y2={y(tk * max)} stroke={hex(el.grid)} strokeWidth={1} />
          <text x={left - 8} y={y(tk * max)} textAnchor="end" dominantBaseline="central" fontSize={12} fill={hex(el.muted)}>
            {fmt(tk * max)}
            {unit}
          </text>
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={i} x={left + groupW * i + groupW / 2} y={top + ph + 20} textAnchor="middle" fontSize={13} fill={hex(el.muted)}>
          {l}
        </text>
      ))}
      {chart.type === "bar"
        ? series.map((s, si) => {
            const bw = Math.min(70, (groupW * 0.7) / series.length);
            return s.values.map((v, i) => {
              const x = left + groupW * i + groupW / 2 - (bw * series.length) / 2 + si * bw;
              return (
                <g key={`${si}-${i}`}>
                  <rect x={x + 2} y={y(v)} width={bw - 4} height={top + ph - y(v)} rx={4} fill={hex(colors[si % colors.length])} />
                  <text x={x + bw / 2} y={y(v) - 7} textAnchor="middle" fontSize={12} fontWeight={600} fill={hex(el.text)}>
                    {fmt(v)}
                    {unit}
                  </text>
                </g>
              );
            });
          })
        : series.map((s, si) => {
            const pts = s.values.map((v, i) => [left + groupW * i + groupW / 2, y(v)] as const);
            return (
              <g key={si}>
                <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={hex(colors[si % colors.length])} strokeWidth={3.5} strokeLinejoin="round" />
                {pts.map(([px, py], i) => (
                  <circle key={i} cx={px} cy={py} r={5} fill={hex(colors[si % colors.length])} />
                ))}
              </g>
            );
          })}
    </svg>
  );
}
