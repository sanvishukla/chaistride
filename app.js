/**
 * ChaiStride ☕ — The Anti-Doomscroll Chai Walk Companion
 * Built for Hacktoberfest 2026: Touch Grass
 *
 * Core Engines:
 * 1. StreakEngine: Mathematical calendar-based streak verification & historical ledger
 * 2. SquadEngine: Real teammate management, dynamic leaderboards, settlement & invites
 * 3. SyncEngine: Multi-tab/peer real-time communication via BroadcastChannel
 * 4. PartyEngine: Synchronized squad walk room with emoji reactions
 * 5. GuardianEngine: Distraction radar via visibilitychange/blur with Web Audio alarms
 * 6. TelemetryEngine: Live GPS tracking (Haversine) & cadence progression
 * 7. ToastSystem: Glassmorphism notification system (Zero alert() or confirm())
 */

// ========================================================
// CONFIGURATION & CONSTANTS
// ========================================================
const TEA_SPOTS = [
  { name: 'Corner Tapri', drink: 'cutting adrak chai', vessel: 'glass kulhad', tree: 'ancient banyan tree' },
  { name: 'Colony Roundabout Stall', drink: 'strong elaichi chai', vessel: 'clay kulhad', tree: 'shaded peepal tree' },
  { name: 'Park Gate Stall', drink: 'masala cutting chai', vessel: 'glass cup', tree: 'flowering neem tree' },
  { name: 'Avenue Coconut Vendor', drink: 'fresh tender coconut water', vessel: 'green shell', tree: 'bougainvillea trellis' }
];

const OBSERVATIONS = [
  'Spot at least 1 peaceful stray dog chilling on the curb',
  'Look up at the treetops and find 1 pair of green parakeets or mynas',
  'Notice the twilight sky shifting from golden orange to deep indigo',
  'Take 10 long diaphragmatic breaths without looking at any screen'
];

// Initial seed walks to ensure the user starts with a realistic calendar history
function getInitialSeedWalks() {
  const walks = [];
  const today = new Date();
  
  // Seed past 3 consecutive days
  for (let i = 3; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    walks.push({
      id: 'walk_' + d.getTime(),
      date: dateStr,
      timestamp: d.getTime(),
      durationMinutes: 20,
      distanceKm: (1.6 + (i * 0.2)).toFixed(2),
      steps: 2200 + (i * 150),
      questTitle: TEA_SPOTS[i % TEA_SPOTS.length].name + ' Stride',
      questLocation: TEA_SPOTS[i % TEA_SPOTS.length].name,
      samosasIncurred: 0,
      distractions: 0,
      notes: 'Evening tea break away from terminal'
    });
  }
  return walks;
}

const DEFAULT_FRIENDS = [
  { id: 'f_arjun', name: 'Arjun', handle: '@arjun_dev', avatar: '🧔🏽', streak: 6, distanceKm: 14.2, samosasOwed: 0, status: '🟢 Touched grass today' },
  { id: 'f_priya', name: 'Priya', handle: '@priyacodes', avatar: '👩🏽', streak: 4, distanceKm: 9.8, samosasOwed: 1, status: '🚶‍♂️ Walking to tapri now' },
  { id: 'f_rahul', name: 'Rahul', handle: '@rahul_k', avatar: '🧑🏽', streak: 2, distanceKm: 4.5, samosasOwed: 3, status: '🚨 Caught on Slack (owes samosas)' }
];

// ========================================================
// APPLICATION STATE
// ========================================================
const state = {
  // User Profile
  userProfile: {
    id: 'user_self',
    name: 'Sanvi',
    handle: '@sanvi',
    avatar: '☕'
  },
  // Walk & Streak Data
  walks: [],
  selectedDuration: 20,
  currentQuest: null,
  activeSort: 'streak', // 'streak' | 'distance' | 'samosas'
  
  // Active Walk Session & Lockout
  lockoutActive: false,
  lockoutSecondsRemaining: 20 * 60,
  lockoutTotalSeconds: 20 * 60,
  lockoutInterval: null,
  sessionDistractions: 0,
  sessionSamosas: 0,
  sessionDistanceKm: 0.0,
  sessionSteps: 0,
  lastGpsCoords: null,
  watchPositionId: null,

  // Squad & Social
  friends: [],
  samosaDebt: 0,
  
  // Chai Party
  partyActive: false,
  partyTimerRemaining: 20 * 60,
  partyInterval: null,
  partyRoomCode: 'CHAI-' + Math.floor(100 + Math.random() * 900)
};

// ========================================================
// SYNC ENGINE: BROADCASTCHANNEL FOR MULTI-TAB / PEER SYNC
// ========================================================
let syncChannel = null;
try {
  syncChannel = new BroadcastChannel('chaistride_sync');
  syncChannel.onmessage = (event) => {
    handleSyncMessage(event.data);
  };
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment');
}

