/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				"board-bg": "#1A1A2E",
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			backgroundImage: {
				"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
				"gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
			},
			boxShadow: {
				neon: '0 0 5px theme("colors.purple.400"), 0 0 20px theme("colors.purple.700")',
				
			},
			animation: {
				"pulse-slow": "pulse-low 4s cubic-bezier(0.6, 0, 0.1, 1) infinite",
				"epic-shadow": "epic-shadow 1.5s ease-in-out infinite, rotate 1s linear infinite",
			},
			keyframes: {
				"pulse-low": {
					"0%, 100%": {
						"opacity": "1",
					},
					"50%": {
						"opacity": "0.85",
					},
				},
				"epic-shadow": {
					"0%, 100%": {
						"box-shadow": "0 0 15px theme('colors.purple.400'), 0 0 20px theme('colors.purple.700')",
					},
					"50%": {
						"box-shadow": "0 0 15px theme('colors.cyan.400'), 0 0 20px theme('colors.cyan.700')",
					},
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
		},
	},
};
