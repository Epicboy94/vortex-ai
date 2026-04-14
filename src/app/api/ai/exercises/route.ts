import { groq } from '@/lib/groq';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { targetBurn, profile } = await req.json();

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a certified fitness trainer. Generate a workout plan to burn approximately ${targetBurn} calories.
Consider the user's profile for appropriate exercise difficulty.
Return ONLY a JSON object with an "exercises" array. Each exercise should have:
{
  "exercises": [
    {
      "name": "Exercise Name",
      "duration": "X minutes",
      "calories_burn": number,
      "instructions": "Brief clear instructions (1-2 sentences)",
      "intensity": "Low|Medium|High|Extreme"
    }
  ]
}
Include 5-7 exercises. Make sure total calories_burn approximately equals ${targetBurn}.
Mix cardio, strength, and flexibility exercises.
All exercises should be doable at home or gym.`,
        },
        {
          role: 'user',
          content: `Generate workout for: Weight ${profile.weight}kg, Height ${profile.height}cm, Age ${profile.age}, Gender ${profile.gender}, Activity level ${profile.activity_level}. Target burn: ${targetBurn} calories.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { exercises: [] };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Exercise generation error:', error);
    return NextResponse.json({
      exercises: [
        { name: 'Jumping Jacks', duration: '5 minutes', calories_burn: 50, instructions: 'Jump while spreading arms and legs wide.', intensity: 'Medium' },
        { name: 'Push-ups', duration: '5 minutes', calories_burn: 40, instructions: 'Standard push-ups, keep body straight.', intensity: 'Medium' },
        { name: 'Squats', duration: '5 minutes', calories_burn: 45, instructions: 'Stand shoulder-width, lower hips as if sitting.', intensity: 'Medium' },
        { name: 'Plank', duration: '3 minutes', calories_burn: 25, instructions: 'Hold forearm plank position.', intensity: 'Low' },
        { name: 'Burpees', duration: '5 minutes', calories_burn: 60, instructions: 'Squat, jump back, push-up, jump forward, jump up.', intensity: 'High' },
      ],
    });
  }
}
