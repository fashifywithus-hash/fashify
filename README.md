# Fashify - AI-Powered Fashion Recommendation System

Fashify is an intelligent fashion recommendation platform that matches clothing items from inventory with user preferences using a sophisticated scoring algorithm.

## 🚀 Features

- **Personalized Recommendations**: Get top 4 items from each category (Shirts, Jackets, Jeans, Shoes) based on your preferences
- **Smart Scoring Engine**: Multi-factor matching algorithm considering:
  - Gender compatibility
  - Weather suitability (1 = hot, 5 = very cold)
  - Lifestyle match (Formal, Casual, Athletic)
  - Body type fit
  - Style preferences
  - Skin tone compatibility
- **User Onboarding**: Comprehensive preference collection through an intuitive multi-step flow
- **Real-time Matching**: Instant recommendations based on your profile

## 📋 Prerequisites

- Node.js 18+ and npm (or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Supabase account (for user authentication and profile storage)

## 🛠️ Installation & Setup

### 1. Clone the repository

```sh
git clone <YOUR_GIT_URL>
cd fashify
```

### 2. Install dependencies

```sh
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 4. Set up the inventory CSV

Ensure your inventory CSV file is located at `public/Backend/Item-attributes.csv`. The CSV should have the following columns:

- Description, Category, Type, Color, Item Link, StyleId
- Main_Category, Sub_Category, Gender
- Base_Color, Color_Family
- Weather_Min, Weather_Max (1 = hot, 5 = very cold)
- Style_Tags (JSON array)
- Lifestyle_Tags (JSON array)
- Body_Type_Fit, Skin_Undertone
- Formality_Score, Layer_Level

### 5. Run the development server

```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## 📁 Project Structure

```
fashify/
├── src/
│   ├── components/
│   │   ├── onboarding/          # Onboarding step components
│   │   ├── recommendations/     # Recommendation display components
│   │   └── ui/                   # shadcn-ui components
│   ├── hooks/                    # Custom React hooks
│   ├── integrations/
│   │   └── supabase/             # Supabase client configuration
│   ├── lib/
│   │   ├── csvParser.ts          # CSV parsing utility
│   │   ├── scoringEngine.ts     # Scoring algorithm implementation
│   │   └── utils.ts              # Utility functions
│   ├── pages/                    # Page components
│   ├── services/
│   │   └── recommendationService.ts  # Main recommendation service
│   └── types/
│       └── inventory.ts          # TypeScript type definitions
├── public/
│   └── Backend/
│       └── Item-attributes.csv   # Inventory data
└── supabase/
    └── migrations/                # Database migrations
```

## 🧠 How the Recommendation System Works

### Scoring Algorithm

The scoring engine uses a weighted multi-factor matching system:

1. **Gender Match** (Weight: 1.0)
   - Exact match required (or unisex items)
   - Score: 1.0 for match, 0.0 for mismatch

2. **Weather Match** (Weight: 0.25)
   - Converts user slider (0-100) to item scale (1-5)
   - Perfect match if within item's weather range
   - Penalty for distance outside range

3. **Lifestyle Match** (Weight: 0.20)
   - Exact match: 1.0
   - Compatible matches (e.g., casual ↔ formal): 0.5-0.7
   - No match: 0.2

4. **Body Type Match** (Weight: 0.15)
   - Exact match: 1.0
   - Similar body types: 0.7
   - Average fit works for all: 1.0

5. **Style Match** (Weight: 0.25)
   - Calculates percentage of user styles that match item styles
   - Bonus for multiple style matches

6. **Skin Tone Match** (Weight: 0.15)
   - Exact undertone match: 1.0
   - Neutral works with both: 0.8
   - Mismatch: 0.5

### Final Score Calculation

```
Total Score = (gender × 1.0) + (weather × 0.25) + (lifestyle × 0.20) + 
              (bodyType × 0.15) + (style × 0.25) + (skinTone × 0.15)
```

Items are sorted by score (descending) and top 4 from each category are selected.

## 🎨 User Preferences

The system collects the following preferences during onboarding:

- **Gender**: Male, Female
- **Weather**: Slider from "Extremely Cold" (0) to "Very Hot" (100)
- **Lifestyle**: Formal, Casual, Athletic
- **Body Type**: Slim, Athletic, Average, Muscular, Curvy, Plus Size
- **Height**: 140-200 cm slider
- **Skin Tone**: Dark to Light slider (0-100)
- **Style Preferences**: Streetwear, Minimal, Classic, Trendy, Smart Casual, Party

## 🔧 Key Components

### ScoringEngine (`src/lib/scoringEngine.ts`)

The core matching algorithm that calculates compatibility scores between user preferences and inventory items.

```typescript
const engine = new ScoringEngine();
const scoredItems = engine.scoreItems(inventory, userPreferences);
```

### RecommendationService (`src/services/recommendationService.ts`)

Main service that orchestrates loading inventory, scoring items, and returning top recommendations.

```typescript
import { recommendationService } from "@/services/recommendationService";

const recommendations = await recommendationService.getRecommendations(userPreferences);
// Returns: { shirts, jackets, jeans, shoes }
```

### CSV Parser (`src/lib/csvParser.ts`)

Utility to parse and normalize inventory data from CSV format.

## 🧪 Testing

Run tests with:

```sh
npm test
```

Watch mode:

```sh
npm run test:watch
```

## 📦 Building for Production

```sh
npm run build
```

Preview production build:

```sh
npm run preview
```

## 🚢 Deployment

The project can be deployed to any static hosting service:

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Ensure environment variables are configured in your hosting platform

## 🔐 Database Schema

The application uses Supabase with the following main table:

**profiles**
- `user_id` (UUID, unique)
- `name` (TEXT)
- `gender` (TEXT)
- `weather_preference` (INTEGER, 0-100)
- `lifestyle` (TEXT)
- `body_type` (TEXT)
- `height` (INTEGER, 140-200)
- `skin_tone` (INTEGER, 0-100)
- `preferred_styles` (TEXT[])
- `photo_url` (TEXT)

## 📝 Adding New Inventory Items

1. Update `public/Backend/Item-attributes.csv` with new items
2. Ensure all required columns are present
3. Style_Tags and Lifestyle_Tags should be JSON arrays
4. Weather values: 1 = hot, 5 = very cold
5. The system will automatically load new items on next recommendation request

## 🎯 Future Enhancements

- [ ] Image optimization and CDN integration
- [ ] Advanced filtering options
- [ ] Outfit combination recommendations
- [ ] Price range filtering
- [ ] User feedback integration for improved scoring
- [ ] Machine learning model for personalized weight adjustments

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For questions or issues, please contact the project maintainers.

---

Built with ❤️ using React, TypeScript, and Vite
