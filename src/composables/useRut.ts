import { ref, computed } from 'vue';

function calcularDv(cuerpo: string): string {
  const digits = cuerpo.replace(/\D/g, '');
  if (!digits) return '';
  let suma = 0;
  let factor = 2;
  for (let i = digits.length - 1; i >= 0; i--) {
    suma += parseInt(digits[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

function esRutValido(valor: string): boolean {
  const match = valor.toUpperCase().match(/^(\d{2,8})-([0-9K])$/);
  if (!match) return false;
  return calcularDv(match[1]) === match[2];
}

// Intenta insertar el guión tomando el último carácter como DV.
// Si el resultado es válido lo devuelve formateado, si no devuelve el input sin guión.
function intentarFormatear(raw: string): string {
  // Solo dígitos y K, máx 9 chars
  const clean = raw.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
  if (clean.length < 2) return clean;
  const candidato = clean.slice(0, -1) + '-' + clean.slice(-1);
  return esRutValido(candidato) ? candidato : clean;
}

export function useRut(initial = '') {
  const rut = ref(initial);
  const touched = ref(false);

  // Mientras escribe: solo sanear caracteres, sin forzar guión
  function onInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value;
    // Permitir guión solo si ya está bien puesto (para no bloquear borrado)
    const clean = raw.replace(/[^0-9kK\-]/gi, '').toUpperCase().slice(0, 10);
    rut.value = clean;
  }

  // Al perder foco: intentar autocompletar el guión
  function onBlur() {
    touched.value = true;
    if (!rut.value) return;
    // Si ya tiene guión y es válido, normalizar mayúsculas y salir
    if (rut.value.includes('-')) {
      rut.value = rut.value.toUpperCase();
      return;
    }
    rut.value = intentarFormatear(rut.value);
  }

  const isValid = computed(() => esRutValido(rut.value));

  const showError = computed(() => touched.value && rut.value.length > 1 && !isValid.value);

  const rutClean = computed(() => rut.value.toUpperCase());

  function setRut(value: string) {
    rut.value = value ?? '';
    touched.value = false;
  }

  return { rut, isValid, showError, rutClean, onInput, onBlur, setRut };
}
