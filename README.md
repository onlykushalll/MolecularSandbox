# 🧪 The Molecular Sandbox

[![Next.js 16](https://img.shields.io/badge/Next.js-16.1.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.11.1-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Three.js / R3F](https://img.shields.io/badge/Three.js-R3F-orange?style=for-the-badge)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

An interactive, scientifically accurate 3D chemistry laboratory simulator built with Next.js, React Three Fiber, Tailwind CSS, and Prisma. The application models real-world stoichiometric equations, chemical reactions, physical kinetics, and titration curves.

---

## 🌟 Key Capabilities

### 1. 🎛️ Real-Time 3D Laboratory Bench
*   **Active Apparatus**: A glossy dark resin benchtop equipped with reactive 3D props, including a Bunsen burner (animated flame, adjustment knobs), a responsive thermometer prop (mercury rises/falls based on solution temperature), wash bottles, safety goggles, and a ring stand.
*   **Variable Containers**: Select from cylindrical Beakers, conical Erlenmeyer Flasks, narrow Test Tubes, or spherical Round Flasks. Liquid geometry adapts to each vessel.
*   **Interactive Controls**: Supports canvas dragging (OrbitControls) to inspect reaction vessels and mouse selection (with keyboard shortcuts `1`/`2`/`3` and pour targetting via `Shift+Click`).

### 2. ⚗️ Advanced Chemistry & Thermodynamics Engine
*   **Stoichiometry Engine**: Resolves exact limiting reagents, computes moles, specific heat capacity of mixtures, and predicts temperature changes ($\Delta T$) using reaction enthalpy ($\Delta H$).
*   **Solubility Rules Engine**: Integrates the 8 standard solubility rules (Brown/LeMay chemistry textbook) to predict whether products stay dissolved or precipitate out.
*   **Rich Visual Effects (VFX)**:
    *   **Precipitates**: Colorful dodecahedron particles fall and physically settle at the bottom of the beaker.
    *   **Vapor & Effervescence**: Gaseous emissions drift out of containers, and liquids bubble dynamically.
    *   **Thermal Shock**: Beakers have a 15% chance of shattering into 3D glass shards when subjected to thermal shock (exceeding $80^\circ\text{C}$ in a single tick).
*   **Synthesized Sound Effects**: Operates a Web Audio API-synthesized sound manager to generate realistic bubbling, fizzing, pouring, and breaking noises.

### 3. 🧬 3D Molecule Layout Engine & Viewer
*   **Formula Parser**: Reads complex chemical formulas, including nested parentheses (e.g., $\text{Ca(OH)}_2$) and hydrates (e.g., $\text{CuSO}_4\cdot5\text{H}_2\text{O}$).
*   **3D Geometry Solver**: Computes spatial atomic coordinates dynamically based on molecular geometries (Linear, Trigonal Planar, Tetrahedral, Octahedral, or Fibonacci sphere distributions) and displays them in a Ball-and-Stick or Space-Fill modal.

### 4. 📊 Physical Chemistry Simulators
*   **Kinetics Explorer**: A 2D particle collision simulation demonstrating collision theory. Users can adjust concentration, activation energy ($E_a$), temperature, and catalysts to observe real-time Arrhenius rate constant ($k$) charts and half-lives.
*   **Titration Simulator**: Simulates strong/weak acid-base titrations with universal indicator color transitions, equivalence volume calculators ($V_{eq}$), and dynamic titration curve graphing.

---

## 🛠️ Project Architecture

```
MolecularSandbox/
├── prisma/                   # Database schemas (SQLite) and seed datasets
├── public/                   # Static application assets
├── src/
│   ├── app/                  # Next.js Pages Router & Global Styles
│   │   ├── api/              # API endpoints for chemicals, reactions, saves, and AI assistant
│   │   ├── globals.css       # Core design system and CSS animations
│   │   └── page.tsx          # Lab control cockpit interface
│   ├── components/
│   │   ├── lab/              # Three.js / R3F 3D Lab bench, vessels, and props
│   │   ├── molecule/         # 3D Molecule Viewer Modal elements
│   │   └── ui-panels/        # Chemistry control widgets (Shelf, Kinetics, Titration, periodic table)
│   ├── hooks/                # React utility hooks
│   └── lib/
│       ├── chemistry/        # Engine core, solubility engine, stoichiometry, presets
│       ├── sound/            # Web Audio API Sound manager
│       └── store/            # Zustand global state store
└── package.json              # Project configuration and dependency manifest
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have [Bun](https://bun.sh/) or [Node.js](https://nodejs.org/) installed.

### 📦 Installation
1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/onlykushalll/MolecularSandbox.git
   cd MolecularSandbox
   ```
2. Install the package dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

### 🗄️ Database Setup
Initialize the database schemas and seed the SQLite file (preloaded with 61 chemicals and 28 reactions):
```bash
bun run db:push
bun run db:seed
# or
npx prisma db push
npx prisma db seed
```

### 💻 Running Locally
Launch the local development server:
```bash
bun run dev
# or
npm run dev
```
Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## 🔒 Safety & Educational Use
This application is strictly designed for **educational purposes and virtual chemistry simulations**. It should never be used as a replacement for real laboratory safety protocols, physical equipment training, or professional chemical instruction. Please refer to [DISCLAIMER.md](DISCLAIMER.md) for further terms.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
