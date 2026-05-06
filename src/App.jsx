import React, { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts'
import { supabase } from './supabase.js'

const HS_LOGO = 'https://www.hs-fulda.de/assets/images/hs-fulda_logo_2024.svg'

// =================== I18N (translations) ===================
const translations = {
  en: {
    sessions: 'Sessions', players: 'Players', leaderboard: 'Leaderboard',
    standings: 'Standings', teams: 'Teams', matches: 'Matches',
    new: '+ New', back: '← Back', admin: 'ADMIN', login: 'Login',
    no_sessions: 'No sessions yet.', live: 'LIVE', voting: 'VOTING',
    delete: 'Delete', delete_round: '🗑 Delete', generate_matches: 'Generate matches',
    no_matches: 'No matches yet. Click "Generate matches" once teams are set.',
    or_pick_scorer: 'or pick scorer…', team_goal: 'Team Goal',
    add_assist: '+ assist', pick_assist: '— pick assist —',
    set_final_score: '📝 Set final score directly',
    add_match_round: '+ Add match to Round',
    add_round: '+ Add another round',
    top_scorers_session: '⭐ Top scorers (this session)',
    top_scorers_all: '⚽ Top Scorers (all sessions)',
    voting_label: '🗳 Voting',
    voting_not_open: 'Voting not open yet.',
    open_voting_page: 'Open voting page →',
    open_voting: 'Open voting', close_voting: 'Close voting',
    share: 'Share:',
    assigned: 'assigned', not_assigned: 'not assigned',
    assigned_section: '✅ Assigned',
    unassigned_section: '⏳ Not assigned yet',
    everyone_assigned: 'Everyone is assigned to a team.',
    rename_team: 'New team name:',
    no_players_team: 'No players yet',
    remove: 'remove', no_data: 'No data yet.',
    season_lb: 'Season Leaderboard',
    most_best_player: '🏆 Most Best Player Awards',
    most_best_keeper: '🧤 Most Best Goalkeeper Awards',
    goals_per_session: '📈 Goals per session',
    add_player: 'Player name', add: 'Add', no_players: 'No players yet.',
    admin_login: 'Admin Login', email: 'Email', password: 'Password',
    log_in: 'Log in', logging_in: 'Logging in…', log_out: 'Log out',
    loading: 'Loading…', vote: 'Vote',
    best_player: '🏆 Best Player', best_keeper: '🧤 Best Goalkeeper', best_goal: '⚽ Best Goal',
    choose_fav_goal: 'Choose who scored your favourite goal',
    choose: '— choose —', submit_vote: 'Submit vote',
    thanks_voting: '✅ Thanks for voting! See live results below.',
    no_votes: 'No votes yet.', voting_not_open_session: 'Voting is not open for this session.',
    session_not_found: 'Session not found.',
    confirm_delete_session: 'Delete this entire session? This cannot be undone.',
    confirm_delete_round: 'Delete all matches in Round',
    confirm_delete_match: 'Delete this match?',
    confirm_delete_goal: 'Delete this goal?',
    confirm_delete_player: 'Remove this player?',
    confirm_regen: 'Matches already exist. Delete and regenerate?',
    how_many_teams: 'How many teams? (2 to 10)',
    must_2_10: 'Must be between 2 and 10',
    how_many_rounds: 'How many rounds? (each round = every team plays every other team once)',
    must_1_20: 'Must be between 1 and 20',
    need_2_teams: 'Need at least 2 teams',
    first_team_label: 'First team label?',
    second_team_label: 'Second team label?',
    label_not_found: 'Team label not found',
    different_teams: 'Choose two different teams',
    final_score_for_team: 'Final score for Team',
    enter_valid_numbers: 'Enter valid numbers',
    replace_existing_goals: 'This match already has',
    recorded_goals_warn: 'recorded goal(s).\n\nOK = REPLACE all existing goals with the new score',
    cancel_keep: '.\nCancel = keep existing goals (no change).',
  },
  de: {
    sessions: 'Termine', players: 'Spieler', leaderboard: 'Bestenliste',
    standings: 'Tabelle', teams: 'Teams', matches: 'Spiele',
    new: '+ Neu', back: '← Zurück', admin: 'ADMIN', login: 'Login',
    no_sessions: 'Noch keine Termine.', live: 'LIVE', voting: 'ABSTIMMUNG',
    delete: 'Löschen', delete_round: '🗑 Löschen', generate_matches: 'Spiele erstellen',
    no_matches: 'Noch keine Spiele. „Spiele erstellen" klicken, sobald Teams stehen.',
    or_pick_scorer: 'oder Schütze wählen…', team_goal: 'Team-Tor',
    add_assist: '+ Assist', pick_assist: '— Assist wählen —',
    set_final_score: '📝 Endstand direkt eintragen',
    add_match_round: '+ Spiel hinzufügen zu Runde',
    add_round: '+ Weitere Runde',
    top_scorers_session: '⭐ Top-Torschützen (dieser Termin)',
    top_scorers_all: '⚽ Top-Torschützen (alle Termine)',
    voting_label: '🗳 Abstimmung',
    voting_not_open: 'Abstimmung noch nicht offen.',
    open_voting_page: 'Abstimmungsseite öffnen →',
    open_voting: 'Abstimmung öffnen', close_voting: 'Abstimmung schließen',
    share: 'Teilen:',
    assigned: 'zugeteilt', not_assigned: 'noch nicht zugeteilt',
    assigned_section: '✅ Zugeteilt',
    unassigned_section: '⏳ Noch nicht zugeteilt',
    everyone_assigned: 'Alle sind einem Team zugeteilt.',
    rename_team: 'Neuer Teamname:',
    no_players_team: 'Noch keine Spieler',
    remove: 'entfernen', no_data: 'Noch keine Daten.',
    season_lb: 'Saison-Bestenliste',
    most_best_player: '🏆 Meiste „Bester Spieler"-Auszeichnungen',
    most_best_keeper: '🧤 Meiste „Bester Torwart"-Auszeichnungen',
    goals_per_session: '📈 Tore pro Termin',
    add_player: 'Spielername', add: 'Hinzufügen', no_players: 'Noch keine Spieler.',
    admin_login: 'Admin-Login', email: 'E-Mail', password: 'Passwort',
    log_in: 'Anmelden', logging_in: 'Anmelden…', log_out: 'Abmelden',
    loading: 'Lädt…', vote: 'Abstimmen',
    best_player: '🏆 Bester Spieler', best_keeper: '🧤 Bester Torwart', best_goal: '⚽ Bestes Tor',
    choose_fav_goal: 'Wer hat dein Lieblingstor erzielt?',
    choose: '— wählen —', submit_vote: 'Stimme abgeben',
    thanks_voting: '✅ Danke fürs Abstimmen! Live-Ergebnisse unten.',
    no_votes: 'Noch keine Stimmen.', voting_not_open_session: 'Abstimmung für diesen Termin nicht offen.',
    session_not_found: 'Termin nicht gefunden.',
    confirm_delete_session: 'Ganzen Termin löschen? Das kann nicht rückgängig gemacht werden.',
    confirm_delete_round: 'Alle Spiele in Runde löschen?',
    confirm_delete_match: 'Dieses Spiel löschen?',
    confirm_delete_goal: 'Dieses Tor löschen?',
    confirm_delete_player: 'Diesen Spieler entfernen?',
    confirm_regen: 'Spiele existieren bereits. Löschen und neu erstellen?',
    how_many_teams: 'Wie viele Teams? (2 bis 10)',
    must_2_10: 'Muss zwischen 2 und 10 sein',
    how_many_rounds: 'Wie viele Runden? (jede Runde = jedes Team spielt einmal gegen jedes andere)',
    must_1_20: 'Muss zwischen 1 und 20 sein',
    need_2_teams: 'Mindestens 2 Teams nötig',
    first_team_label: 'Erstes Team-Label?',
    second_team_label: 'Zweites Team-Label?',
    label_not_found: 'Team-Label nicht gefunden',
    different_teams: 'Zwei verschiedene Teams wählen',
    final_score_for_team: 'Endstand für Team',
    enter_valid_numbers: 'Gültige Zahlen eingeben',
    replace_existing_goals: 'Dieses Spiel hat bereits',
    recorded_goals_warn: 'erfasste Tor(e).\n\nOK = ALLE bestehenden Tore mit neuem Stand ERSETZEN',
    cancel_keep: '.\nAbbrechen = bestehende Tore behalten (keine Änderung).',
  },
}

const LangCtx = createContext({ lang: 'en', setLang: () => {}, t: (k) => k })

function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'en')
  const setLang = (l) => { localStorage.setItem('lang', l); setLangState(l) }
  const t = (k) => translations[lang][k] || translations.en[k] || k
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>
}
const useT = () => useContext(LangCtx)

