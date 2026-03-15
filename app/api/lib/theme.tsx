export function toggleTheme() {
  const html = document.documentElement

  if (html.classList.contains("dark")) {
    html.classList.remove("dark")
    localStorage.setItem("theme", "light")
  } else {
    html.classList.add("dark")
    localStorage.setItem("theme", "dark")
  }
}

export function loadTheme() {
  const saved = localStorage.getItem("theme")
  const html = document.documentElement

  if (saved === "light") {
    html.classList.remove("dark")
  } else {
    html.classList.add("dark")
  }
}