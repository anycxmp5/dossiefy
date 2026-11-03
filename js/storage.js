// Локальное хранение прогресса пользователя. Всё в try/catch: в приватном режиме или при заблокированных данных
// localStorage может быть недоступен, тогда прогресс живёт в памяти до закрытия страницы.
const memory = {};

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredClone(fallback);
  } catch {
    return key in memory ? structuredClone(memory[key]) : structuredClone(fallback);
  }
}

export function save(key, value) {
  memory[key] = value;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* только память */ }
}

export function remove(key) {
  delete memory[key];
  try { localStorage.removeItem(key); } catch { /* ничего */ }
}