function broadcastEvent(type, payload = {}) {
  if (syncChannel) {
    syncChannel.postMessage({ type, payload, sender: state.userProfile.name, timestamp: Date.now() });
  }
}

function handleSyncMessage(data) {
  const { type, payload, sender } = data;
  
  switch (type) {
    case 'WALK_STARTED':
      showToast(`☕ ${sender} Started Walking!`, `Embarked on a ${payload.duration}-min Chai Stride.`, '🚶‍♂️', 'info');
      updateTeammateStatus(sender, '🚶‍♂️ Walking to tapri now');
      break;

    case 'WALK_COMPLETED':
      showToast(`🎉 ${sender} Touched Grass!`, `Completed ${payload.distanceKm} km outdoor walk! Streak increased!`, '🌿', 'success');
      playChimeNote(660);
      updateTeammateStatus(sender, '🟢 Touched grass today');
      break;

    case 'DISTRACTION_ALERT':
      showToast(`🥟 SNEAK DETECTED!`, `${sender} got caught opening work apps during their walk! Samosas owed: +1`, '🚨', 'danger');
      playAlertBuzzer();
      updateTeammateSamosas(sender, 1);
      break;

    case 'NUDGE':
      if (payload.target === state.userProfile.name || payload.target === 'all') {
        playNudgeChime();
        showToast(`🫵 NUDGE FROM ${sender.toUpperCase()}!`, payload.message || 'Stop coding! Close your laptop and go get chai!', '☕', 'warning', 7000);
      }
      break;

    case 'EMOJI_REACTION':
      createReactionParticle(payload.emoji);
      break;

    case 'SAMOSA_SETTLED':
      showToast(`🥟 Samosas Settled!`, `${sender} bought hot samosas at the tapri for everyone!`, '✨', 'success');
      playSettleChime();
      break;

    case 'PARTY_STARTED':
      showToast(`🎉 Chai Party Underway!`, `${sender} launched synchronized squad walk!`, '☕', 'info');
      break;
  }
}

function updateTeammateStatus(name, status) {
  const friend = state.friends.find(f => f.name.toLowerCase() === name.toLowerCase());
  if (friend) {
    friend.status = status;
    saveData();
    renderSquadLeaderboard();
  }
}

function updateTeammateSamosas(name, delta) {
  const friend = state.friends.find(f => f.name.toLowerCase() === name.toLowerCase());
  if (friend) {
    friend.samosasOwed = Math.max(0, (friend.samosasOwed || 0) + delta);
    saveData();
    renderSquadLeaderboard();
  }
}

// ========================================================
// INITIALIZATION
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  checkInviteUrlParams();
  setupTabGuardian();
  setupNavigationEvents();
  setupModalHandlers();
  setupQuestOptions();
  setupLeaderboardFilters();
  generateDynamicQuest(20);
  renderAllComponents();
});

function loadData() {
  // Load User Profile
  const savedProfile = localStorage.getItem('chaistride_user_profile');
  if (savedProfile) {
    try { state.userProfile = JSON.parse(savedProfile); } catch (e) {}
  }

  // Load Walks
  const savedWalks = localStorage.getItem('chaistride_walks');
  if (savedWalks) {
    try {
      state.walks = JSON.parse(savedWalks);
    } catch (e) {
      state.walks = getInitialSeedWalks();
    }
  } else {
    state.walks = getInitialSeedWalks();
    localStorage.setItem('chaistride_walks', JSON.stringify(state.walks));
  }

  // Load Friends
  const savedFriends = localStorage.getItem('chaistride_friends');
  if (savedFriends) {
    try { state.friends = JSON.parse(savedFriends); } catch (e) { state.friends = [...DEFAULT_FRIENDS]; }
  } else {
    state.friends = [...DEFAULT_FRIENDS];
    localStorage.setItem('chaistride_friends', JSON.stringify(state.friends));
  }

  // Load Samosa Debt
  const savedSamosas = localStorage.getItem('chaistride_samosas');
  if (savedSamosas) state.samosaDebt = parseInt(savedSamosas, 10);
}

function saveData() {
  localStorage.setItem('chaistride_user_profile', JSON.stringify(state.userProfile));
  localStorage.setItem('chaistride_walks', JSON.stringify(state.walks));
  localStorage.setItem('chaistride_friends', JSON.stringify(state.friends));
  localStorage.setItem('chaistride_samosas', state.samosaDebt.toString());
}

function checkInviteUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const inviter = params.get('inviter');
  if (inviter && inviter.toLowerCase() !== state.userProfile.name.toLowerCase()) {
    setTimeout(() => {
      showToast(`🎉 Squad Invite Received!`, `You joined Chai Squad via ${inviter}'s invite link. Welcome to the team!`, '🤝', 'success', 6000);
      playChimeNote(528);
      // Ensure inviter is in friends
      if (!state.friends.some(f => f.name.toLowerCase() === inviter.toLowerCase())) {
        state.friends.unshift({
          id: 'f_' + Date.now(),
          name: inviter,
          handle: '@' + inviter.toLowerCase().replace(/\s+/g, '_'),
          avatar: '☕',
          streak: 3,
          distanceKm: 6.5,
          samosasOwed: 0,
          status: '🟢 Invited you to squad'
        });
        saveData();
        renderSquadLeaderboard();
      }
    }, 600);
  }
}

