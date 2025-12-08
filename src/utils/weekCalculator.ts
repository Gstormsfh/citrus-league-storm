import { League } from '@/services/LeagueService';

/**
 * Get the date when the draft was completed
 * Uses the league's updated_at timestamp when draft_status is 'completed'
 */
export function getDraftCompletionDate(league: League): Date | null {
  if (league.draft_status !== 'completed') {
    return null;
  }
  return new Date(league.updated_at);
}

/**
 * Get the Monday of the first week after draft completion
 * If draft completes on Monday, that Monday is the start
 * Otherwise, it's the next Monday
 */
export function getFirstWeekStartDate(draftCompletionDate: Date): Date {
  const date = new Date(draftCompletionDate);
  date.setHours(0, 0, 0, 0);
  
  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getDay();
  
  // Calculate days to add to get to Monday
  // If it's Monday (1), add 0 days
  // If it's Sunday (0), add 1 day
  // Otherwise, add (8 - dayOfWeek) days to get to next Monday
  const daysToAdd = dayOfWeek === 1 ? 0 : (dayOfWeek === 0 ? 1 : (8 - dayOfWeek));
  
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

/**
 * Get the Monday date for a given week number (1-based)
 */
export function getWeekStartDate(weekNumber: number, firstWeekStart: Date): Date {
  const date = new Date(firstWeekStart);
  const daysToAdd = (weekNumber - 1) * 7;
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

/**
 * Get the Sunday date for a given week number (1-based)
 */
export function getWeekEndDate(weekNumber: number, firstWeekStart: Date): Date {
  const startDate = getWeekStartDate(weekNumber, firstWeekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6); // Sunday is 6 days after Monday
  return endDate;
}

/**
 * Get the current week number (1-based) based on the first week start date
 */
export function getCurrentWeekNumber(firstWeekStart: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const firstWeek = new Date(firstWeekStart);
  firstWeek.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = today.getTime() - firstWeek.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate week number (1-based)
  const weekNumber = Math.floor(diffDays / 7) + 1;
  
  // Return at least week 1
  return Math.max(1, weekNumber);
}

/**
 * Get available weeks from first week until end of year, excluding last 3 weeks (playoffs)
 */
export function getAvailableWeeks(firstWeekStart: Date, currentYear: number): number[] {
  const weeks: number[] = [];
  
  // Get the last day of the year (December 31)
  const yearEnd = new Date(currentYear, 11, 31); // Month 11 = December
  yearEnd.setHours(23, 59, 59, 999);
  
  // Calculate how many weeks from first week to year end
  const diffTime = yearEnd.getTime() - firstWeekStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(diffDays / 7) + 1;
  
  // Exclude last 3 weeks for playoffs
  const regularSeasonWeeks = Math.max(1, totalWeeks - 3);
  
  // Generate week numbers from 1 to regularSeasonWeeks
  for (let i = 1; i <= regularSeasonWeeks; i++) {
    weeks.push(i);
  }
  
  return weeks;
}

/**
 * Get formatted week label like "Week 1 • Jan 6-12"
 */
export function getWeekLabel(weekNumber: number, firstWeekStart: Date): string {
  const startDate = getWeekStartDate(weekNumber, firstWeekStart);
  const endDate = getWeekEndDate(weekNumber, firstWeekStart);
  
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const endDay = endDate.getDate();
  
  // If same month, show "Jan 6-12", otherwise "Jan 31 - Feb 6"
  if (startMonth === endMonth) {
    return `Week ${weekNumber} • ${startMonth} ${startDay}-${endDay}`;
  } else {
    return `Week ${weekNumber} • ${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}
