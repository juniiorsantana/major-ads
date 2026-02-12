# Tech Stack

Documentation of the technology stack used in this project.

## Frontend

### Core
- **Framework**: React 19 (`^19.2.4`)
- **Language**: TypeScript (`~5.8.2`)
- **Build Tool**: Vite (`^6.2.0`)
- **Routing**: React Router DOM (`^7.13.0`)
- **State Management**: Zustand (`^5.0.11`)

### Data Fetching
- **Library**: TanStack Query (React Query) (`^5.90.20`)
- **SDK**: Supabase JS (`^2.95.3`)

### Styling & UI
- **CSS Framework**: Tailwind CSS 4 (`^4.1.18`)
- **Preprocessor**: PostCSS (`^8.5.6`)
- **Icons**: Lucide React (`^0.563.0`)
- **Charts**: Recharts (`^3.7.0`)

## Backend & Services

### Infrastructure (BaaS)
- **Provider**: Supabase
- **Features**:
  - Authentication
  - PostgreSQL Database
  - Edge Functions (Deno runtime)
  - Storage

### Artificial Intelligence
- **LLM**: Google Generative AI (`@google/genai` `^1.40.0`)

## Development Tools

- **Local Server**: Vite Dev Server
- **Package Manager**: npm (implied by `package-lock.json`)
- **plugins**:
  - `@vitejs/plugin-react` (`^5.0.0`)
  - `@vitejs/plugin-basic-ssl` (`^2.1.4`)