// ========================================================
// 1. MATHEMATICAL STREAK & CALENDAR ENGINE
// ========================================================
function calculateStreakStats() {
  if (!state.walks || state.walks.length === 0) {
    return { currentStreak: 0, bestStreak: 0, todayCompleted: false, totalKm: 0, totalMinutes: 0 };
  }

  // Distinct walk dates (YYYY-MM-DD)
  const dateSet = new Set(state.walks.map(w => w.date));
  const sortedDates = Array.from(dateSet).sort().reverse(); // descending

  const today = new Date();
  const todayStr = getLocalDateString(today);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const todayCompleted = dateSet.has(todayStr);
  const yesterdayCompleted = dateSet.has(yesterdayStr);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(todayCompleted ? today : yesterday);

  // If today isn't completed and yesterday wasn't completed, streak is broken
  if (!todayCompleted && !yesterdayCompleted) {
    currentStreak = 0;
  } else {
    while (true) {
      const dStr = getLocalDateString(checkDate);
      if (dateSet.has(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate best streak historically
  let bestStreak = 0;
  if (sortedDates.length > 0) {
    const allDatesAsc = Array.from(dateSet).sort();
    let tempStreak = 0;
    let prevTime = null;

    for (const dStr of allDatesAsc) {
      const dTime = new Date(dStr + 'T00:00:00').getTime();
      if (prevTime === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((dTime - prevTime) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      prevTime = dTime;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    }
  }
  if (currentStreak > bestStreak) bestStreak = currentStreak;

  // Total Lifetime distance & minutes
  const totalKm = state.walks.reduce((sum, w) => sum + (parseFloat(w.distanceKm) || 0), 0);
  const totalMinutes = state.walks.reduce((sum, w) => sum + (parseInt(w.durationMinutes, 10) || 0), 0);

  return {
    currentStreak,
    bestStreak,
    todayCompleted,
    totalKm: totalKm.toFixed(1),
    totalMinutes
  };
}

function getLocalDateString(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function renderCalendarMatrix() {
  const container = document.getElementById('calendarMatrix');
  if (!container) return;

  const today = new Date();
  const todayStr = getLocalDateString(today);
  const dateMap = new Map();
  state.walks.forEach(w => dateMap.set(w.date, w));

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Build last 7 days ending today
  let html = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dStr = getLocalDateString(d);
    const dayLabel = daysOfWeek[d.getDay()];
    const dateLabel = `${months[d.getMonth()]} ${d.getDate()}`;
    const isToday = (dStr === todayStr);
    const walk = dateMap.get(dStr);

    let indicatorClass = 'day-indicator';
    let icon = '—';
    let title = `${dateLabel}: No walk recorded`;

    if (walk) {
      indicatorClass += ' completed';
      icon = '✓';
      title = `${dateLabel}: Completed ${walk.distanceKm} km (${walk.durationMinutes}m) - ${walk.questTitle}`;
    } else if (isToday) {
      indicatorClass += ' today-pending';
      icon = '⏳';
      title = `${dateLabel} (Today): Outdoor walk pending!`;
    } else {
      indicatorClass += ' missed';
      icon = '✕';
      title = `${dateLabel}: Missed walk`;
    }

    html += `
      <div class="calendar-day-col" title="${title}">
        <span class="day-label">${dayLabel}</span>
        <span class="day-date">${d.getDate()}</span>
        <div class="${indicatorClass}">${icon}</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderAllComponents() {
  const stats = calculateStreakStats();

  // Header streak pill
  const pill = document.getElementById('headerStreakPill');
  if (pill) {
    pill.textContent = `🔥 ${stats.currentStreak} Day Streak`;
  }

  // Streak status badge
  const statusBadge = document.getElementById('streakStatusBadge');
  if (statusBadge) {
    if (stats.todayCompleted) {
      statusBadge.textContent = '🟢 Today Completed';
      statusBadge.style.background = 'rgba(16, 185, 129, 0.2)';
      statusBadge.style.color = '#34d399';
      statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    } else {
      statusBadge.textContent = '⏳ Today Pending';
      statusBadge.style.background = 'rgba(245, 158, 11, 0.2)';
      statusBadge.style.color = '#f59e0b';
      statusBadge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    }
  }

  // Stats Grid
  const elCurrent = document.getElementById('statCurrentStreak');
  const elBest = document.getElementById('statBestStreak');
  const elDist = document.getElementById('statTotalDistance');
  const elMins = document.getElementById('statTotalMinutes');
  const elDebt = document.getElementById('statSamosaDebt');

  if (elCurrent) elCurrent.textContent = `${stats.currentStreak}d`;
  if (elBest) elBest.textContent = `${stats.bestStreak}d`;
  if (elDist) elDist.textContent = `${stats.totalKm} km`;
  if (elMins) elMins.textContent = `${stats.totalMinutes}m`;
  if (elDebt) elDebt.textContent = `${state.samosaDebt} 🥟`;

  renderCalendarMatrix();
  renderSquadLeaderboard();
  renderHistoryTable();
}

// ========================================================
// 2. SQUAD & LEADERBOARD SYSTEM
// ========================================================
function setupLeaderboardFilters() {
  const tabs = document.querySelectorAll('.squad-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeSort = btn.getAttribute('data-sort') || 'streak';
      renderSquadLeaderboard();
    });
  });
}

function renderSquadLeaderboard() {
  const container = document.getElementById('friendsList');
  if (!container) return;

  const stats = calculateStreakStats();

  // Construct "You" entry dynamically from actual data
  const youEntry = {
    id: 'user_self',
    name: state.userProfile.name,
    handle: state.userProfile.handle,
    avatar: state.userProfile.avatar,
    streak: stats.currentStreak,
    distanceKm: parseFloat(stats.totalKm),
    samosasOwed: state.samosaDebt,
    status: stats.todayCompleted ? '🟢 Touched grass today' : '⏳ Today pending',
    isYou: true
  };

  const allEntries = [youEntry, ...state.friends];

  // Sort based on active filter
  if (state.activeSort === 'streak') {
    allEntries.sort((a, b) => b.streak - a.streak);
  } else if (state.activeSort === 'distance') {
    allEntries.sort((a, b) => (b.distanceKm || 0) - (a.distanceKm || 0));
  } else if (state.activeSort === 'samosas') {
    allEntries.sort((a, b) => (b.samosasOwed || 0) - (a.samosasOwed || 0));
  }

  let html = '';
  allEntries.forEach((member, index) => {
    const isYou = member.isYou === true;
    const rank = index + 1;
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

    html += `
      <div class="friend-card ${isYou ? 'you' : ''}" id="card_${member.id}">
        <div class="friend-avatar" style="${isYou ? 'background: linear-gradient(135deg, #f59e0b, #d97706);' : ''}">${member.avatar || '👤'}</div>
        <div class="friend-info">
          <div class="friend-name">
            ${member.name}
            ${isYou ? '<span class="you-badge">YOU</span>' : ''}
            <span style="font-size:0.75rem; color:var(--text-dim); font-weight:400;">${rankEmoji}</span>
          </div>
          <div class="friend-status">${member.status || 'Active Teammate'}</div>
          ${member.samosasOwed > 0 ? `
            <span class="samosa-badge" style="display:inline-block; margin-top:0.25rem;">
              Owes ${member.samosasOwed} Samosas 🥟
            </span>
          ` : ''}
        </div>
        <div class="friend-streak">
          <div class="streak-count">
            ${state.activeSort === 'distance' ? `${member.distanceKm.toFixed(1)} km` : state.activeSort === 'samosas' ? `${member.samosasOwed} 🥟` : `${member.streak}d`}
          </div>
          <div class="friend-actions" style="margin-top:0.35rem; justify-content:flex-end;">
            ${isYou ? `
              ${member.samosasOwed > 0 ? `
                <button class="btn-icon settle" onclick="openSettleModal('self')" title="Settle Samosas at Tapri">
                  Settle 🥟
                </button>
              ` : ''}
            ` : `
              <button class="btn-icon" onclick="nudgeTeammate('${member.id}', '${escapeHtml(member.name)}')" title="Send nudge ping">
                Nudge 🫵
              </button>
              ${member.samosasOwed > 0 ? `
                <button class="btn-icon settle" onclick="openSettleModal('${member.id}')" title="Settle debt">
                  Settle 🥟
                </button>
              ` : ''}
              <button class="btn-icon" onclick="removeFriend('${member.id}')" title="Remove teammate" style="color:#f87171;">
                &times;
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.nudgeTeammate = function(id, name) {
  playNudgeChime();
  broadcastEvent('NUDGE', { target: name, message: `Stop coding! ${state.userProfile.name} says it's time for an evening chai walk.` });
  
  // Update status locally
  const friend = state.friends.find(f => f.id === id);
  if (friend) {
    friend.status = `🫵 Nudged by ${state.userProfile.name} just now`;
    saveData();
    renderSquadLeaderboard();
  }

  showToast(`🫵 Nudged ${name}!`, `Sent real-time Chai Stride nudge reminder across the network.`, '☕', 'success');
};

window.removeFriend = function(id) {
  state.friends = state.friends.filter(f => f.id !== id);
  saveData();
  renderSquadLeaderboard();
  showToast(`Removed from Squad`, `Teammate removed from active leaderboard.`, '🗑️', 'info');
};

let currentSettleTarget = null;
window.openSettleModal = function(target) {
  currentSettleTarget = target;
  const modal = document.getElementById('settleSamosaModal');
  const textEl = document.getElementById('settleModalText');

  if (target === 'self') {
    textEl.innerHTML = `You owe <strong>${state.samosaDebt} samosas</strong> for sneaking onto work apps during walks.<br>Did you buy hot samosas at the corner tapri for your teammates?`;
  } else {
    const friend = state.friends.find(f => f.id === target);
    if (friend) {
      textEl.innerHTML = `<strong>${friend.name}</strong> owes <strong>${friend.samosasOwed} samosas</strong>.<br>Did they treat the squad to fresh samosas at the tapri?`;
    }
  }

  if (modal) modal.classList.add('active');
};

// Settle Confirmation
document.getElementById('btnConfirmSettleSamosa')?.addEventListener('click', () => {
  if (currentSettleTarget === 'self') {
    state.samosaDebt = 0;
    broadcastEvent('SAMOSA_SETTLED', { amount: 0 });
    showToast(`🥟 Debt Cleared!`, `Your samosa debt is settled. The team thanks you for the treats!`, '🎉', 'success');
  } else {
    const friend = state.friends.find(f => f.id === currentSettleTarget);
    if (friend) {
      friend.samosasOwed = 0;
      broadcastEvent('SAMOSA_SETTLED', { amount: 0 });
      showToast(`🥟 Debt Cleared!`, `${friend.name}'s samosas were marked as settled!`, '🎉', 'success');
    }
  }

  playSettleChime();
  saveData();
  renderAllComponents();
  document.getElementById('settleSamosaModal')?.classList.remove('active');
});

// ========================================================
// 3. ADD FRIEND MODAL & INVITE LINK
// ========================================================
function setupNavigationEvents() {
  // Share Squad Invite Link
  document.getElementById('btnShareSquad')?.addEventListener('click', () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?inviter=${encodeURIComponent(state.userProfile.name)}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      showToast(`🔗 Squad Link Copied!`, `Send this link to your teammates. When they open it, they will join your squad automatically!`, '📋', 'success');
    }).catch(() => {
      prompt("Copy your Chai Squad invite link:", inviteUrl);
    });
  });

  // Open Add Friend Modal
  document.getElementById('btnOpenAddFriend')?.addEventListener('click', () => {
    document.getElementById('addFriendModal')?.classList.add('active');
  });

  // Avatar Selection in Add Friend Modal
  const avatarOpts = document.querySelectorAll('.avatar-opt');
  avatarOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      avatarOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });

  // Form Add Friend Submit
  document.getElementById('formAddFriend')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('newFriendName');
    const handleInput = document.getElementById('newFriendHandle');
    const streakInput = document.getElementById('newFriendStreak');
    const activeAvatar = document.querySelector('.avatar-opt.active');

    const name = nameInput.value.trim();
    if (!name) return;

    const handle = handleInput.value.trim() || `@${name.toLowerCase().replace(/\s+/g, '_')}`;
    const streak = parseInt(streakInput.value, 10) || 1;
    const avatar = activeAvatar ? activeAvatar.getAttribute('data-avatar') : '☕';

    const newTeammate = {
      id: 'f_' + Date.now(),
      name,
      handle,
      avatar,
      streak,
      distanceKm: (streak * 1.8).toFixed(1),
      samosasOwed: 0,
      status: '🟢 Joined Chai Squad'
    };

    state.friends.unshift(newTeammate);
    saveData();
    renderSquadLeaderboard();

    document.getElementById('addFriendModal')?.classList.remove('active');
    nameInput.value = '';
    handleInput.value = '';
    showToast(`🎉 Added ${name} to Squad!`, `Compete on streaks and hold each other accountable to touch grass!`, '👥', 'success');
    playChimeNote(660);
  });
}

// ========================================================
// 4. MANUAL WALK LOG & HISTORY VIEWER
// ========================================================
function setupModalHandlers() {
  // Modal Close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      document.getElementById(modalId)?.classList.remove('active');
    });
  });

  // Open Manual Log
  document.getElementById('btnOpenManualLog')?.addEventListener('click', () => {
    const today = new Date();
    const dateInput = document.getElementById('manualWalkDate');
    if (dateInput) dateInput.value = getLocalDateString(today);
    document.getElementById('manualLogModal')?.classList.add('active');
  });

  // Form Manual Log Submit
  document.getElementById('formManualLog')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('manualWalkDate').value;
    const duration = parseInt(document.getElementById('manualWalkDuration').value, 10) || 20;
    const distance = parseFloat(document.getElementById('manualWalkDistance').value) || 1.8;
    const notes = document.getElementById('manualWalkNotes').value.trim() || 'Outdoor walk';

    const newWalk = {
      id: 'walk_' + Date.now(),
      date,
      timestamp: new Date(date + 'T18:00:00').getTime(),
      durationMinutes: duration,
      distanceKm: distance.toFixed(2),
      steps: Math.round(distance * 1350),
      questTitle: notes,
      questLocation: 'Neighborhood',
      samosasIncurred: 0,
      distractions: 0,
      notes
    };

    state.walks.push(newWalk);
    saveData();
    renderAllComponents();

    document.getElementById('manualLogModal')?.classList.remove('active');
    showToast(`✍️ Walk Recorded!`, `Verified ${distance} km outdoor walk for ${date}. Streak updated!`, '🌿', 'success');
    playChaiChime();
    broadcastEvent('WALK_COMPLETED', { distanceKm: distance });
  });

  // Open History Log
  document.getElementById('btnOpenHistory')?.addEventListener('click', () => {
    renderHistoryTable();
    document.getElementById('walkHistoryModal')?.classList.add('active');
  });

  // Reset History Log
  document.getElementById('btnResetHistory')?.addEventListener('click', () => {
    if (confirm("Reset walk logs? This will clear all previous sessions.")) {
      state.walks = [];
      saveData();
      renderAllComponents();
      document.getElementById('walkHistoryModal')?.classList.remove('active');
      showToast(`Logs Cleared`, `All historical walks have been cleared.`, '🗑️', 'info');
    }
  });

  // Penalty Modal Dismiss
  document.getElementById('btnDismissPenalty')?.addEventListener('click', () => {
    document.getElementById('penaltyModal')?.classList.remove('active');
  });
}

function renderHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  if (state.walks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-dim); padding:1.5rem;">No walks logged yet. Go take your first Chai Stride!</td></tr>`;
    return;
  }

  // Sort descending by date
  const sorted = [...state.walks].sort((a, b) => b.timestamp - a.timestamp);

  tbody.innerHTML = sorted.map(w => `
    <tr>
      <td><strong>${w.date}</strong></td>
      <td>${escapeHtml(w.questTitle || 'Chai Stride')}</td>
      <td>${w.durationMinutes} min</td>
      <td>${w.distanceKm} km</td>
      <td>${w.distractions > 0 ? `<span style="color:#f87171;">${w.distractions} strikes</span>` : '<span style="color:#34d399;">Clean</span>'}</td>
    </tr>
  `).join('');
}

// ========================================================
// 5. CHAI PARTY ROOM (SYNCHRONIZED SCREEN EVICTION)
// ========================================================
document.getElementById('btnOpenPartyModal')?.addEventListener('click', () => {
  renderPartyRoom();
  document.getElementById('chaiPartyModal')?.classList.add('active');
});

function renderPartyRoom() {
  const roster = document.getElementById('partyRosterList');
  if (!roster) return;

  const partyMembers = [
    { name: state.userProfile.name, avatar: state.userProfile.avatar, status: '🟢 Ready in lobby' },
    ...state.friends.slice(0, 3).map(f => ({ name: f.name, avatar: f.avatar, status: '🟢 Joined via SyncChannel' }))
  ];

  roster.innerHTML = partyMembers.map(m => `
    <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.25); padding:0.5rem 0.75rem; border-radius:var(--radius-sm); border:1px solid rgba(255,255,255,0.05);">
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <span>${m.avatar}</span>
        <strong style="font-size:0.85rem; color:#fff;">${m.name}</strong>
      </div>
      <span style="font-size:0.75rem; color:#34d399;">${m.status}</span>
    </div>
  `).join('');

  // Reaction buttons
  document.querySelectorAll('.reaction-btn').forEach(btn => {
    btn.onclick = () => {
      const emoji = btn.getAttribute('data-emoji');
      createReactionParticle(emoji);
      broadcastEvent('EMOJI_REACTION', { emoji });
    };
  });

  // Start Group Stride
  const startPartyBtn = document.getElementById('btnStartPartyWalk');
  if (startPartyBtn) {
    startPartyBtn.onclick = () => {
      document.getElementById('chaiPartyModal')?.classList.remove('active');
      broadcastEvent('PARTY_STARTED');
      startChaiLockout();
    };
  }
}

