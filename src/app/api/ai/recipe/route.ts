import { groq } from '@/lib/groq';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { dish, cuisine } = await req.json();

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a professional chef and recipe creator. Generate a detailed recipe for the given dish.

Return ONLY a JSON object:
{
  "name": "Full dish name",
  "prepTime": "X minutes",
  "cookTime": "X minutes",
  "servings": number,
  "calories": number (per serving),
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
  "steps": ["Step 1 detailed instruction", "Step 2 detailed instruction"],
  "tips": "A pro cooking tip for this dish"
}

Make it authentic to ${cuisine || 'the given'} cuisine. Include exact measurements.`,
        },
        {
          role: 'user',
          content: `Generate a detailed recipe for: ${dish}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return NextResponse.json(data);
  } catch (error) {
    console.error('Recipe generation error:', error);
    return NextResponse.json({ error: 'Failed to generate recipe' }, { status: 500 });
  }
}
