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
          content: `You are a professional nutritionist and meal planner. Generate a 7-day meal plan.
          
Rules:
- Cuisine: ${cuisine}
- Diet: ${dietType === 'veg' ? 'Strictly Vegetarian (no meat, no fish, no eggs if Indian)' : 'Non-Vegetarian'}
${meatText}
${allergyText}
- Target daily calories: ${profile?.tdee || 2000} kcal
- Each meal should be nutritious and balanced
- Use authentic ${cuisine} dishes and ingredients
- Include specific dish names, not generic descriptions

Return ONLY a JSON object:
{
  "mealPlan": [
    {
      "day": "Monday",
      "breakfast": "Specific dish name with brief description",
      "lunch": "Specific dish name with brief description",
      "snack": "Specific snack",
      "dinner": "Specific dish name with brief description"
    }
  ]
}
Include all 7 days (Monday through Sunday).`,
        },
        {
          role: 'user',
          content: `Generate a 7-day ${cuisine} ${dietType} meal plan. User: ${profile?.weight}kg, ${profile?.age} years.`,
        },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { mealPlan: [] };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Meal plan error:', error);
    return NextResponse.json({ mealPlan: [] });
  }
}
