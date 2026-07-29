interface HeightLegendProps {
  min: number
  max: number
}

/** Shared colour-scale legend for beam-height visualisations (radial grid, 3D scene). */
export function HeightLegend({ min, max }: HeightLegendProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-xs text-slate-500 tabular-nums">{min.toFixed(2)}м</span>
      <div
        className="h-3 w-40 rounded"
        style={{
          background:
            'linear-gradient(to right, hsl(220,90%,55%), hsl(190,85%,50%), hsl(120,70%,45%), hsl(40,95%,50%), hsl(0,90%,55%))',
        }}
        aria-label="Шкала высот от минимума (синий) до максимума (красный)"
      />
      <span className="text-xs text-slate-500 tabular-nums">{max.toFixed(2)}м</span>
      <span className="ml-3 text-xs text-slate-600">низко → высоко</span>
    </div>
  )
}
