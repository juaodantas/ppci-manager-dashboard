'use client'

import { Button } from '../ui/Button'

export function FinancialGraphsCarousel({
  activeIndex,
  total,
  title,
  onPrevious,
  onNext,
  onSelect,
}: {
  activeIndex: number
  total: number
  title: string
  onPrevious: () => void
  onNext: () => void
  onSelect: (index: number) => void
}) {
  const canGoPrevious = activeIndex > 0
  const canGoNext = activeIndex < total - 1

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          aria-label="Ir para o gráfico anterior"
          aria-disabled={!canGoPrevious}
        >
          ←
        </Button>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Ir para o próximo gráfico"
          aria-disabled={!canGoNext}
        >
          →
        </Button>
      </div>

      <div className="flex items-center justify-center gap-1" role="tablist" aria-label="Navegação dos gráficos financeiros">
        {Array.from({ length: total }).map((_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Ir para gráfico ${index + 1}`}
            onClick={() => onSelect(index)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${index === activeIndex ? 'bg-blue-600' : 'bg-gray-300'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}
