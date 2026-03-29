import type { QuizAnswers } from './types.js';

export function generateTags(answers: QuizAnswers): string[] {
  const tags: string[] = [];

  const wake = Number(answers['q3'] ?? 7.5);
  if (wake <= 6.5) tags.push('Early bird 🌅');
  else if (wake >= 9) tags.push('Night owl 🦉');
  else tags.push('Mid-morning riser');

  const social = Number(answers['q20'] ?? 2);
  if (social >= 5) tags.push('Social butterfly 🦋');
  else if (social <= 1) tags.push('Home is sanctuary 🏡');

  const personality = Number(answers['q24'] ?? 2);
  if (personality <= 1) tags.push('Introvert 🎧');
  else if (personality >= 5) tags.push('Extrovert 🎉');
  else tags.push('Ambivert');

  const diet = Number(answers['q33']);
  const dietLabels: Record<number, string> = {
    1: 'Strict Jain 🙏', 2: 'Strict Veg 🥦',
    3: 'Veg + Eggs 🥚', 4: 'Non-veg (no beef) 🍗', 5: 'All non-veg 🍖',
  };
  if (dietLabels[diet]) tags.push(dietLabels[diet]);

  const cleanSelf = Number(answers['q7']);
  if (cleanSelf === 1) tags.push('Super tidy ✨');
  else if (cleanSelf >= 4) tags.push('Relaxed about mess');

  const finStyle = Number(answers['q15']);
  if (finStyle === 1) tags.push('Splitwise obsessed 📊');
  else if (finStyle === 5) tags.push('Flexible about money');

  return tags.slice(0, 5);
}

export function selfInsightNote(answers: QuizAnswers): string {
  const conflict = Number(answers['q27']);
  const clean = Number(answers['q7']);
  const guests = Number(answers['q20']);
  const bedtime = Number(answers['q4']);
  const wake = Number(answers['q3']);

  if (conflict >= 3) {
    return "Your indirect conflict style may create unresolved friction — flatmates may not realize something is bothering you until it's too late.";
  }
  if (clean >= 4) {
    return "You describe yourself as relaxed about cleanliness — this is the #1 source of flatmate conflict. Be very honest about this upfront.";
  }
  if (guests >= 5) {
    return "You love having guests frequently — make this very clear to potential flatmates before moving in.";
  }
  if (bedtime >= 26 && wake >= 9) {
    return "Night owl with late mornings — you'll match best with similar schedules. Avoid early birds unless you're disciplined about noise after midnight.";
  }
  return "Your profile looks well-balanced — you've answered honestly and your lifestyle preferences are clear. Good things ahead.";
}

export function generateConversationPrompts(
  flags: Array<{ type: string; dim: string }>,
  _userName: string,
): Array<{ dim: string; color: string; prompt: string }> {
  const PROMPTS_BY_DIM: Record<string, string> = {
    clean: 'Ask them: "What does \'clean kitchen\' mean to you — after every use, or once a day?" and "Who initiates bathroom cleaning in your experience?"',
    sleep: 'Ask them: "What\'s the latest you play music or take calls? What are your weekend mornings like?"',
    finance: 'Ask them: "Are you comfortable with tracking shared expenses or do you prefer one person tracks and settles monthly?"',
    social: 'Ask them: "How many nights a week do you typically have friends over? What advance notice do you expect?"',
    conflict: 'Ask them: "If something I do bothers you, how would you prefer to bring it up?"',
    privacy: 'Ask them: "What\'s your approach to borrowing personal items or entering each other\'s rooms?"',
    culture: 'Ask them: "How do you feel about cooking smells in the flat? Any kitchen rules I should know about upfront?"',
    lifestyle: 'Ask them: "What do your weekday mornings look like? Do you work from home?"',
    personality: 'Ask them: "Are you someone who needs the flat to be quiet most of the time, or do you like noise and energy around?"',
  };

  return flags
    .slice(0, 4)
    .filter(f => PROMPTS_BY_DIM[f.dim])
    .map(f => ({ dim: f.dim, color: f.type, prompt: PROMPTS_BY_DIM[f.dim] }));
}
