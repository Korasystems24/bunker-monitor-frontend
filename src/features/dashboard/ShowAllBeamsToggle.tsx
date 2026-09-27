import { useId } from 'react'

interface ShowAllBeamsToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ShowAllBeamsToggle({ checked, onChange }: ShowAllBeamsToggleProps) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 text-xs font-normal normal-case tracking-normal text-slate-300"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 accent-sky-500"
      />
      Все лучи, кроме отключённых
    </label>
  )
}
