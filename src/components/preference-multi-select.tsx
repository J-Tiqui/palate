'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'

type PreferenceMultiSelectProps = {
  label: string
  name: string
  options: readonly string[]
  defaultValue?: string[]
  placeholder?: string
  description?: string
}

export function PreferenceMultiSelect({
  label,
  name,
  options,
  defaultValue = [],
  placeholder = 'Choose any that apply',
  description,
}: PreferenceMultiSelectProps) {
  const descriptionId = useId()
  const [selected, setSelected] = useState<string[]>(defaultValue)

  function toggleOption(option: string) {
    setSelected((current) => current.includes(option)
      ? current.filter((value) => value !== option)
      : [...current, option])
  }

  const summary = selected.length === 0
    ? placeholder
    : selected.length <= 2
      ? selected.join(', ')
      : `${selected.length} selected`

  return (
    <fieldset className="preference-select">
      <legend>{label}</legend>
      <input type="hidden" name={name} value={selected.join(',')} />
      <details>
        <summary aria-describedby={description ? descriptionId : undefined}>
          <span className={selected.length ? '' : 'placeholder'}>{summary}</span>
          <ChevronDown aria-hidden="true" size={17} />
        </summary>
        <div className="preference-select-menu">
          {options.map((option) => {
            const checked = selected.includes(option)
            return (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOption(option)}
                />
                <span aria-hidden="true" className="preference-check">
                  {checked ? <Check size={13} strokeWidth={3} /> : null}
                </span>
                {option}
              </label>
            )
          })}
        </div>
      </details>
      {description ? <small id={descriptionId}>{description}</small> : null}
    </fieldset>
  )
}
