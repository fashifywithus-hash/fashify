"use strict";
/**
 * Scoring Engine for matching user preferences with inventory items
 * BACKEND LOGIC - Core scoring algorithm
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringEngine = void 0;
class ScoringEngine {
    /**
     * Calculate match score for an item based on user preferences
     */
    calculateScore(item, preferences) {
        const matchDetails = {
            genderMatch: this.matchGender(item, preferences),
            weatherMatch: this.matchWeather(item, preferences),
            lifestyleMatch: this.matchLifestyle(item, preferences),
            bodyTypeMatch: this.matchBodyType(item, preferences),
            styleMatch: this.matchStyle(item, preferences),
            skinToneMatch: this.matchSkinTone(item, preferences),
        };
        // Weighted scoring system
        const weights = {
            gender: 1.0, // Must match (0 or 1) - but we'll still show items even with low scores
            weather: 0.25, // Important but flexible
            lifestyle: 0.20, // Important
            bodyType: 0.15, // Important for fit
            style: 0.25, // Important for preference
            skinTone: 0.15, // Nice to have
        };
        // Calculate score even for gender mismatches (will be filtered later but scored for comparison)
        // This ensures we can still show items if needed
        // Calculate base score (even if gender doesn't match, we still give partial credit)
        // Gender mismatch reduces score but doesn't zero it completely
        const baseScore = matchDetails.genderMatch * weights.gender +
            matchDetails.weatherMatch * weights.weather +
            matchDetails.lifestyleMatch * weights.lifestyle +
            matchDetails.bodyTypeMatch * weights.bodyType +
            matchDetails.styleMatch * weights.style +
            matchDetails.skinToneMatch * weights.skinTone;
        // If gender doesn't match, heavily penalize but don't zero it
        // This way we can still show items if no matches exist
        const finalScore = matchDetails.genderMatch === 0
            ? baseScore * 0.1 // 10% of score for gender mismatches (very low but not zero)
            : baseScore;
        return {
            ...item,
            score: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
            matchDetails,
        };
    }
    /**
     * Match gender (exact match required)
     */
    matchGender(item, preferences) {
        const itemGender = (item.gender || "").toLowerCase().trim();
        const userGender = (preferences.gender || "").toLowerCase().trim();
        // Handle unisex items
        if (itemGender === "unisex") {
            return 1.0;
        }
        // Exact match
        if (itemGender === userGender && itemGender !== "") {
            return 1.0;
        }
        // If no match, return 0 (will filter out this item)
        if (itemGender !== "" && userGender !== "") {
            console.debug(`Gender mismatch: item="${itemGender}", user="${userGender}"`);
        }
        return 0;
    }
    /**
     * Match weather preference
     * User weather: 0-100 slider (0 = extremely cold, 100 = very hot)
     * Item weather: 1-5 scale (1 = hot, 5 = very cold)
     */
    matchWeather(item, preferences) {
        // Convert user slider (0-100) to item scale (1-5)
        // 0 (extremely cold) -> 5, 100 (very hot) -> 1
        const userWeatherScale = 5 - (preferences.weather / 100) * 4;
        // Check if user weather falls within item's range
        if (userWeatherScale >= item.weatherMin && userWeatherScale <= item.weatherMax) {
            return 1.0; // Perfect match
        }
        // Calculate distance from range
        let distance = 0;
        if (userWeatherScale < item.weatherMin) {
            distance = item.weatherMin - userWeatherScale;
        }
        else {
            distance = userWeatherScale - item.weatherMax;
        }
        // Normalize distance (max distance is 4, so divide by 4)
        const normalizedDistance = Math.min(distance / 4, 1);
        // Return score (closer = higher score)
        return Math.max(0, 1 - normalizedDistance * 0.5); // Penalize up to 50% for distance
    }
    /**
     * Match lifestyle preference
     */
    matchLifestyle(item, preferences) {
        const userLifestyle = preferences.lifestyle.toLowerCase();
        const itemLifestyles = item.lifestyleTags.map(tag => tag.toLowerCase());
        // Exact match
        if (itemLifestyles.includes(userLifestyle)) {
            return 1.0;
        }
        // Partial matches (e.g., casual items might work for formal in some cases)
        if (userLifestyle === "formal" && itemLifestyles.includes("casual")) {
            return 0.5; // Formal users might accept smart casual
        }
        if (userLifestyle === "casual" && itemLifestyles.includes("formal")) {
            return 0.6; // Casual users might accept formal items
        }
        if (userLifestyle === "athletic" && itemLifestyles.includes("casual")) {
            return 0.7; // Athletic users might accept casual items
        }
        return 0.2; // Low score for no match
    }
    /**
     * Match body type
     */
    matchBodyType(item, preferences) {
        const itemBodyType = item.bodyTypeFit.toLowerCase();
        const userBodyType = preferences.bodyType.toLowerCase();
        // Exact match
        if (itemBodyType === userBodyType || itemBodyType === "average") {
            return 1.0;
        }
        // Similar body types get partial scores
        const bodyTypeSimilarity = {
            slim: ["athletic", "average"],
            athletic: ["slim", "muscular", "average"],
            muscular: ["athletic", "average"],
            average: ["slim", "athletic", "muscular", "curvy"],
            curvy: ["average", "plus"],
            plus: ["curvy", "average"],
        };
        const similarTypes = bodyTypeSimilarity[userBodyType] || [];
        if (similarTypes.includes(itemBodyType)) {
            return 0.7;
        }
        return 0.4; // Lower score for less similar types
    }
    /**
     * Match style preferences
     */
    matchStyle(item, preferences) {
        if (preferences.styles.length === 0) {
            return 0.5; // Neutral score if no styles selected
        }
        const itemStyles = item.styleTags.map(tag => tag.toLowerCase());
        const userStyles = preferences.styles.map(style => style.toLowerCase());
        // Count matching styles
        const matches = userStyles.filter(userStyle => itemStyles.some(itemStyle => {
            // Handle variations
            if (userStyle === "smart-casual" && itemStyle.includes("smart")) {
                return true;
            }
            return itemStyle === userStyle || itemStyle.includes(userStyle);
        }));
        if (matches.length === 0) {
            return 0.2; // Low score for no matches
        }
        // Score based on percentage of user styles that match
        const matchRatio = matches.length / userStyles.length;
        // Bonus if multiple styles match
        const bonus = matches.length > 1 ? 0.1 : 0;
        return Math.min(1.0, matchRatio + bonus);
    }
    /**
     * Match skin tone/undertone
     */
    matchSkinTone(item, preferences) {
        // Convert user skin tone slider (0-100) to undertone
        // 0-33 = Cool, 34-66 = Neutral, 67-100 = Warm
        let userUndertone = "neutral";
        if (preferences.skinTone < 34) {
            userUndertone = "cool";
        }
        else if (preferences.skinTone > 66) {
            userUndertone = "warm";
        }
        const itemUndertone = item.skinUndertone.toLowerCase();
        // Exact match
        if (itemUndertone === userUndertone) {
            return 1.0;
        }
        // Neutral works with both
        if (itemUndertone === "neutral" || userUndertone === "neutral") {
            return 0.8;
        }
        // Mismatch
        return 0.5;
    }
    /**
     * Score all items and return sorted by score
     * ALWAYS returns items sorted by score, even if score is very low
     * This ensures we can always show recommendations as long as items exist
     */
    scoreItems(items, preferences) {
        // Score all items (including gender mismatches - they get very low scores)
        const scored = items.map(item => this.calculateScore(item, preferences));
        // Separate items by gender match for logging
        const genderMatched = scored.filter(item => item.matchDetails.genderMatch > 0);
        const genderMismatched = scored.filter(item => item.matchDetails.genderMatch === 0);
        // Log debugging info
        console.log(`Scoring: ${genderMatched.length} items with gender match, ${genderMismatched.length} with gender mismatch (low scores)`);
        // ALWAYS return ALL items sorted by score (descending)
        // Even gender mismatches are included (they have very low scores ~10% of normal)
        // This ensures we can always show recommendations
        const sorted = scored.sort((a, b) => b.score - a.score);
        // Log score distribution
        if (sorted.length > 0) {
            const maxScore = sorted[0].score;
            const minScore = sorted[sorted.length - 1].score;
            console.log(`Score range: ${maxScore.toFixed(2)} (best) to ${minScore.toFixed(2)} (worst)`);
        }
        return sorted;
    }
}
exports.ScoringEngine = ScoringEngine;
