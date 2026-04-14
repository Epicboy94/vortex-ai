export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): { label: string; color: string; description: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: '#60a5fa', description: 'You may need to gain some weight. Consult a nutritionist.' };
  if (bmi < 25) return { label: 'Normal', color: '#34d399', description: 'Great job! You are at a healthy weight.' };
  if (bmi < 30) return { label: 'Overweight', color: '#fbbf24', description: 'Consider a balanced diet and regular exercise.' };
  if (bmi < 35) return { label: 'Obese Class I', color: '#f97316', description: 'Moderate risk. A structured fitness plan is recommended.' };
  if (bmi < 40) return { label: 'Obese Class II', color: '#ef4444', description: 'High risk. Please consult a healthcare provider.' };
  return { label: 'Obese Class III', color: '#dc2626', description: 'Very high risk. Immediate medical consultation recommended.' };
}

export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: string): number {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  }
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.2));
}

export function calculateTargetBurn(calorieIntake: number): number {
  return Math.round(calorieIntake * 0.5);
}

// Adjust TDEE based on fitness goal
export function adjustTDEEForGoal(tdee: number, goal: string): number {
  switch (goal) {
    case 'lose_weight':
      return Math.round(tdee - 500);  // Caloric deficit
    case 'build_muscle':
      return Math.round(tdee + 300);  // Caloric surplus
    case 'be_healthy':
    default:
      return tdee;  // Maintenance
  }
}

// Calculate metabolic burn for hours elapsed today
export function calculateMetabolicBurn(bmr: number, hoursElapsed: number): number {
  return Math.round((bmr / 24) * hoursElapsed);
}

// Calculate net calories: Eaten - (Workout Burn + Metabolic Burn)
export function calculateNetCalories(
  caloriesEaten: number,
  workoutBurn: number,
  bmr: number,
  hoursElapsed: number
): number {
  const metabolicBurn = calculateMetabolicBurn(bmr, hoursElapsed);
  return Math.round(caloriesEaten - workoutBurn - metabolicBurn);
}

// Get hours elapsed since midnight
export function getHoursElapsedToday(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}
