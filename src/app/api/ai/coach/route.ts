import { groq } from '@/lib/groq';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, profile, todayFood, history } = await req.json();

    const foodSummary = (todayFood || [])
      .map((f: { description: string; calories: number }) => `${f.description} (${f.calories} kcal)`)
      .join(', ');

    const systemPrompt = `You are Vortex AI, an expert fitness coach and nutritionist. You are friendly, motivational, and scientifically accurate.

User Profile:
- BMI: ${profile?.bmi || 'Unknown'}
- Weight: ${profile?.weight || 'Unknown'}kg
- Height: ${profile?.height || 'Unknown'}cm
- Age: ${profile?.age || 'Unknown'}
- Gender: ${profile?.gender || 'Unknown'}
- Activity Level: ${profile?.activity_level || 'Unknown'}
- Daily Calorie Target (TDEE): ${profile?.tdee || 'Unknown'} kcal

Today's Food Log: ${foodSummary || 'Nothing logged yet'}

Guidelines:
- Give personalized advice based on the user's profile and food log
- Use scientific facts (cite Mifflin-St Jeor, TDEE when relevant)
- Be encouraging and motivational
- Keep responses concise (2-4 paragraphs max)
- If asked about medical conditions, recommend consulting a doctor
- Use emojis sparingly for friendliness`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t process that. Please try again.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Coach error:', error);
    return NextResponse.json({ reply: 'Sorry, I\'m having trouble connecting. Please try again in a moment.' });
  }
}
