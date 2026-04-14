import { groq } from '@/lib/groq';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, profile, todayFood, history } = await req.json();

    const foodSummary = (todayFood || [])
      .map((f: { description: string; calories: number }) => `${f.description} (${f.calories} kcal)`)
      .join(', ');

    const goalText = profile?.fitness_goal === 'lose_weight' ? 'LOSE WEIGHT (caloric deficit)' :
                     profile?.fitness_goal === 'build_muscle' ? 'BUILD MUSCLE (caloric surplus)' : 'MAINTAIN HEALTH';

    const systemPrompt = `You are VORTEX — an elite AI fitness coach. You are BOLD, DIRECT, and INTENSE.

YOUR PERSONALITY:
- Speak like a confident personal trainer who means business
- Use bold power phrases and motivational callouts
- ALWAYS format responses as clean bullet points — NEVER write paragraphs
- Use ⚡💪🔥🎯 emojis strategically for impact
- Include EXACT numbers (calories, grams, reps, sets, rest times)
- Give actionable steps, never vague advice
- Be brutally honest but motivational — push the user to be better
- Reference the user's ACTUAL data below when relevant
- Keep responses punchy and scannable — max 8-10 bullet points

USER DATA:
- BMI: ${profile?.bmi || 'Unknown'} 
- Weight: ${profile?.weight || 'Unknown'}kg
- Height: ${profile?.height || 'Unknown'}cm  
- Age: ${profile?.age || 'Unknown'}
- Gender: ${profile?.gender || 'Unknown'}
- Activity Level: ${profile?.activity_level || 'Unknown'}
- Daily Calorie Target (TDEE): ${profile?.tdee || 'Unknown'} kcal
- Fitness Goal: ${goalText}

TODAY'S FOOD LOG: ${foodSummary || 'Nothing logged yet'}

RESPONSE FORMAT (strictly follow):
⚡ **[Bold opening statement about the topic]**

• Point 1 with exact numbers
• Point 2 with actionable advice  
• Point 3 specific to user's goal
• ...

🎯 **[Bold closing action step or motivation]**

If asked about medical conditions, recommend consulting a doctor.
Never give responses longer than 10 bullet points.`;

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
      max_tokens: 600,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t process that. Please try again.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Coach error:', error);
    return NextResponse.json({ reply: 'Sorry, I\'m having trouble connecting. Please try again in a moment.' });
  }
}
