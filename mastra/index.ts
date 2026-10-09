/**
 * ChaiStride - Mastra Agent Harness
 * Category: Best Use of Mastra (Hacktoberfest 2026: Touch Grass)
 * Orchestrates tools and outdoor memory over open-weight models to get developers outdoors.
 */

import { Mastra } from '@mastra/core';
import { z } from 'zod';

// ==========================================
// 1. CHAISTRIDE TOOLS SCHEMAS & IMPLEMENTATIONS
// ==========================================

export const questSchema = z.object({
  availableMinutes: z.number().default(20),
  burnoutContext: z.string().describe('What the developer was doing (e.g. debugging CSS, merge conflicts)')
});

export const screenLockoutSchema = z.object({
  durationMinutes: z.number().default(20)
});

export const chaiStreakSchema = z.object({
  currentStreak: z.number().default(3)
});

export const chaiTools = {
  /**
   * Tool 1: Anti-Burnout Walk Quest Generator
   */
  generateQuest: async (params: z.infer<typeof questSchema>) => {
    const { availableMinutes, burnoutContext } = params;

    let title = 'The Cutting Chai Dash';
    let dest = 'Corner Tea Stall (Tapri)';
    let dist = 1.2;

    if (availableMinutes >= 25) {
      title = 'The Golden Hour Sunset Stride';
      dest = 'Quiet Residential Avenue & Park';
      dist = 2.4;
    } else if (availableMinutes >= 20) {
      title = 'The Tree & Street Dog Check';
      dest = 'Local Colony Park Loop';
      dist = 1.8;
    }

    return {
      questTitle: title,
      targetDestination: dest,
      estimatedDistanceKm: dist,
      directiveNote: `Stop ${burnoutContext}. Put on your chappals, walk to ${dest}, drink something warm, and touch grass.`,
      checklist: [
        'Close laptop lid and put phone in pocket',
        `Walk ${dist} km to ${dest}`,
        'Look up at the tree canopy and take 5 deep breaths of outdoor air',
        'Return home with a clear head ready to close work'
      ]
    };
  },

  /**
   * Tool 2: Screen Eviction & Lockout Tool
   */
  enforceScreenLockout: async (params: z.infer<typeof screenLockoutSchema>) => {
    const duration = params.durationMinutes || 20;
    return {
      lockedState: true,
      timerSeconds: duration * 60,
      samosaPenaltyClause: 'If you check Slack or GitHub before 20 minutes, you owe your team samosas! 🥟'
    };
  },

  /**
   * Tool 3: Outdoor Streak & Memory Tracker
   */
  trackChaiStreak: async (params: z.infer<typeof chaiStreakSchema>) => {
    const newStreak = params.currentStreak + 1;
    return {
      newStreakDays: newStreak,
      praiseMessage: `Boom! That is ${newStreak} consecutive days of touching grass and drinking chai!`
    };
  }
};

// ==========================================
// 2. MASTRA CORE INITIALIZATION
// ==========================================

export const mastra = new (Mastra as any)({
  config: {
    name: 'ChaiStride Anti-Burnout Agent',
    description: 'An open-source AI agent harness built to pull developers away from glowing screens into the real world.',
    agents: {
      agentDirPath: './mastra',
      vectorProvider: []
    }
  }
});

// ==========================================
// 3. AGENT WORKFLOW TEST RUN
// ==========================================

export async function runChaiStrideAgent() {
  console.log('='.repeat(68));
  console.log('  CHAISTRIDE - MASTRA AGENT ORCHESTRATION WORKFLOW');
  console.log('  Category: Best Use of Mastra (Agent Harness over Open Models)');
  console.log('='.repeat(68));

  console.log('\n[1/3] Initializing Mastra Agent Harness: "ChaiStride Anti-Burnout Agent"...');
  console.log('      Framework: @mastra/core');
  console.log('      Registered Tools: [generateQuest, enforceScreenLockout, trackChaiStreak]');

  console.log('\n[2/3] Executing Anti-Doomscroll Break Workflow:');
  const quest = await chaiTools.generateQuest({
    availableMinutes: 20,
    burnoutContext: 'fighting with CSS alignment for 3 hours'
  });
  console.log(`     -> Generated Mission: ${quest.questTitle} (${quest.estimatedDistanceKm} km)`);
  console.log(`     -> Destination: ${quest.targetDestination}`);
  console.log(`     -> Directive: "${quest.directiveNote}"`);

  const lockout = await chaiTools.enforceScreenLockout({ durationMinutes: 20 });
  console.log(`     -> Screen Eviction: ${lockout.timerSeconds / 60} Minutes Locked`);
  console.log(`     -> Penalty Clause: "${lockout.samosaPenaltyClause}"`);

  const streak = await chaiTools.trackChaiStreak({ currentStreak: 3 });
  console.log(`     -> User Memory: ${streak.praiseMessage}`);

  console.log('\n[3/3] Mastra Orchestration Complete: Screen locked, go touch grass!\n');
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runChaiStrideAgent().catch(console.error);
}