function createReactionParticle(emoji) {
  const el = document.createElement('div');
  el.className = 'reaction-particle';
  el.textContent = emoji;
  el.style.left = (20 + Math.random() * 60) + 'vw';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ========================================================
// 6. DYNAMIC PROCEDURAL QUEST GENERATOR
// ========================================================
function setupQuestOptions() {
  const durBtns = document.querySelectorAll('.quest-opt');
  durBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      durBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mins = parseInt(btn.getAttribute('data-mins'), 10) || 20;
      generateDynamicQuest(mins);
    });
  });

  document.getElementById('btnRollNewQuest')?.addEventListener('click', () => {
    generateDynamicQuest(state.selectedDuration);
    playChimeNote(600);
  });

  document.getElementById('btnStartWalk')?.addEventListener('click', () => {
    startChaiLockout();
  });
}

function generateDynamicQuest(durationMinutes) {
  state.selectedDuration = durationMinutes;

  const spot = TEA_SPOTS[Math.floor(Math.random() * TEA_SPOTS.length)];
  const obs = OBSERVATIONS[Math.floor(Math.random() * OBSERVATIONS.length)];
  const dist = (durationMinutes * 0.09).toFixed(1);

  const quest = {
    title: `The ${durationMinutes}-Min ${spot.name} Stride`,
    badge: `☕ ${durationMinutes} MIN FRESH AIR MISSION`,
    directive: `Walk ${dist} km to the ${spot.name}. Order a ${spot.drink} in a ${spot.vessel}. Stand outside under the ${spot.tree} while sipping it.`,
    checklist: [
      `Put on your chappals/sneakers and leave your laptop behind`,
      `Walk ${dist} km to ${spot.name}`,
      `Order a ${spot.drink} and sip it without checking notifications`,
      `${obs}`
    ],
    tinkerWhisper: `Stop staring at that pull request. Your spine is folded like a boiled prawn. Step away from your desk, walk ${dist} km to the ${spot.name}, and drink a warm ${spot.drink}. Lock your screen now.`
  };

  state.currentQuest = quest;
  renderQuestUI(quest);
}

