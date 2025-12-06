# FinBoard

Customizable finance dashboard for tracking stocks, crypto, forex, and other financial data from any REST API.

## Features

- Connect to any REST API and display data as cards, tables, or charts
- Drag & drop to rearrange widgets
- Real-time updates with configurable refresh intervals
- Data caching and rate limit handling
- Pre-built templates for common use cases
- Export/import dashboard configurations
- Dark/Light theme support
- Responsive design

## Getting Started

```bash
git clone https://github.com/yourusername/finboard.git
cd finboard
npm install
npm run dev
```

Open http://localhost:3000

## Tech Stack

Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Zustand, @dnd-kit, Recharts

## Usage

Click "Add Widget" to connect a REST API, test the connection, select fields, and choose how to display the data. Widgets can be dragged to reorder, edited, or deleted.

Use templates for quick setup with crypto, forex, or market data. Export/import dashboards to backup or share configurations.

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - Lint code

## License

MIT
