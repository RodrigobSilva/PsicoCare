import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Garante que o valor seja um array
 * @param value Valor a ser convertido para array
 * @returns Um array, mesmo se o valor de entrada for null ou undefined
 */
export function ensureArray<T>(value: T[] | null | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

/**
 * Força um tipo específico para os elementos do array
 * @param value Valor a ser convertido para array
 * @returns Um array com o tipo especificado
 */
export function asArrayOfType<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [];
}
