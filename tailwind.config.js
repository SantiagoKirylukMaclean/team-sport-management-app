/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem" },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary:{ DEFAULT: "hsl(var(--secondary))", foreground:"hsl(var(--secondary-foreground))"},
        muted:    { DEFAULT: "hsl(var(--muted))", foreground:"hsl(var(--muted-foreground))"},
        accent:   { DEFAULT: "hsl(var(--accent))", foreground:"hsl(var(--accent-foreground))"},
        card:     { DEFAULT: "hsl(var(--card))", foreground:"hsl(var(--card-foreground))"},
        bg: "hsl(var(--background))",            // para tu clase bg-bg
      },
      borderRadius: { lg: "0.75rem", xl: "1rem", "2xl": "1.25rem" },
    },
  },
  plugins: [],
}