// =================== THEME (dark mode) ===================
const ThemeCtx = createContext({ theme: 'light', setTheme: () => {} })

function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])
  const setTheme = (t) => { localStorage.setItem('theme', t); setThemeState(t) }
  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>
}
const useTheme = () => useContext(ThemeCtx)

// =================== HELPERS ===================
function todayISO() { return new Date().toISOString().split('T')[0] }
function isToday(dateStr) { return dateStr === todayISO() }

function LiveBadge() {
  const { t } = useT()
  return (
    <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
      {t('live')}
    </span>
  )
}

// =================== AUTH HOOK ===================
function useAuth() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null); checkAdmin(session?.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null); checkAdmin(session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function checkAdmin(u) {
    if (!u) { setIsAdmin(false); setLoading(false); return }
    const { data } = await supabase.from('admins').select('email').eq('email', u.email).maybeSingle()
    setIsAdmin(!!data); setLoading(false)
  }
  return { user, isAdmin, loading }
}

// =================== LAYOUT ===================
function Layout({ children }) {
  const { isAdmin } = useAuth()
  const { lang, setLang, t } = useT()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const sessionMatch = location.pathname.match(/^\/session\/([^/]+)/)
  const inSession = !!sessionMatch

  const topNav = [
    { to: '/',            icon: '🏠', label: t('sessions'),    active: location.pathname === '/' },
    { to: '/players',     icon: '👥', label: t('players'),     active: location.pathname === '/players' },
    { to: '/leaderboard', icon: '⭐', label: t('leaderboard'), active: location.pathname === '/leaderboard' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-24 transition-colors">
      <header className="bg-fulda dark:bg-emerald-900 text-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {inSession && (
              <button onClick={() => navigate('/')} className="text-white/90 hover:text-white text-sm shrink-0">{t('back')}</button>
            )}
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <span className="bg-white rounded-md px-2 py-1.5 shrink-0 shadow-sm">
                <img src={HS_LOGO} alt="Hochschule Fulda" className="h-6 w-auto block" />
              </span>
              <span className="text-lg font-bold truncate">Futsal Kurs</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
              className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-2 py-1 rounded"
              title="Toggle language"
            >
              {lang === 'en' ? 'DE' : 'EN'}
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="bg-white/15 hover:bg-white/25 text-white text-xs px-2 py-1 rounded"
              title="Toggle dark mode"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {isAdmin
              ? <span className="bg-white text-fulda px-2 py-0.5 rounded text-xs font-bold">{t('admin')}</span>
              : <Link to="/login" className="bg-white text-fulda px-2 py-0.5 rounded text-xs font-bold">{t('login')}</Link>}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5">{children}</main>

      {!inSession && (
        <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="max-w-3xl mx-auto grid grid-cols-3">
            {topNav.map(item => (
              <Link key={item.to} to={item.to} className={`flex flex-col items-center py-2.5 transition ${item.active ? 'text-fulda dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <span className="text-xl leading-none">{item.icon}</span>
                <span className={`text-xs mt-1 ${item.active ? 'font-semibold' : ''}`}>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}

// =================== HOME / SESSIONS LIST ===================
function HomePage() {
  const { isAdmin } = useAuth()
  const { t } = useT()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    const { data } = await supabase.from('sessions').select('*').order('date', { ascending: false })
    setSessions(data || []); setLoading(false)
  }

  async function createSession() {
    const today = todayISO()
    const numTeams = parseInt(prompt(t('how_many_teams'), '3') || '3')
    if (numTeams < 2 || numTeams > 10) { alert(t('must_2_10')); return }
    const { data, error } = await supabase.from('sessions')
      .insert({ date: today, num_teams: numTeams, name: `Session ${today}` })
      .select().single()
    if (error) { alert(error.message); return }
    const labels = ['A','B','C','D','E','F','G','H','I','J'].slice(0, numTeams)
    await supabase.from('teams').insert(labels.map(l => ({ session_id: data.id, label: l })))
    navigate(`/session/${data.id}`)
  }

  if (loading) return <p>{t('loading')}</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('sessions')}</h1>
        {isAdmin && <button onClick={createSession} className="bg-fulda text-white px-4 py-2 rounded-lg font-semibold shadow-sm active:scale-95 transition">{t('new')}</button>}
      </div>
      {sessions.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">{t('no_sessions')}</p>}
      <div className="space-y-3">
        {sessions.map(s => {
          const live = isToday(s.date)
          return (
            <Link
              key={s.id}
              to={`/session/${s.id}`}
              className={`block bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow active:scale-[0.99] transition ${live ? 'ring-2 ring-red-400 border-red-400' : ''}`}
            >
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{s.name || s.date}</span>
                    {live && <LiveBadge />}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.date} · {s.num_teams} {t('teams').toLowerCase()}</div>
                </div>
                {s.voting_open && <span className="bg-fulda text-white text-xs px-2 py-1 rounded-full font-semibold shrink-0 ml-2">{t('voting')}</span>}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// =================== SESSION DETAIL ===================
function SessionPage() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const { t } = useT()
  const [session, setSession] = useState(null)
  const [teams, setTeams] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [teamPlayers, setTeamPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [assistPickerFor, setAssistPickerFor] = useState(null)
  const [activeTab, setActiveTab] = useState('standings')

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [sRes, tRes, pRes, tpRes, mRes, gRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('id', id).single(),
      supabase.from('teams').select('*').eq('session_id', id).order('label'),
      supabase.from('players').select('*').order('name'),
      supabase.from('team_players').select('*, players(*), teams!inner(session_id)').eq('teams.session_id', id),
      supabase.from('matches').select('*').eq('session_id', id).order('match_order'),
      supabase.from('goals').select('*, players!goals_player_id_fkey(name), assist_player:players!goals_assist_player_id_fkey(name), matches!inner(session_id)').eq('matches.session_id', id),
    ])
    setSession(sRes.data); setTeams(tRes.data || []); setAllPlayers(pRes.data || [])
    setTeamPlayers(tpRes.data || []); setMatches(mRes.data || []); setGoals(gRes.data || [])
    setLoading(false)
  }

  async function assignPlayer(playerId, teamId) {
    const sessionTeamIds = teams.map(t => t.id)
    const player = allPlayers.find(p => p.id === playerId)
    const targetTeam = teams.find(t => t.id === teamId)
    setTeamPlayers(prev => {
      const filtered = prev.filter(tp => !(tp.player_id === playerId && sessionTeamIds.includes(tp.team_id)))
      if (teamId && player && targetTeam) {
        filtered.push({ id: `temp-${Date.now()}`, player_id: playerId, team_id: teamId, players: player, teams: { session_id: id } })
      }
      return filtered
    })
    try {
      await supabase.from('team_players').delete().eq('player_id', playerId).in('team_id', sessionTeamIds)
      if (teamId) await supabase.from('team_players').insert({ player_id: playerId, team_id: teamId })
    } catch (e) { loadAll() }
  }

  async function generateMatches() {
    if (matches.length > 0) {
      if (!confirm(t('confirm_regen'))) return
      await supabase.from('matches').delete().eq('session_id', id)
    }
    const rounds = parseInt(prompt(t('how_many_rounds'), '3') || '3')
    if (rounds < 1 || rounds > 20) { alert(t('must_1_20')); return }
    const list = []; let order = 1
    for (let r = 1; r <= rounds; r++) for (let i = 0; i < teams.length; i++) for (let j = i + 1; j < teams.length; j++)
      list.push({ session_id: id, team_a_id: teams[i].id, team_b_id: teams[j].id, match_order: order++, round: r })
    await supabase.from('matches').insert(list); loadAll()
  }

  async function addRound() {
    const maxRound = matches.length === 0 ? 0 : Math.max(...matches.map(m => m.round || 1))
    const newRound = maxRound + 1
    const maxOrder = matches.length === 0 ? 0 : Math.max(...matches.map(m => m.match_order))
    let order = maxOrder + 1; const list = []
    for (let i = 0; i < teams.length; i++) for (let j = i + 1; j < teams.length; j++)
      list.push({ session_id: id, team_a_id: teams[i].id, team_b_id: teams[j].id, match_order: order++, round: newRound })
    await supabase.from('matches').insert(list); loadAll()
  }

  async function addMatchToRound(roundNum) {
    if (teams.length < 2) { alert(t('need_2_teams')); return }
    const labelList = teams.map(t => t.label).join(', ')
    const aLabel = prompt(`${t('first_team_label')} (${labelList})`)
    if (!aLabel) return
    const bLabel = prompt(`${t('second_team_label')} (${labelList})`)
    if (!bLabel) return
    const a = teams.find(tt => tt.label.toLowerCase() === aLabel.trim().toLowerCase())
    const b = teams.find(tt => tt.label.toLowerCase() === bLabel.trim().toLowerCase())
    if (!a || !b) { alert(t('label_not_found')); return }
    if (a.id === b.id) { alert(t('different_teams')); return }
    const maxOrder = matches.length === 0 ? 0 : Math.max(...matches.map(m => m.match_order))
    await supabase.from('matches').insert({ session_id: id, team_a_id: a.id, team_b_id: b.id, match_order: maxOrder + 1, round: roundNum })
    loadAll()
  }

  async function deleteRound(roundNum) {
    if (!confirm(`${t('confirm_delete_round')} ${roundNum}?`)) return
    await supabase.from('matches').delete().eq('session_id', id).eq('round', roundNum); loadAll()
  }

  async function deleteMatch(matchId) {
    if (!confirm(t('confirm_delete_match'))) return
    await supabase.from('matches').delete().eq('id', matchId); loadAll()
  }

  async function addGoal(matchId, teamId, playerId = null) {
    await supabase.from('goals').insert({ match_id: matchId, team_id: teamId, player_id: playerId || null })
    const match = matches.find(m => m.id === matchId)
    const isA = match.team_a_id === teamId
    await supabase.from('matches').update({
      score_a: isA ? match.score_a + 1 : match.score_a,
      score_b: !isA ? match.score_b + 1 : match.score_b,
      played: true,
    }).eq('id', matchId)
    loadAll()
  }

  async function setFinalScore(matchId) {
    const match = matches.find(m => m.id === matchId)
    if (!match) return
    const a = teams.find(tt => tt.id === match.team_a_id)
    const b = teams.find(tt => tt.id === match.team_b_id)
    const aStr = prompt(`${t('final_score_for_team')} ${a?.label}?`, String(match.score_a))
    if (aStr === null) return
    const bStr = prompt(`${t('final_score_for_team')} ${b?.label}?`, String(match.score_b))
    if (bStr === null) return
    const newA = parseInt(aStr); const newB = parseInt(bStr)
    if (isNaN(newA) || isNaN(newB) || newA < 0 || newB < 0) { alert(t('enter_valid_numbers')); return }
    const existingGoals = goals.filter(g => g.match_id === matchId)
    if (existingGoals.length > 0) {
      const choice = confirm(`${t('replace_existing_goals')} ${existingGoals.length} ${t('recorded_goals_warn')} (${newA}-${newB})${t('cancel_keep')}`)
      if (!choice) return
      await supabase.from('goals').delete().eq('match_id', matchId)
    }
    const inserts = []
    for (let i = 0; i < newA; i++) inserts.push({ match_id: matchId, team_id: match.team_a_id, player_id: null })
    for (let i = 0; i < newB; i++) inserts.push({ match_id: matchId, team_id: match.team_b_id, player_id: null })
    if (inserts.length > 0) await supabase.from('goals').insert(inserts)
    await supabase.from('matches').update({ score_a: newA, score_b: newB, played: newA + newB > 0 }).eq('id', matchId)
    loadAll()
  }

  async function deleteGoal(goalId) {
    if (!confirm(t('confirm_delete_goal'))) return
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const match = matches.find(m => m.id === goal.match_id)
    await supabase.from('goals').delete().eq('id', goalId)
    if (match) {
      const isA = match.team_a_id === goal.team_id
      await supabase.from('matches').update({
        score_a: isA ? Math.max(0, match.score_a - 1) : match.score_a,
        score_b: !isA ? Math.max(0, match.score_b - 1) : match.score_b,
      }).eq('id', goal.match_id)
    }
    loadAll()
  }

  async function setAssist(goalId, assistPlayerId) {
    await supabase.from('goals').update({ assist_player_id: assistPlayerId || null }).eq('id', goalId)
    setAssistPickerFor(null); loadAll()
  }

  async function renameTeam(teamId, currentLabel) {
    const newLabel = prompt(t('rename_team'), currentLabel)
    if (!newLabel || newLabel.trim() === '' || newLabel.trim() === currentLabel) return
    await supabase.from('teams').update({ label: newLabel.trim() }).eq('id', teamId); loadAll()
  }

  async function toggleVoting() {
    const open = !session.voting_open
    await supabase.from('sessions').update({ voting_open: open, voting_opened_at: open ? new Date().toISOString() : session.voting_opened_at }).eq('id', id)
    loadAll()
  }

  async function deleteSession() {
    if (!confirm(t('confirm_delete_session'))) return
    await supabase.from('sessions').delete().eq('id', id); window.location.href = '/'
  }

  if (loading) return <p>{t('loading')}</p>
  if (!session) return <p>{t('session_not_found')}</p>

  const live = isToday(session.date)

  const teamStats = teams.map(tt => {
    let played = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0
    matches.forEach(m => {
      if (!m.played) return
      if (m.team_a_id === tt.id) {
        played++; gf += m.score_a; ga += m.score_b
        if (m.score_a > m.score_b) wins++; else if (m.score_a < m.score_b) losses++; else draws++
      } else if (m.team_b_id === tt.id) {
        played++; gf += m.score_b; ga += m.score_a
        if (m.score_b > m.score_a) wins++; else if (m.score_b < m.score_a) losses++; else draws++
      }
    })
    return { ...tt, played, wins, draws, losses, gf, ga, points: wins * 3 + draws }
  }).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga))

  const scorerMap = {}
  goals.forEach(g => {
    if (!g.players) return
    scorerMap[g.players.name] = (scorerMap[g.players.name] || 0) + 1
  })
  const topScorers = Object.entries(scorerMap).sort((a, b) => b[1] - a[1])

  const assignedPlayerIds = new Set(teamPlayers.map(tp => tp.player_id))
  const unassignedPlayers = allPlayers.filter(p => !assignedPlayerIds.has(p.id))
  const assignedCount = assignedPlayerIds.size
  const unassignedCount = unassignedPlayers.length

  const GoalRow = ({ g, samePool }) => {
    const isPicking = assistPickerFor === g.id
    return (
      <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 px-2 py-1.5 rounded-lg">
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <span>⚽ {g.players?.name || t('team_goal')}</span>
          {g.assist_player?.name && <span>🎯 {g.assist_player.name}</span>}
          {isAdmin && g.player_id && !g.assist_player_id && !isPicking && (
            <button onClick={() => setAssistPickerFor(g.id)} className="text-xs text-fulda dark:text-emerald-400 underline">{t('add_assist')}</button>
          )}
          {isAdmin && isPicking && (
            <select autoFocus onChange={e => setAssist(g.id, e.target.value)} onBlur={() => setAssistPickerFor(null)} className="text-xs border rounded px-1 py-0.5 bg-white dark:bg-gray-900 dark:border-gray-700">
              <option value="">{t('pick_assist')}</option>
              {samePool.filter(p => p.player_id !== g.player_id).map(p => <option key={p.id} value={p.player_id}>{p.players?.name}</option>)}
            </select>
          )}
        </div>
        {isAdmin && <button onClick={() => deleteGoal(g.id)} className="text-red-500 text-base ml-2 leading-none">❌</button>}
      </div>
    )
  }

  const PlayerAssignRow = ({ player, currentTeamId }) => (
    <div className="flex items-center justify-between text-sm border-b dark:border-gray-800 last:border-b-0 py-2">
      <span className="flex-1">
        {player.name}
        {currentTeamId && (
          <span className="text-fulda dark:text-emerald-400 font-bold ml-1">→ {teams.find(tt=>tt.id===currentTeamId)?.label || ''}</span>
        )}
      </span>
      <div className="flex gap-1 flex-wrap justify-end items-center">
        {teams.map(tt => (
          <button key={tt.id} onClick={() => assignPlayer(player.id, tt.id)}
            className={`px-2 py-1 rounded text-xs font-semibold ${currentTeamId === tt.id ? 'bg-fulda text-white' : 'bg-gray-200 dark:bg-gray-800 hover:bg-fulda hover:text-white'}`}>
            {tt.label}
          </button>
        ))}
        {currentTeamId && <button onClick={() => assignPlayer(player.id, null)} className="text-red-500 text-xs px-1 font-bold">×</button>}
      </div>
    </div>
  )

  const sessionTabs = [
    { key: 'standings', icon: '🏆', label: t('standings') },
    { key: 'teams',     icon: '👥', label: t('teams') },
    { key: 'matches',   icon: '⚽', label: t('matches') },
  ]

  return (
    <div className="space-y-5 pb-20">
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{session.name || session.date}</h1>
            {live && <LiveBadge />}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{session.date} · {session.num_teams} {t('teams').toLowerCase()}</p>
        </div>
        {isAdmin && <button onClick={deleteSession} className="text-red-600 text-sm shrink-0 ml-2">{t('delete')}</button>}
      </div>

      {activeTab === 'standings' && (
        <>
          <section className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-bold mb-3">{t('standings')}</h2>
            <table className="w-full text-sm">
              <thead className="text-gray-500 dark:text-gray-400 text-xs uppercase">
                <tr><th className="text-left pb-2">{t('teams')}</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>Pts</th></tr>
              </thead>
              <tbody>
                {teamStats.map((tt, i) => (
                  <tr key={tt.id} className={`${i === 0 && tt.played > 0 ? 'font-bold text-fulda dark:text-emerald-400' : ''} border-t dark:border-gray-800`}>
                    <td className="text-left py-2">{i === 0 && tt.played > 0 ? '🏆 ' : ''}Team {tt.label}</td>
                    <td className="text-center">{tt.played}</td><td className="text-center">{tt.wins}</td><td className="text-center">{tt.draws}</td><td className="text-center">{tt.losses}</td>
                    <td className="text-center">{tt.gf}</td><td className="text-center">{tt.ga}</td><td className="text-center font-semibold">{tt.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {topScorers.length > 0 && (
            <section className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
              <h2 className="font-bold mb-3">{t('top_scorers_session')}</h2>
              <ol className="space-y-1.5 text-sm">
                {topScorers.map(([name, n], i) => (
                  <li key={name} className="flex justify-between">
                    <span><span className="text-gray-400 w-5 inline-block">{i+1}.</span> {name}</span>
                    <span className="font-bold text-fulda dark:text-emerald-400">{n}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-bold mb-2">{t('voting_label')}</h2>
            {session.voting_open
              ? <Link to={`/vote/${id}`} className="inline-block bg-fulda text-white px-4 py-2 rounded-lg font-semibold shadow-sm">{t('open_voting_page')}</Link>
              : <p className="text-sm text-gray-500 dark:text-gray-400">{t('voting_not_open')}</p>}
            {isAdmin && (
              <div className="mt-3">
                <button onClick={toggleVoting} className="bg-gray-800 dark:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                  {session.voting_open ? t('close_voting') : t('open_voting')}
                </button>
                {session.voting_open && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 break-all">{t('share')} <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{window.location.origin}/vote/{id}</code></p>}
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'teams' && (
        <section className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <h2 className="font-bold mb-3">{t('teams')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teams.map(tt => {
              const players = teamPlayers.filter(tp => tp.team_id === tt.id)
              return (
                <div key={tt.id} className="border dark:border-gray-800 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="font-semibold mb-2 flex items-center justify-between">
                    <span>Team {tt.label} <span className="text-gray-400 font-normal">({players.length})</span></span>
                    {isAdmin && <button onClick={() => renameTeam(tt.id, tt.label)} className="text-xs text-gray-500 hover:text-fulda">✏️</button>}
                  </div>
                  <ul className="text-sm space-y-1">
                    {players.map(p => <li key={p.id} className="flex justify-between items-center">
                      <span>{p.players?.name}</span>
                      {isAdmin && <button onClick={() => assignPlayer(p.player_id, null)} className="text-red-500 text-xs">{t('remove')}</button>}
                    </li>)}
                    {players.length === 0 && <li className="text-xs text-gray-400 italic">{t('no_players_team')}</li>}
                  </ul>
                </div>
              )
            })}
          </div>

          {isAdmin && (
            <div className="mt-5 space-y-4">
              <div className="flex gap-2 text-xs">
                <span className="bg-fulda/10 dark:bg-emerald-900/40 text-fulda dark:text-emerald-300 px-2 py-1 rounded-full font-semibold">{assignedCount} {t('assigned')}</span>
                <span className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full font-semibold">{unassignedCount} {t('not_assigned')}</span>
              </div>

              {assignedCount > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">{t('assigned_section')}</h3>
                  <div className="border dark:border-gray-800 rounded-lg p-2 bg-white dark:bg-gray-900 divide-y dark:divide-gray-800">
                    {teams.map(tt => {
                      const teamMembers = teamPlayers.filter(tp => tp.team_id === tt.id)
                      if (teamMembers.length === 0) return null
                      return (
                        <div key={tt.id} className="py-2 first:pt-1 last:pb-1">
                          <div className="text-xs font-semibold text-fulda dark:text-emerald-400 uppercase mb-1.5 px-1">Team {tt.label}</div>
                          {teamMembers.map(tp => <PlayerAssignRow key={tp.id} player={tp.players} currentTeamId={tp.team_id} />)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">{t('unassigned_section')} ({unassignedCount})</h3>
                {unassignedCount === 0 ? (
                  <p className="text-xs text-gray-400 italic px-1">{t('everyone_assigned')}</p>
                ) : (
                  <div className="border dark:border-gray-800 rounded-lg p-2 bg-white dark:bg-gray-900">
                    {unassignedPlayers.map(p => <PlayerAssignRow key={p.id} player={p} currentTeamId={null} />)}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'matches' && (
        <section className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">{t('matches')}</h2>
            {isAdmin && matches.length === 0 && <button onClick={generateMatches} className="bg-fulda text-white px-3 py-1.5 rounded-lg text-sm font-semibold">{t('generate_matches')}</button>}
          </div>
          {matches.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_matches')}</p>}

          {(() => {
            const rounds = [...new Set(matches.map(m => m.round || 1))].sort((a,b) => a-b)
            return rounds.map(roundNum => {
              const roundMatches = matches.filter(m => (m.round || 1) === roundNum)
              return (
                <div key={roundNum} className="mb-5">
                  <div className="flex justify-between items-center bg-fulda dark:bg-emerald-800 text-white px-3 py-2 rounded-t-lg">
                    <h3 className="font-bold">🏆 Round {roundNum}</h3>
                    {isAdmin && <button onClick={() => deleteRound(roundNum)} className="text-xs bg-white text-fulda px-2 py-1 rounded font-semibold">{t('delete_round')}</button>}
                  </div>
                  <div className="border border-t-0 dark:border-gray-800 rounded-b-lg p-3 space-y-3 bg-gray-50 dark:bg-gray-800">
                    {roundMatches.map(m => {
                      const a = teams.find(tt => tt.id === m.team_a_id)
                      const b = teams.find(tt => tt.id === m.team_b_id)
                      const aPlayers = teamPlayers.filter(tp => tp.team_id === m.team_a_id)
                      const bPlayers = teamPlayers.filter(tp => tp.team_id === m.team_b_id)
                      const aGoals = goals.filter(g => g.match_id === m.id && g.team_id === m.team_a_id)
                      const bGoals = goals.filter(g => g.match_id === m.id && g.team_id === m.team_b_id)
                      return (
                        <div key={m.id} className="border dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-semibold text-sm">Match {m.match_order}: Team {a?.label} vs Team {b?.label}</div>
                            <div className="flex items-center gap-2">
                              <div className="text-xl font-bold tabular-nums">{m.score_a} - {m.score_b}</div>
                              {isAdmin && <button onClick={() => deleteMatch(m.id)} className="text-red-500 text-xs">❌</button>}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-2">
                            <div className="space-y-2">
                              {isAdmin && (<>
                                <button onClick={() => addGoal(m.id, m.team_a_id, null)} className="w-full bg-fulda text-white font-bold text-base py-3 rounded-lg shadow-sm active:scale-95 transition">+1 {a?.label}</button>
                                <select onChange={e => { if (e.target.value) { addGoal(m.id, m.team_a_id, e.target.value); e.target.value='' } }} className="w-full border dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800">
                                  <option value="">{t('or_pick_scorer')}</option>
                                  {aPlayers.map(p => <option key={p.id} value={p.player_id}>{p.players?.name}</option>)}
                                </select>
                              </>)}
                              {aGoals.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Team {a?.label}</div>
                                  {aGoals.map(g => <GoalRow key={g.id} g={g} samePool={aPlayers} />)}
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              {isAdmin && (<>
                                <button onClick={() => addGoal(m.id, m.team_b_id, null)} className="w-full bg-fulda text-white font-bold text-base py-3 rounded-lg shadow-sm active:scale-95 transition">+1 {b?.label}</button>
                                <select onChange={e => { if (e.target.value) { addGoal(m.id, m.team_b_id, e.target.value); e.target.value='' } }} className="w-full border dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800">
                                  <option value="">{t('or_pick_scorer')}</option>
                                  {bPlayers.map(p => <option key={p.id} value={p.player_id}>{p.players?.name}</option>)}
                                </select>
                              </>)}
                              {bGoals.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Team {b?.label}</div>
                                  {bGoals.map(g => <GoalRow key={g.id} g={g} samePool={bPlayers} />)}
                                </div>
                              )}
                            </div>
                          </div>

                          {isAdmin && (
                            <button onClick={() => setFinalScore(m.id)} className="w-full mt-3 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold">
                              {t('set_final_score')}
                            </button>
                          )}
                        </div>
                      )
                    })}
                    {isAdmin && (
                      <button onClick={() => addMatchToRound(roundNum)} className="w-full text-xs border border-dashed border-fulda text-fulda dark:text-emerald-400 py-2 rounded-lg hover:bg-fulda hover:text-white font-semibold">
                        {t('add_match_round')} {roundNum}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          })()}

          {isAdmin && matches.length > 0 && (
            <button onClick={addRound} className="w-full mt-3 border-2 border-dashed border-fulda text-fulda dark:text-emerald-400 font-semibold py-2.5 rounded-lg hover:bg-fulda hover:text-white">
              {t('add_round')}
            </button>
          )}
        </section>
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="max-w-3xl mx-auto grid grid-cols-3">
          {sessionTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex flex-col items-center py-2.5 transition ${activeTab === tab.key ? 'text-fulda dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className={`text-xs mt-1 ${activeTab === tab.key ? 'font-semibold' : ''}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

// =================== PLAYERS PAGE ===================
function PlayersPage() {
  const { isAdmin } = useAuth()
  const { t } = useT()
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('players').select('*').order('name')
    setPlayers(data || [])
  }
  async function add() {
    if (!name.trim()) return
    const { error } = await supabase.from('players').insert({ name: name.trim() })
    if (error) alert(error.message)
    setName(''); load()
  }
  async function del(id) {
    if (!confirm(t('confirm_delete_player'))) return
    await supabase.from('players').delete().eq('id', id); load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{t('players')} <span className="text-gray-400 font-normal">({players.length})</span></h1>
      {isAdmin && (
        <div className="flex gap-2 mb-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t('add_player')} className="flex-1 border dark:border-gray-700 dark:bg-gray-900 rounded-lg px-3 py-2" onKeyDown={e => e.key === 'Enter' && add()} />
          <button onClick={add} className="bg-fulda text-white px-4 rounded-lg font-semibold shadow-sm">{t('add')}</button>
        </div>
      )}
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl divide-y dark:divide-gray-800 shadow-sm">
        {players.map(p => (
          <div key={p.id} className="px-4 py-3 flex justify-between items-center">
            <span>{p.name}</span>
            {isAdmin && <button onClick={() => del(p.id)} className="text-red-500 text-sm">{t('remove')}</button>}
          </div>
        ))}
        {players.length === 0 && <p className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{t('no_players')}</p>}
      </div>
    </div>
  )
}

// =================== VOTE PAGE ===================
function VotePage() {
  const { sessionId } = useParams()
  const { t } = useT()
  const [session, setSession] = useState(null)
  const [players, setPlayers] = useState([])
  const [votes, setVotes] = useState({ best_player: '', best_goalkeeper: '', best_goal: '' })
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState({})
  const fingerprint = getFingerprint()

  useEffect(() => { load() }, [sessionId])

  async function load() {
    const { data: s } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
    setSession(s)
    const { data: tp } = await supabase.from('team_players').select('players(*), teams!inner(session_id)').eq('teams.session_id', sessionId)
    const uniq = {}; (tp || []).forEach(tt => { if (tt.players) uniq[tt.players.id] = tt.players })
    setPlayers(Object.values(uniq))
    const { data: existing } = await supabase.from('votes').select('*').eq('session_id', sessionId).eq('voter_fingerprint', fingerprint)
    if (existing && existing.length) setSubmitted(true)
    loadResults()
  }
  async function loadResults() {
    const { data } = await supabase.from('votes').select('*, players(name)').eq('session_id', sessionId)
    const r = {}
    ;(data || []).forEach(v => {
      const key = `${v.category}_${v.player_id}`
      r[key] = (r[key] || { name: v.players?.name, category: v.category, count: 0 })
      r[key].count++
    })
    setResults(r)
  }
  async function submit() {
    const inserts = []
    for (const cat of ['best_player', 'best_goalkeeper', 'best_goal']) {
      if (votes[cat]) inserts.push({ session_id: sessionId, category: cat, player_id: votes[cat], voter_fingerprint: fingerprint })
    }
    if (inserts.length === 0) { alert('Select at least one'); return }
    const { error } = await supabase.from('votes').insert(inserts)
    if (error) { alert(error.message); return }
    setSubmitted(true); loadResults()
  }

  if (!session) return <p>{t('loading')}</p>
  if (!session.voting_open) return <p>{t('voting_not_open_session')}</p>

  const byCat = (cat) => Object.values(results).filter(r => r.category === cat).sort((a,b) => b.count - a.count)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t('vote')} — {session.name || session.date}</h1>
      {!submitted ? (
        <div className="space-y-3">
          <VoteSection title={t('best_player')} players={players} value={votes.best_player} onChange={v => setVotes({...votes, best_player: v})} />
          <VoteSection title={t('best_keeper')} players={players} value={votes.best_goalkeeper} onChange={v => setVotes({...votes, best_goalkeeper: v})} />
          <VoteSection title={t('best_goal')} players={players} value={votes.best_goal} onChange={v => setVotes({...votes, best_goal: v})} hint={t('choose_fav_goal')} />
          <button onClick={submit} className="w-full bg-fulda text-white py-3 rounded-lg font-bold shadow-sm">{t('submit_vote')}</button>
        </div>
      ) : <p className="text-fulda dark:text-emerald-400 font-semibold">{t('thanks_voting')}</p>}

      <div className="space-y-3">
        {[['best_player', t('best_player')], ['best_goalkeeper', t('best_keeper')], ['best_goal', t('best_goal')]].map(([cat,label]) => {
          const list = byCat(cat)
          return (
            <div key={cat} className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold mb-2">{label}</h3>
              {list.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_votes')}</p> :
                <ol className="space-y-1 text-sm">{list.map((r, i) => <li key={r.name} className="flex justify-between"><span><span className="text-gray-400 w-5 inline-block">{i+1}.</span> {r.name}</span><span className="font-bold text-fulda dark:text-emerald-400">{r.count}</span></li>)}</ol>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

function VoteSection({ title, players, value, onChange, hint }) {
  const { t } = useT()
  return (
    <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
      <h3 className="font-bold mb-2">{title}</h3>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{hint}</p>}
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2">
        <option value="">{t('choose')}</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  )
}

function getFingerprint() {
  let f = localStorage.getItem('voter_fp')
  if (!f) { f = crypto.randomUUID(); localStorage.setItem('voter_fp', f) }
  return f
}

// =================== LEADERBOARD ===================
function LeaderboardPage() {
  const { t } = useT()
  const { theme } = useTheme()
  const [scorers, setScorers] = useState([])
  const [bestPlayers, setBestPlayers] = useState([])
  const [bestKeepers, setBestKeepers] = useState([])
  const [goalsBySession, setGoalsBySession] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    const { data: g } = await supabase.from('goals').select('player_id, players!goals_player_id_fkey(name)')
    const sm = {}
    ;(g || []).forEach(x => { if (x.player_id && x.players?.name) sm[x.players.name] = (sm[x.players.name] || 0) + 1 })
    setScorers(Object.entries(sm).sort((a,b) => b[1] - a[1]))

    const { data: vp } = await supabase.from('votes').select('players(name), category').eq('category','best_player')
    const pm = {}; (vp || []).forEach(x => { if (x.players) pm[x.players.name] = (pm[x.players.name] || 0) + 1 })
    setBestPlayers(Object.entries(pm).sort((a,b) => b[1] - a[1]))

    const { data: vk } = await supabase.from('votes').select('players(name), category').eq('category','best_goalkeeper')
    const km = {}; (vk || []).forEach(x => { if (x.players) km[x.players.name] = (km[x.players.name] || 0) + 1 })
    setBestKeepers(Object.entries(km).sort((a,b) => b[1] - a[1]))

    // Build "goals per session" for chart
    const { data: sessionsData } = await supabase.from('sessions').select('id, date, name').order('date', { ascending: true })
    const { data: allGoals } = await supabase.from('goals').select('match_id, matches!inner(session_id)')
    const goalCountBySessionId = {}
    ;(allGoals || []).forEach(x => {
      const sid = x.matches?.session_id
      if (sid) goalCountBySessionId[sid] = (goalCountBySessionId[sid] || 0) + 1
    })
    const chartData = (sessionsData || []).map(s => ({
      label: s.date,
      goals: goalCountBySessionId[s.id] || 0,
    }))
    setGoalsBySession(chartData)
    setLoading(false)
  }

  const Section = ({ title, list }) => (
    <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
      <h3 className="font-bold mb-3">{title}</h3>
      {list.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_data')}</p> :
        <ol className="space-y-1.5 text-sm">{list.slice(0,10).map(([n,c], i) => <li key={n} className="flex justify-between"><span><span className="text-gray-400 w-5 inline-block">{i+1}.</span> {n}</span><span className="font-bold text-fulda dark:text-emerald-400">{c}</span></li>)}</ol>}
    </div>
  )

  if (loading) return <p>{t('loading')}</p>

  const axisColor = theme === 'dark' ? '#9ca3af' : '#6b7280'

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('season_lb')}</h1>

      {goalsBySession.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="font-bold mb-3">{t('goals_per_session')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={goalsBySession} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="label" stroke={axisColor} tick={{ fontSize: 11 }} />
                <YAxis stroke={axisColor} tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: theme === 'dark' ? '#111827' : '#fff', border: '1px solid #00A859', borderRadius: 8 }} />
                <Line type="monotone" dataKey="goals" stroke="#00A859" strokeWidth={3} dot={{ r: 4, fill: '#00A859' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <Section title={t('top_scorers_all')} list={scorers} />
      <Section title={t('most_best_player')} list={bestPlayers} />
      <Section title={t('most_best_keeper')} list={bestKeepers} />
    </div>
  )
}

// =================== LOGIN ===================
function LoginPage() {
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function login() {
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/')
  }

  async function logout() {
    await supabase.auth.signOut(); window.location.reload()
  }

  return (
    <div className="max-w-sm mx-auto bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-6 shadow-sm">
      <h1 className="text-xl font-bold mb-4">{t('admin_login')}</h1>
      <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder={t('email')} className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 mb-3" />
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder={t('password')} className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 mb-3" onKeyDown={e => e.key === 'Enter' && login()} />
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <button onClick={login} disabled={loading} className="w-full bg-fulda text-white py-2 rounded-lg font-semibold mb-2 shadow-sm">{loading ? t('logging_in') : t('log_in')}</button>
      <button onClick={logout} className="w-full text-gray-500 text-sm">{t('log_out')}</button>
    </div>
  )
}

// =================== APP ROOT ===================
function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/session/:id" element={<SessionPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/vote/:sessionId" element={<VotePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </Layout>
      </LangProvider>
    </ThemeProvider>
  )
}

export default App