function renderQuestUI(q) {
  const badge = document.getElementById('questBadge');
  const heading = document.getElementById('questHeading');
  const directive = document.getElementById('questDirective');
  const list = document.getElementById('questChecklist');
  const tinkerEl = document.getElementById('tinkerDirective');

  if (badge) badge.textContent = q.badge;
  if (heading) heading.textContent = q.title;
  if (directive) directive.textContent = q.directive;

  if (list) {
    list.innerHTML = q.checklist.map((item, idx) => `
      <li class="quest-item">
        <input type="checkbox" id="check_${idx}">
        <label for="check_${idx}">${escapeHtml(item)}</label>
      </li>
    `).join('');
  }

  if (tinkerEl) {
    tinkerEl.innerHTML = `
&gt; <strong>Thinking Machines (Tinker) SFT Model:</strong> thinkingmachines/Inkling-Small<br>
&gt; <strong>Generated Field Directive:</strong><br>
"${escapeHtml(q.tinkerWhisper)}"
    `;
  }
}

// ========================================================
// 7. REAL-WORLD TAB GUARDIAN (DISTRACTION RADAR)
// ========================================================
function setupTabGuardian() {
  const guardianBar = document.getElementById('guardianBar');

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state.lockoutActive) {
        state.sessionDistractions++;
        state.samosaDebt++;
        saveData();

        playAlertBuzzer();
        document.title = '🚨 CAUGHT SNEAKING TO WORK! — ChaiStride';
        if (guardianBar) {
          guardianBar.classList.add('active');
          guardianBar.innerHTML = `🚨 DISTRACTION DETECTED! You switched away from ChaiStride! Samosas owed: ${state.samosaDebt} 🥟`;
        }
        broadcastEvent('DISTRACTION_ALERT', { strikes: state.sessionDistractions });
      }
    } else {
      document.title = 'ChaiStride ☕ — The Anti-Doomscroll Chai Walk Companion';
      if (state.lockoutActive && state.sessionDistractions > 0) {
        const modal = document.getElementById('penaltyModal');
        const countEl = document.getElementById('penaltySamosaCount');
        if (countEl) countEl.textContent = `${state.samosaDebt} Samosas`;
        if (modal) modal.classList.add('active');
      }
    }
  });

  window.addEventListener('blur', () => {
    if (state.lockoutActive) {
      console.warn('Focus lost - user switched applications');
    }
  });

  document.getElementById('btnEmergencyExit')?.addEventListener('click', () => {
    emergencyExitLockout();
  });
}

