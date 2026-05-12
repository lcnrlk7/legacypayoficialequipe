"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-secondary">
        <div className="w-5 h-5" />
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors border border-border"
      title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700" />
      )}
    </button>
  )
}

export function ThemeToggleWithLabel() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary border border-border">
      <div className="flex items-center gap-3">
        {theme === "dark" ? (
          <Moon className="w-5 h-5 text-primary" />
        ) : (
          <Sun className="w-5 h-5 text-primary" />
        )}
        <div>
          <p className="font-medium text-foreground">Aparencia</p>
          <p className="text-sm text-muted-foreground">
            {theme === "dark" ? "Modo escuro ativado" : "Modo claro ativado"}
          </p>
        </div>
      </div>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          theme === "dark" ? "bg-primary" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
            theme === "dark" ? "translate-x-7" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}
