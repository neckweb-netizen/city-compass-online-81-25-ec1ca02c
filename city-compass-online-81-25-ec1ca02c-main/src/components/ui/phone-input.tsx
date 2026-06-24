import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
}

const formatPhoneNumber = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Se estiver vazio ou apenas começando, adiciona o DDD padrão 75
  if (numbers.length === 0) {
    return '';
  }
  
  // Se não começar com 75, adiciona o DDD padrão
  let finalNumbers = numbers;
  if (numbers.length <= 2 && !numbers.startsWith('75')) {
    finalNumbers = '75' + numbers;
  }
  
  // Limita a 11 dígitos (DDD + 9 dígitos)
  const limitedNumbers = finalNumbers.slice(0, 11);
  
  // Aplica a formatação (75) 9999-9999 ou (75) 99999-9999
  if (limitedNumbers.length <= 2) {
    return `(${limitedNumbers}`;
  } else if (limitedNumbers.length <= 6) {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
  } else if (limitedNumbers.length <= 10) {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
  } else {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  }
};

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formattedValue = formatPhoneNumber(e.target.value);
      onChange?.(formattedValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Se o campo estiver vazio, adiciona o DDD padrão
      if (!value || value.length === 0) {
        onChange?.('(75) ');
      }
    };

    return (
      <Input
        type="tel"
        className={cn(className)}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="(75) 99999-9999"
        ref={ref}
        {...props}
      />
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }