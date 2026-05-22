import { groq } from '@/lib/groq';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { food } = await req.json();

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a clinical nutritionist with access to USDA and IFCT food databases.
Analyze the user's food input and break it down into INDIVIDUAL food items.
The input may contain multiple foods separated by commas, 'and', or described in a sentence.

For EACH food item, estimate its nutritional values based on standard serving sizes.
Consider typical Indian/Asian portion sizes if cuisine seems South Asian.

Return ONLY a JSON object in this exact format (numbers only, no units):
{
  "items": [
    {
      "name": "Food item name with portion",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "sugar": number,
      "sodium": number
    }
  ],
  "totals": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number,
    "sodium": number
  }
}

Rules:
- Always split into individual items, even if user writes them as one sentence
- Include portion size in the item name (e.g. "Rice (1 bowl)", "Chapati (2 pcs)")
- sodium is in milligrams, everything else in grams except calories
- Be as scientifically accurate as possible using standard nutritional databases
- The totals MUST be the exact sum of all items`,
        },
        {
          role: 'user',
          content: `Break down and estimate nutrition for each item: ${food}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [], totals: {} };

    // Ensure we always have the correct structure
    if (!data.items || !Array.isArray(data.items)) {
      const single = {
        name: food,
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        fiber: data.fiber || 0,
        sugar: data.sugar || 0,
        sodium: data.sodium || 0,
      };
      return NextResponse.json({
        items: [single],
        totals: { ...single },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Calorie estimation error:', error);
    return NextResponse.json({
      items: [{ name: 'Estimated meal', calories: 200, protein: 10, carbs: 25, fat: 8, fiber: 3, sugar: 2, sodium: 300 }],
      totals: { calories: 200, protein: 10, carbs: 25, fat: 8, fiber: 3, sugar: 2, sodium: 300 },
    });
  }
}