// ========================================================
// 8. 20-MIN SCREEN EVICTION & GPS TELEMETRY
// ========================================================
function startChaiLockout() {
  state.lockoutActive = true;
  state.sessionDistractions = 0;
  state.sessionDistanceKm = 0.0;
  state.sessionSteps = 0;
  state.lastGpsCoords = null;
  state.lockoutTotalSeconds = state.selectedDuration * 60;
  state.lockoutSecondsRemaining = state.lockoutTotalSeconds;

  const overlay = document.getElementById('lockoutOverlay');
  if (overlay) overlay.classList.add('active');

  playChaiChime();
  startTelemetryTracking();
  broadcastEvent('WALK_STARTED', { duration: state.selectedDuration });

  clearInterval(state.lockoutInterval);
  updateLockoutTimerDisplay();

  state.lockoutInterval = setInterval(() => {
    state.lockoutSecondsRemaining--;
    updateLockoutTimerDisplay();
    updateCadenceTelemetry();

    if (state.lockoutSecondsRemaining <= 0) {
      completeChaiStride();
    }
  }, 1000);
}

function updateLockoutTimerDisplay() {
  const timerEl = document.getElementById('lockoutTimer');
  if (!timerEl) return;

  const mins = Math.floor(state.lockoutSecondsRemaining / 60);
  const secs = state.lockoutSecondsRemaining % 60;
  timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startTelemetryTracking() {
  const hudStatus = document.getElementById('hudGpsStatus');

  if ('geolocation' in navigator) {
    try {
      state.watchPositionId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          if (state.lastGpsCoords) {
            const deltaKm = calculateHaversineDistance(
              state.lastGpsCoords.lat, state.lastGpsCoords.lon,
              lat, lon
            );
            // Ignore GPS jitter (< 2 meters) and high speed (> 20 km/h)
            if (deltaKm > 0.002 && deltaKm < 0.2) {
              state.sessionDistanceKm += deltaKm;
              state.sessionSteps = Math.round(state.sessionDistanceKm * 1350);
            }
          }
          state.lastGpsCoords = { lat, lon };
          if (hudStatus) hudStatus.innerHTML = '🟢 LIVE GPS';
          updateHudDisplay();
        },
        (error) => {
          if (hudStatus) hudStatus.innerHTML = '💻 CADENCE SIM (5 km/h)';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (e) {
      if (hudStatus) hudStatus.innerHTML = '💻 CADENCE SIM (5 km/h)';
    }
  } else {
    if (hudStatus) hudStatus.innerHTML = '💻 CADENCE SIM (5 km/h)';
  }
}

function updateCadenceTelemetry() {
  // If GPS is stationary or running on desktop laptop, simulate cadence progression
  const elapsedSeconds = state.lockoutTotalSeconds - state.lockoutSecondsRemaining;
  const targetKm = (elapsedSeconds / 3600) * 5.0; // 5 km/h pace
  if (state.sessionDistanceKm < targetKm) {
    state.sessionDistanceKm = targetKm;
    state.sessionSteps = Math.round(targetKm * 1350);
  }
  updateHudDisplay();
}

function updateHudDisplay() {
  const distEl = document.getElementById('hudDistance');
  const paceEl = document.getElementById('hudPace');
  const stepsEl = document.getElementById('hudSteps');

  if (distEl) distEl.textContent = `${state.sessionDistanceKm.toFixed(2)} km`;
  if (paceEl) paceEl.textContent = '5.1 km/h';
  if (stepsEl) stepsEl.textContent = `${state.sessionSteps}`;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function completeChaiStride() {
  clearInterval(state.lockoutInterval);
  if (state.watchPositionId) {
    navigator.geolocation.clearWatch(state.watchPositionId);
  }
  state.lockoutActive = false;

  const today = new Date();
  const dateStr = getLocalDateString(today);
  const distance = Math.max(0.8, state.sessionDistanceKm).toFixed(2);

  const completedWalk = {
    id: 'walk_' + Date.now(),
    date: dateStr,
    timestamp: Date.now(),
    durationMinutes: state.selectedDuration,
    distanceKm: distance,
    steps: state.sessionSteps || Math.round(distance * 1350),
    questTitle: state.currentQuest ? state.currentQuest.title : 'Chai Stride',
    questLocation: 'Corner Tapri',
    samosasIncurred: state.sessionDistractions,
    distractions: state.sessionDistractions,
    notes: 'Completed full screen lockout'
  };

  state.walks.push(completedWalk);
  saveData();
  renderAllComponents();

  playChaiChime();
  broadcastEvent('WALK_COMPLETED', { distanceKm: distance });

  document.getElementById('lockoutOverlay')?.classList.remove('active');
  showToast(`☕ MISSION ACCOMPLISHED!`, `You completed your ${state.selectedDuration}-min Chai Stride and touched real grass today. Streak updated!`, '🎉', 'success', 8000);
}

function emergencyExitLockout() {
  state.samosaDebt++;
  saveData();
  clearInterval(state.lockoutInterval);
  if (state.watchPositionId) {
    navigator.geolocation.clearWatch(state.watchPositionId);
  }
  state.lockoutActive = false;
  document.getElementById('lockoutOverlay')?.classList.remove('active');
  renderAllComponents();

  showToast(`⚠️ Surrendered Early`, `You left the walk early. +1 Samosa Debt logged to your record! 🥟`, '🥟', 'warning');
}

// ========================================================
// 9. TOAST NOTIFICATION SYSTEM
// ========================================================
function showToast(title, message, icon = '☕', type = 'info', duration = 4500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-msg">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ========================================================
// 10. WEB AUDIO SOUND SYNTHESIS
// ========================================================
function playAlertBuzzer() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(180, now + 0.15);
    osc.frequency.setValueAtTime(140, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {}
}

function playChimeNote(freq) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  } catch (e) {}
}

function playNudgeChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  } catch (e) {}
}

function playChaiChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.18, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.75);
    });
  } catch (e) {}
}

function playSettleChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.22, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.55);
    });
  } catch (e) {}
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
