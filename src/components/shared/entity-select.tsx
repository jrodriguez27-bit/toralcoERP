'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EntitySelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: { value: string; label: string }[]
  disabled?: boolean
  className?: string
}

export function EntitySelect({
  value,
  onValueChange,
  placeholder = 'Seleccionar...',
  options,
  disabled,
  className,
}: EntitySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
