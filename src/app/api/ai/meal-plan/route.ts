import { groq } from '@/lib/groq';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { cuisine, dietType, meats, allergies, profile } = await req.json();

    const allergyText = allergies?.length > 0 ? `CRITICAL: User is allergic to: ${allergies.join(', ')}. NEVER include these ingredients.` : 'No known allergies.';
    const meatText = dietType === 'nonveg' && meats?.length > 0
      ? `Preferred meats: ${meats.join(', ')}. Only use these meat types.`
      : '';

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a world-class nutritionist and chef. Generate a SINGLE DAY meal plan (NOT a 7-day plan).

IMPORTANT RULES:
- Cuisine: ${cuisine}
- Diet: ${dietType === 'veg' ? 'Strictly Vegetarian (no meat, no fish, no eggs if Indian)' : 'Non-Vegetarian'}
${meatText}
${allergyText}
- Target daily calories: ${profile?.tdee || 2000} kcal
- Each meal should be nutritious, balanced, and UNIQUE
- Use authentic ${cuisine} dishes — NO generic descriptions
- Include SPECIFIC dish names with brief cooking method descriptions
- VARY cooking methods: grilled, steamed, sautéed, baked, raw, stir-fried, slow-cooked, roasted
- Include exact portion sizes and calorie estimates per meal
- Make snacks interesting, not just "fruit" — include unique regional snacks
- NEVER use generic items like "mixed vegetables" — be specific with ingredients
- Include a pre-workout and post-workout snack option

Return ONLY a JSON object:
{
  "meals": {
    "breakfast": {
      "name": "Specific dish name",
      "description": "Brief appetizing description with cooking method",
      "calories": estimated_number,
      "ingredients": ["key ingredient 1", "key ingredient 2", "key ingredient 3"]
    },
    "morning_snack": {
      "name": "Specific snack",
      "description": "Brief description",
      "calories": estimated_number,
      "ingredients": ["ingredient 1", "ingredient 2"]
    },
    "lunch": {
      "name": "Specific dish name",
      "description": "Brief appetizing description with cooking method",
      "calories": estimated_number,
      "ingredients": ["key ingredient 1", "key ingredient 2", "key ingredient 3"]
    },
    "evening_snack": {
      "name": "Specific snack",
      "description": "Brief description",
      "calories": estimated_number,
      "ingredients": ["ingredient 1", "ingredient 2"]
    },
    "dinner": {
      "name": "Specific dish name",
      "description": "Brief appetizing description with cooking method",
      "calories": estimated_number,
      "ingredients": ["key ingredient 1", "key ingredient 2", "key ingredient 3"]
    }
  },
  "totalCalories": total_estimated_number,
  "nutritionTip": "A specific nutrition tip for this meal plan"
}`,
        },
        {
          role: 'user',
          content: `Generate a 1-day ${cuisine} ${dietType} meal plan. User: ${profile?.weight}kg, ${profile?.age} years, goal: ${profile?.fitness_goal || 'be_healthy'}.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { meals: {} };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Meal plan error:', error);
    return NextResponse.json({ meals: {} });
  }
}
