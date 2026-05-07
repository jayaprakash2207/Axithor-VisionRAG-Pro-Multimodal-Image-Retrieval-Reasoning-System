/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      colors: {
        ink: "#0b0f19",
        "ink-light": "#111827",
        "ink-lighter": "#1a2035",
        haze: "#a7b1c2",
        glow: "#4ef3c2",
        ember: "#ff9f1c",
        neon: "#66f0ff",
        "neon-dim": "#66f0ff20",
        violet: "#a855f7",
        rose: "#f43f5e",
      },
      boxShadow: {
        glass: "0 0 40px rgba(102, 240, 255, 0.12)",
        "glass-lg": "0 0 80px rgba(102, 240, 255, 0.15)",
        "glow-sm": "0 0 20px rgba(78, 243, 194, 0.2)",
        "glow-neon": "0 0 30px rgba(102, 240, 255, 0.25)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-card":
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: 0.4 },
          "50%": { opacity: 0.9 },
        },
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(24px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        borderGlow: {
          "0%, 100%": { borderColor: "rgba(102, 240, 255, 0.2)" },
          "50%": { borderColor: "rgba(102, 240, 255, 0.6)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        glowPulse: "glowPulse 3s ease-in-out infinite",
        fadeIn: "fadeIn 0.5s ease-out forwards",
        slideUp: "slideUp 0.6s ease-out forwards",
        scaleIn: "scaleIn 0.4s ease-out forwards",
        shimmer: "shimmer 2s infinite linear",
        orbit: "orbit 20s linear infinite",
        borderGlow: "borderGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
