interface ErrorMessageProps {
  message: string
  retry?: () => void
}

export function ErrorMessage({ message, retry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-red-800 bg-red-950/30 p-6 text-center">
      <span className="text-2xl">⚠</span>
      <p className="text-sm text-red-300">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="rounded bg-red-800/50 px-4 py-1.5 text-sm text-red-200 hover:bg-red-700/50"
        >
          Повторить
        </button>
      )}
    </div>
  )
}
