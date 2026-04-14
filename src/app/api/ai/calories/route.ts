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
          content: `You are a professional nutritionist. Estimate calories and macronutrients for the given food item. 
Consider typical Indian/Asian portion sizes if cuisine seems South Asian.
Return ONLY a JSON object with these fields (numbers only, no units):
{"calories": number, "protein": number, "carbs": number, "fat": number}
Be as accurate as possible based on standard nutritional databases.
If multiple items are mentioned, sum them all up.`,
        },
        {
          role: 'user',
          content: `Estimate nutrition for: ${food}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Calorie estimation error:', error);
    return NextResponse.json({ calories: 200, protein: 10, carbs: 25, fat: 8 });
  }
}
