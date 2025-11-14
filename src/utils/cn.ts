import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function conditionalClass(
  condition: boolean,
  trueClass: string,
  falseClass?: string
): string {
  return condition ? trueClass : (falseClass || '');
}

export function variantClass(
  variants: Record<string, string>,
  activeVariant: string,
  defaultClasses?: string
): string {
  const variantClasses = variants[activeVariant] || '';
  return cn(defaultClasses, variantClasses);
}

export function mergeTailwindClasses(
  baseClasses: string,
  overrideClasses: string
): string {
  const base = baseClasses.split(' ').filter(Boolean);
  const override = overrideClasses.split(' ').filter(Boolean);
  
  // Simple merge - in a real implementation, you'd want to handle
  // Tailwind class conflicts more intelligently
  const merged = [...base];
  
  override.forEach(cls => {
    if (!merged.includes(cls)) {
      merged.push(cls);
    }
  });
  
  return merged.join(' ');
}