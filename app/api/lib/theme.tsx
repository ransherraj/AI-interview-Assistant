export function toggleTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark"

  const html = document.documentElement
  const isCurrentlyDark = html.classList.contains("dark")
  const nextTheme = isCurrentlyDark ? "light" : "dark"

  if (nextTheme === "dark") {
    html.classList.add("dark")
  } else {
    html.classList.remove("dark")
  }

  localStorage.setItem("theme", nextTheme)
  return nextTheme
}

export function initThemeListener() {
  if (typeof window === "undefined") return

  const savedTheme = localStorage.getItem("theme")
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
}

export function getTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark"
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}