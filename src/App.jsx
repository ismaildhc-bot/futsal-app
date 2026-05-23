import React, { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from './supabase.js'

const HS_LOGO = '/hsfulda-logo.png'
const APP_ICON = '/icon-512.png'

const translations = {
  en: {
    sessions: 'Sessions', players: 'Players', leaderboard: 'Leaderboard',
    standings: 'Standings', teams: 'Teams', matches: 'Matches',
    new: '+ New', back: '← Back', admin: 'ADMIN', login: 'Login',
    no_sessions: 'No sessions yet.', live: 'LIVE', voting: 'VOTING',
    delete: 'Delete', top_scorers_session: '⭐ Top scorers (this session)',
    voting_label: '🗳 Voting', voting_not_open: 'Voting not open yet.',
    open_voting_page: 'Open voting page →', open_voting: 'Open voting', close_voting: 'Close voting',
    share: 'Share:', assigned: 'assigned', not_assigned: 'not assigned',
    assigned_section: '✅ Assigned', unassigned_section: '⏳ Not assigned yet',
    everyone_assigned: 'Everyone is assigned to a team.',
    rename_team: 'New team name:', rename_player: 'New player name:',
    no_players_team: 'No players yet', remove: 'remove', no_data: 'No data yet.',
    season_lb: 'Season Leaderboard',
    best_player_wins: '🏆 Best Player of the Session', best_keeper_wins: '🧤 Best Goalkeeper of the Session',
    best_defender_wins: '🛡 Best Defender of the Session', best_goal_wins: '⚽ Best Goal of the Session',
    pepe_wins: '🪓 Pepe Award of the Session', goals_per_session: '📈 Goals per session',
    add_player: 'Player name', add: 'Add', no_players: 'No players yet.',
    admin_login: 'Admin Login', email: 'Email', password: 'Password',
    log_in: 'Log in', logging_in: 'Logging in…', log_out: 'Log out', loading: 'Loading…', vote: 'Vote',
    best_player: '🏆 Best Player', best_keeper: '🧤 Best Goalkeeper',
    best_defender: '🛡 Best Defender', best_goal: '⚽ Best Goal', pepe_award: '🪓🚨 Pepe Award',
    pepe_hint: 'The most aggressive player today — too many bad contacts',
    choose_fav_goal: 'Choose who scored your favourite goal',
    choose: '— choose —', submit_vote: 'Submit vote', thanks_voting: '✅ Thanks for voting!',
    no_votes: 'No votes yet.', voting_not_open_session: 'Voting is not open for this session.',
    session_not_found: 'Session not found.',
    confirm_delete_session: 'Delete this entire session? This cannot be undone.',
    confirm_delete_match: 'Delete this match?', confirm_delete_player: 'Remove this player?',
    how_many_teams: 'How many teams? (2 to 10)', must_2_10: 'Must be between 2 and 10',
    enter_valid_numbers: 'Enter valid numbers', appearances: 'Appearances', edit: 'Edit',
    back_to_players: '← Back to players', player_not_found: 'Player not found.', goals_count: 'Goals',
    start_session_matches: 'Start matches', pick_first_match: 'Pick the first match',
    submit_score: 'Submit score', next_match: 'Next match',
    submit_session: '🏁 Submit session', session_submitted: '✅ Session submitted',
    confirm_submit_session: 'Submit the session? Matches become read-only. You can reopen anytime.',
    confirm_reopen_session: 'Reopen the session to edit matches?', reopen_session: 'Reopen session',
    not_enough_teams: 'Need at least 2 teams.', select_two_teams: 'Select two different teams.',
    change_teams: 'Change teams',
    change_teams_warn: 'Changing teams keeps the current score but reassigns goals to the new teams. Continue?',
    locked: 'Locked', who_are_you: 'Who are you?', select_yourself: '— Select your name —',
    already_voted: 'already voted', edit_vote: '✏️ Edit my vote',
    vote_tracker: 'Vote tracker', voted: 'Voted', not_voted: 'Not voted yet',
    anonymous_note: 'Your vote is anonymous — your name is only used to prevent double voting.',
    update_vote: 'Update vote', cancel: 'Cancel',
    cancel_my_vote: 'Cancel my vote',
    confirm_cancel_vote: 'Delete all your votes for this session?',
    cannot_vote_yourself: 'You cannot vote for yourself.',
    copyright_text: 'Used privately for the Futsal course at Hochschule Fulda. Non-commercial.',
    contact: 'Contact',
  },
  de: {
    sessions: 'Termine', players: 'Spieler', leaderboard: 'Bestenliste',
    standings: 'Tabelle', teams: 'Teams', matches: 'Spiele',
    new: '+ Neu', back: '← Zurück', admin: 'ADMIN', login: 'Login',
    no_sessions: 'Noch keine Termine.', live: 'LIVE', voting: 'ABSTIMMUNG',
    delete: 'Löschen', top_scorers_session: '⭐ Top-Torschützen (dieser Termin)',
    voting_label: '🗳 Abstimmung', voting_not_open: 'Abstimmung noch nicht offen.',
    open_voting_page: 'Abstimmungsseite öffnen →', open_voting: 'Abstimmung öffnen', close_voting: 'Abstimmung schließen',
    share: 'Teilen:', assigned: 'zugeteilt', not_assigned: 'noch nicht zugeteilt',
    assigned_section: '✅ Zugeteilt', unassigned_section: '⏳ Noch nicht zugeteilt',
    everyone_assigned: 'Alle sind einem Team zugeteilt.',
    rename_team: 'Neuer Teamname:', rename_player: 'Neuer Spielername:',
    no_players_team: 'Noch keine Spieler', remove: 'entfernen', no_data: 'Noch keine Daten.',
    season_lb: 'Saison-Bestenliste',
    best_player_wins: '🏆 Bester Spieler des Termins', best_keeper_wins: '🧤 Bester Torwart des Termins',
    best_defender_wins: '🛡 Bester Verteidiger des Termins', best_goal_wins: '⚽ Bestes Tor des Termins',
    pepe_wins: '🪓 Pepe-Preis des Termins', goals_per_session: '📈 Tore pro Termin',
    add_player: 'Spielername', add: 'Hinzufügen', no_players: 'Noch keine Spieler.',
    admin_login: 'Admin-Login', email: 'E-Mail', password: 'Passwort',
    log_in: 'Anmelden', logging_in: 'Anmelden…', log_out: 'Abmelden', loading: 'Lädt…', vote: 'Abstimmen',
    best_player: '🏆 Bester Spieler', best_keeper: '🧤 Bester Torwart',
    best_defender: '🛡 Bester Verteidiger', best_goal: '⚽ Bestes Tor', pepe_award: '🪓🚨 Pepe-Preis',
    pepe_hint: 'Der aggressivste Spieler heute — zu viele harte Aktionen',
    choose_fav_goal: 'Wer hat dein Lieblingstor erzielt?',
    choose: '— wählen —', submit_vote: 'Stimme abgeben', thanks_voting: '✅ Danke fürs Abstimmen!',
    no_votes: 'Noch keine Stimmen.', voting_not_open_session: 'Abstimmung für diesen Termin nicht offen.',
    session_not_found: 'Termin nicht gefunden.',
    confirm_delete_session: 'Ganzen Termin löschen? Das kann nicht rückgängig gemacht werden.',
    confirm_delete_match: 'Dieses Spiel löschen?', confirm_delete_player: 'Diesen Spieler entfernen?',
    how_many_teams: 'Wie viele Teams? (2 bis 10)', must_2_10: 'Muss zwischen 2 und 10 sein',
    enter_valid_numbers: 'Gültige Zahlen eingeben', appearances: 'Einsätze', edit: 'Bearbeiten',
    back_to_players: '← Zurück zu Spielern', player_not_found: 'Spieler nicht gefunden.', goals_count: 'Tore',
    start_session_matches: 'Spiele starten', pick_first_match: 'Erstes Spiel wählen',
    submit_score: 'Endstand bestätigen', next_match: 'Nächstes Spiel',
    submit_session: '🏁 Termin abschließen', session_submitted: '✅ Termin abgeschlossen',
    confirm_submit_session: 'Termin abschließen? Spiele werden schreibgeschützt. Jederzeit wieder öffnen.',
    confirm_reopen_session: 'Termin zum Bearbeiten wieder öffnen?', reopen_session: 'Termin wieder öffnen',
    not_enough_teams: 'Mindestens 2 Teams nötig.', select_two_teams: 'Zwei verschiedene Teams auswählen.',
    change_teams: 'Teams ändern',
    change_teams_warn: 'Teams ändern behält das aktuelle Ergebnis, aber Tore werden den neuen Teams zugewiesen. Fortfahren?',
    locked: 'Gesperrt', who_are_you: 'Wer bist du?', select_yourself: '— Deinen Namen wählen —',
    already_voted: 'hat bereits abgestimmt', edit_vote: '✏️ Stimme bearbeiten',
    vote_tracker: 'Abstimmungs-Übersicht', voted: 'Abgestimmt', not_voted: 'Noch nicht abgestimmt',
    anonymous_note: 'Deine Stimme ist anonym — der Name wird nur zur Verhinderung doppelter Abstimmungen verwendet.',
    update_vote: 'Stimme aktualisieren', cancel: 'Abbrechen',
    cancel_my_vote: 'Stimme löschen',
    confirm_cancel_vote: 'Alle deine Stimmen für diesen Termin löschen?',
    cannot_vote_yourself: 'Du kannst nicht für dich selbst stimmen.',
    copyright_text: 'Privat genutzt für den Futsal-Kurs der Hochschule Fulda. Nicht-kommerziell.',
    contact: 'Kontakt',
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

function todayISO() { return new Date().toISOString().split('T')[0] }
function isToday(dateStr) { return dateStr === todayISO() }

function LiveBadge() {
  const { t } = useT()
  return (
    <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>{t('live')}
    </span>
  )
}

// Inline tri-leaf SVG watermark — HS Fulda style
function TriLeafWatermark() {
  return (
    <div className="pointer-events-none select-none fixed inset-0 flex items-center justify-center z-0 overflow-hidden" aria-hidden="true">
      <img src="/hsfulda-logo.png" alt="" className="w-80 opacity-[0.05] dark:opacity-[0.08]" />
    </div>
  )
}

function useAuth() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); checkAdmin(session?.user) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { setUser(session?.user ?? null); checkAdmin(session?.user) })
    return () => subscription.unsubscribe()
  }, [])
  async function checkAdmin(u) {
    if (!u) { setIsAdmin(false); setLoading(false); return }
    const { data } = await supabase.from('admins').select('email').eq('email', u.email).maybeSingle()
    setIsAdmin(!!data); setLoading(false)
  }
  return { user, isAdmin, loading }
}

function Layout({ children }) {
  const { isAdmin } = useAuth()
  const { lang, setLang, t } = useT()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const inSession = !!location.pathname.match(/^\/session\/([^/]+)/)
  const topNav = [
    { to: '/', icon: '🏠', label: t('sessions'), active: location.pathname === '/' },
    { to: '/players', icon: '👥', label: t('players'), active: location.pathname.startsWith('/players') || location.pathname.startsWith('/player/') },
    { to: '/leaderboard', icon: '⭐', label: t('leaderboard'), active: location.pathname === '/leaderboard' },
  ]
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors"
         style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
      <header className="sticky top-0 z-50 bg-fulda dark:bg-emerald-900 text-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {inSession && (<button onClick={() => navigate('/')} className="text-white/90 hover:text-white text-sm shrink-0">{t('back')}</button>)}
            <Link to="/" className="flex items-center gap-2 min-w-0">
<img src={HS_LOGO} alt="HS Fulda" className="h-9 w-9 shrink-0 rounded-full bg-white p-0.5" />
              <img src={APP_ICON} alt="Futsal Kurs" className="h-9 w-9 rounded-xl object-cover shrink-0 shadow-sm" onError={e => e.target.style.display='none'} />
            </Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setLang(lang === 'en' ? 'de' : 'en')} className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-2 py-1 rounded">{lang === 'en' ? 'DE' : 'EN'}</button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="bg-white/15 hover:bg-white/25 text-white text-xs px-2 py-1 rounded">{theme === 'dark' ? '☀️' : '🌙'}</button>
            {isAdmin
              ? <span className="bg-white text-fulda px-2 py-0.5 rounded text-xs font-bold">{t('admin')}</span>
              : <Link to="/login" className="bg-white text-fulda px-2 py-0.5 rounded text-xs font-bold">{t('login')}</Link>}
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-5 relative">
        <TriLeafWatermark />
        <div className="relative z-10">{children}</div>
      </main>
      {!inSession && (
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg"
             style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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
    const { data, error } = await supabase.from('sessions').insert({ date: today, num_teams: numTeams, name: `Session ${today}` }).select().single()
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
            <Link key={s.id} to={`/session/${s.id}`} className={`block bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow active:scale-[0.99] transition ${live ? 'ring-2 ring-red-400 border-red-400' : ''}`}>
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{s.name || s.date}</span>
                    {live && <LiveBadge />}
                    {s.submitted && <span className="bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full font-semibold">✓</span>}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.date} · {s.num_teams} {t('teams').toLowerCase()}</div>
                </div>
                {s.voting_open && <span className="bg-fulda text-white text-xs px-2 py-1 rounded-full font-semibold shrink-0 ml-2">{t('voting')}</span>}
              </div>
            </Link>
          )
        })}
      </div>
      <div className="mt-8 pt-4 border-t dark:border-gray-800 text-center space-y-1">
        <p className="text-xs text-gray-400 dark:text-gray-600">© Hochschule Fulda — Futsal Kurs</p>
        <p className="text-xs text-gray-400 dark:text-gray-600">{t('copyright_text')}</p>
        <p className="text-xs text-gray-400 dark:text-gray-600">{t('contact')}: <a href="mailto:ismail.elhathout@gmx.de" className="underline">ismail.elhathout@gmx.de</a></p>
      </div>
    </div>
  )
}

function SessionPage() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const { t } = useT()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [teams, setTeams] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [teamPlayers, setTeamPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('standings')
  const [expandedMatchId, setExpandedMatchId] = useState(null)
  const [pickA, setPickA] = useState('')
  const [pickB, setPickB] = useState('')
  const [editingTeamsForMatch, setEditingTeamsForMatch] = useState(null)
  const [editTeamA, setEditTeamA] = useState('')
  const [editTeamB, setEditTeamB] = useState('')
  const [voteTracker, setVoteTracker] = useState([])

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
    if (sRes.data) loadVoteTracker(tpRes.data || [])
  }

  async function loadVoteTracker(tp) {
    const uniqPlayers = {}
    ;(tp || []).forEach(x => { if (x.players) uniqPlayers[x.players.id] = x.players.name })
    if (Object.keys(uniqPlayers).length === 0) return
    const { data: votes } = await supabase.from('votes').select('voter_player_id').eq('session_id', id).not('voter_player_id', 'is', null)
    const votedIds = new Set((votes || []).map(v => v.voter_player_id))
    setVoteTracker(Object.entries(uniqPlayers).map(([pid, name]) => ({ player_id: pid, name, voted: votedIds.has(pid) })))
  }

  async function assignPlayer(playerId, teamId) {
    const sessionTeamIds = teams.map(tt => tt.id)
    const player = allPlayers.find(p => p.id === playerId)
    const targetTeam = teams.find(tt => tt.id === teamId)
    setTeamPlayers(prev => {
      const filtered = prev.filter(tp => !(tp.player_id === playerId && sessionTeamIds.includes(tp.team_id)))
      if (teamId && player && targetTeam) filtered.push({ id: `temp-${Date.now()}`, player_id: playerId, team_id: teamId, players: player, teams: { session_id: id } })
      return filtered
    })
    try {
      await supabase.from('team_players').delete().eq('player_id', playerId).in('team_id', sessionTeamIds)
      if (teamId) await supabase.from('team_players').insert({ player_id: playerId, team_id: teamId })
    } catch (e) { loadAll() }
  }

  async function addGoal(matchId, teamId) {
    const match = matches.find(m => m.id === matchId)
    if (!match) return
    const isA = match.team_a_id === teamId
    const tempGoalId = `temp-${Date.now()}-${Math.random()}`
    setGoals(prev => [...prev, { id: tempGoalId, match_id: matchId, team_id: teamId, player_id: null, assist_player_id: null, players: null, assist_player: null }])
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, score_a: isA ? m.score_a + 1 : m.score_a, score_b: !isA ? m.score_b + 1 : m.score_b, played: true } : m))
    try {
      const { data: ig, error: gErr } = await supabase.from('goals').insert({ match_id: matchId, team_id: teamId, player_id: null })
        .select('*, players!goals_player_id_fkey(name), assist_player:players!goals_assist_player_id_fkey(name)').single()
      if (gErr) throw gErr
      await supabase.from('matches').update({ score_a: isA ? match.score_a + 1 : match.score_a, score_b: !isA ? match.score_b + 1 : match.score_b, played: true }).eq('id', matchId)
      setGoals(prev => prev.map(g => g.id === tempGoalId ? ig : g))
    } catch (e) { loadAll() }
  }

  async function startFirstMatch() {
    if (!pickA || !pickB || pickA === pickB) { alert(t('select_two_teams')); return }
    const { data, error } = await supabase.from('matches').insert({
      session_id: id, team_a_id: pickA, team_b_id: pickB, match_order: 1, round: 1, score_a: 0, score_b: 0, played: false,
    }).select().single()
    if (error) { alert(error.message); return }
    setMatches(prev => [...prev, data])
    await supabase.from('sessions').update({ current_match_id: data.id }).eq('id', id)
    setSession(prev => ({ ...prev, current_match_id: data.id }))
    setPickA(''); setPickB('')
  }

  async function confirmAndAdvance(matchId) {
    const match = matches.find(m => m.id === matchId)
    if (!match) return
    if (!match.played) {
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, played: true } : m))
      await supabase.from('matches').update({ played: true }).eq('id', matchId)
    }
    const allMatches = [...matches].sort((a,b) => a.match_order - b.match_order)
    let nextA, nextB
    if (allMatches.length === 1) {
      const winnerId = match.score_a > match.score_b ? match.team_a_id : match.score_b > match.score_a ? match.team_b_id : match.team_a_id
      const restingTeam = teams.find(tt => tt.id !== match.team_a_id && tt.id !== match.team_b_id)
      if (!restingTeam) { await supabase.from('sessions').update({ current_match_id: null }).eq('id', id); setSession(prev => ({ ...prev, current_match_id: null })); return }
      nextA = winnerId; nextB = restingTeam.id
    } else {
      const prev2 = allMatches[allMatches.length - 2]
      const lastTeams = new Set([match.team_a_id, match.team_b_id])
      const prevTeams = new Set([prev2.team_a_id, prev2.team_b_id])
      const staysId = [...lastTeams].find(tid => !prevTeams.has(tid))
      const comesInTeam = teams.find(tt => !lastTeams.has(tt.id))
      if (!staysId || !comesInTeam) { await supabase.from('sessions').update({ current_match_id: null }).eq('id', id); setSession(prev => ({ ...prev, current_match_id: null })); return }
      nextA = staysId; nextB = comesInTeam.id
    }
    const nextOrder = (match.match_order || 0) + 1
    const { data: newMatch, error } = await supabase.from('matches').insert({
      session_id: id, team_a_id: nextA, team_b_id: nextB, match_order: nextOrder, round: 1, score_a: 0, score_b: 0, played: false,
    }).select().single()
    if (error) { alert(error.message); return }
    setMatches(prev => [...prev, newMatch])
    await supabase.from('sessions').update({ current_match_id: newMatch.id }).eq('id', id)
    setSession(prev => ({ ...prev, current_match_id: newMatch.id }))
    setExpandedMatchId(null)
  }

  async function deleteMatch(matchId) {
    if (!confirm(t('confirm_delete_match'))) return
    const sorted = [...matches].sort((a,b) => a.match_order - b.match_order)
    const idx = sorted.findIndex(m => m.id === matchId)
    const prevMatch = idx > 0 ? sorted[idx - 1] : null
    setMatches(prev => prev.filter(m => m.id !== matchId))
    setGoals(prev => prev.filter(g => g.match_id !== matchId))
    const newCurrentId = session.current_match_id === matchId ? (prevMatch?.id || null) : session.current_match_id
    setSession(prev => ({ ...prev, current_match_id: newCurrentId }))
    try {
      await supabase.from('matches').delete().eq('id', matchId)
      await supabase.from('sessions').update({ current_match_id: newCurrentId }).eq('id', id)
    } catch (e) { loadAll() }
  }

  async function changeMatchTeams(matchId) {
    if (!editTeamA || !editTeamB || editTeamA === editTeamB) { alert(t('select_two_teams')); return }
    if (!confirm(t('change_teams_warn'))) return
    const match = matches.find(m => m.id === matchId)
    if (!match) return
    const scoreA = match.score_a; const scoreB = match.score_b
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, team_a_id: editTeamA, team_b_id: editTeamB } : m))
    setGoals(prev => prev.filter(g => g.match_id !== matchId))
    setEditingTeamsForMatch(null); setEditTeamA(''); setEditTeamB('')
    try {
      await supabase.from('goals').delete().eq('match_id', matchId)
      await supabase.from('matches').update({ team_a_id: editTeamA, team_b_id: editTeamB }).eq('id', matchId)
      const inserts = []
      for (let i = 0; i < scoreA; i++) inserts.push({ match_id: matchId, team_id: editTeamA, player_id: null })
      for (let i = 0; i < scoreB; i++) inserts.push({ match_id: matchId, team_id: editTeamB, player_id: null })
      if (inserts.length > 0) {
        const { data: inserted } = await supabase.from('goals').insert(inserts).select('*, players!goals_player_id_fkey(name), assist_player:players!goals_assist_player_id_fkey(name)')
        if (inserted) setGoals(prev => [...prev, ...inserted])
      }
    } catch (e) { loadAll() }
  }

  async function submitSession() {
    if (!confirm(t('confirm_submit_session'))) return
    setSession(prev => ({ ...prev, submitted: true, current_match_id: null }))
    try { await supabase.from('sessions').update({ submitted: true, current_match_id: null }).eq('id', id) } catch (e) { loadAll() }
  }
  async function reopenSession() {
    if (!confirm(t('confirm_reopen_session'))) return
    setSession(prev => ({ ...prev, submitted: false }))
    try { await supabase.from('sessions').update({ submitted: false }).eq('id', id) } catch (e) { loadAll() }
  }
  async function renameTeam(teamId, currentLabel) {
    const newLabel = prompt(t('rename_team'), currentLabel)
    if (!newLabel || newLabel.trim() === '' || newLabel.trim() === currentLabel) return
    setTeams(prev => prev.map(tt => tt.id === teamId ? { ...tt, label: newLabel.trim() } : tt))
    try { await supabase.from('teams').update({ label: newLabel.trim() }).eq('id', teamId) } catch (e) { loadAll() }
  }
  async function toggleVoting() {
    const open = !session.voting_open
    setSession(prev => ({ ...prev, voting_open: open }))
    try { await supabase.from('sessions').update({ voting_open: open, voting_opened_at: open ? new Date().toISOString() : session.voting_opened_at }).eq('id', id) } catch (e) { loadAll() }
  }
  async function deleteSession() {
    if (!confirm(t('confirm_delete_session'))) return
    navigate('/')
    try { await supabase.from('sessions').delete().eq('id', id) } catch (e) {}
  }

  if (loading) return <p>{t('loading')}</p>
  if (!session) return <p>{t('session_not_found')}</p>

  const live = isToday(session.date)
  const editable = !session.submitted

  const teamStats = teams.map(tt => {
    let played = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0
    matches.forEach(m => {
      if (!m.played) return
      if (m.team_a_id === tt.id) { played++; gf += m.score_a; ga += m.score_b; if (m.score_a > m.score_b) wins++; else if (m.score_a < m.score_b) losses++; else draws++ }
      else if (m.team_b_id === tt.id) { played++; gf += m.score_b; ga += m.score_a; if (m.score_b > m.score_a) wins++; else if (m.score_b < m.score_a) losses++; else draws++ }
    })
    return { ...tt, played, wins, draws, losses, gf, ga, points: wins * 3 + draws }
  }).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga))

  const scorerMap = {}
  goals.forEach(g => { if (g.players) scorerMap[g.players.name] = (scorerMap[g.players.name] || 0) + 1 })
  const topScorers = Object.entries(scorerMap).sort((a, b) => b[1] - a[1])

  const assignedPlayerIds = new Set(teamPlayers.map(tp => tp.player_id))
  const unassignedPlayers = allPlayers.filter(p => !assignedPlayerIds.has(p.id))
  const assignedCount = assignedPlayerIds.size
  const unassignedCount = unassignedPlayers.length

  const PlayerAssignRow = ({ player, currentTeamId }) => (
    <div className="flex items-center justify-between text-sm border-b dark:border-gray-800 last:border-b-0 py-2">
      <span className="flex-1">
        {player.name}
        {currentTeamId && (<span className="text-fulda dark:text-emerald-400 font-bold ml-1">→ {teams.find(tt=>tt.id===currentTeamId)?.label || ''}</span>)}
      </span>
      <div className="flex gap-1 flex-wrap justify-end items-center">
        {teams.map(tt => (
          <button key={tt.id} onClick={() => assignPlayer(player.id, tt.id)} className={`px-2 py-1 rounded text-xs font-semibold ${currentTeamId === tt.id ? 'bg-fulda text-white' : 'bg-gray-200 dark:bg-gray-800 hover:bg-fulda hover:text-white'}`}>{tt.label}</button>
        ))}
        {currentTeamId && <button onClick={() => assignPlayer(player.id, null)} className="text-red-500 text-xs px-1 font-bold">×</button>}
      </div>
    </div>
  )

  const sessionTabs = [
    { key: 'standings', icon: '🏆', label: t('standings') },
    { key: 'teams', icon: '👥', label: t('teams') },
    { key: 'matches', icon: '⚽', label: t('matches') },
  ]

  const sortedMatches = [...matches].sort((a,b) => a.match_order - b.match_order)
  const currentMatchId = session.current_match_id

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{session.name || session.date}</h1>
            {live && <LiveBadge />}
            {session.submitted && <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-full font-semibold">{t('session_submitted')}</span>}
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
                  <li key={name} className="flex justify-between"><span><span className="text-gray-400 w-5 inline-block">{i+1}.</span> {name}</span><span className="font-bold text-fulda dark:text-emerald-400">{n}</span></li>
                ))}
              </ol>
            </section>
          )}

          <section className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-bold mb-2">{t('voting_label')}</h2>
            {session.voting_open
              ? <Link to={`/vote/${id}`} className="inline-block bg-fulda text-white px-4 py-2 rounded-lg font-semibold shadow-sm mb-3">{t('open_voting_page')}</Link>
              : <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('voting_not_open')}</p>}
            {isAdmin && (
              <div className="space-y-3">
                <button onClick={toggleVoting} className="bg-gray-800 dark:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                  {session.voting_open ? t('close_voting') : t('open_voting')}
                </button>
                {session.voting_open && <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{t('share')} <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{window.location.origin}/vote/{id}</code></p>}
                {voteTracker.length > 0 && (
                  <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {t('vote_tracker')} — {voteTracker.filter(v=>v.voted).length}/{voteTracker.length}
                    </div>
                    <div className="divide-y dark:divide-gray-700">
                      {[...voteTracker].sort((a,b) => b.voted - a.voted).map(v => (
                        <div key={v.player_id} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span>{v.name}</span>
                          <span className={v.voted ? 'text-green-600 dark:text-emerald-400 font-semibold text-xs' : 'text-gray-400 text-xs'}>
                            {v.voted ? `✅ ${t('voted')}` : `⏳ ${t('not_voted')}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                {unassignedCount === 0 ? (<p className="text-xs text-gray-400 italic px-1">{t('everyone_assigned')}</p>) : (
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">{t('matches')}</h2>
            {!editable && <span className="text-xs bg-gray-700 text-white px-2 py-1 rounded-full font-semibold">🔒 {t('locked')}</span>}
          </div>
          {matches.length === 0 && isAdmin && teams.length >= 2 && editable && (
            <div className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold mb-3">{t('pick_first_match')}</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <select value={pickA} onChange={e => setPickA(e.target.value)} className="border dark:border-gray-700 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-900">
                  <option value="">— Team A —</option>
                  {teams.map(tt => <option key={tt.id} value={tt.id}>Team {tt.label}</option>)}
                </select>
                <select value={pickB} onChange={e => setPickB(e.target.value)} className="border dark:border-gray-700 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-900">
                  <option value="">— Team B —</option>
                  {teams.map(tt => <option key={tt.id} value={tt.id}>Team {tt.label}</option>)}
                </select>
              </div>
              <button onClick={startFirstMatch} className="w-full bg-fulda text-white py-3 rounded-lg font-bold shadow-sm">{t('start_session_matches')}</button>
            </div>
          )}
          {matches.length === 0 && teams.length < 2 && (<p className="text-sm text-gray-500 dark:text-gray-400">{t('not_enough_teams')}</p>)}
          {sortedMatches.length > 0 && (
            <div className="space-y-2 mt-2">
              {sortedMatches.map(m => {
                const a = teams.find(tt => tt.id === m.team_a_id)
                const b = teams.find(tt => tt.id === m.team_b_id)
                const isCurrent = editable && m.id === currentMatchId
                const isExpanded = isCurrent || expandedMatchId === m.id
                const isEditingTeams = editingTeamsForMatch === m.id
                if (!isExpanded) return (
                  <button key={m.id} onClick={() => setExpandedMatchId(m.id)} className="w-full flex justify-between items-center bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <span className="text-gray-600 dark:text-gray-300"><span className="text-green-600 dark:text-emerald-400 mr-1">✓</span>Match {m.match_order}: Team {a?.label} vs Team {b?.label}</span>
                    <span className="font-bold tabular-nums">{m.score_a}–{m.score_b}</span>
                  </button>
                )
                return (
                  <div key={m.id} className={`border rounded-lg p-3 ${isCurrent ? 'border-fulda bg-white dark:bg-gray-900 shadow-md' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-semibold text-sm">{isCurrent && <span className="text-fulda dark:text-emerald-400 mr-1">▶</span>}Match {m.match_order}: Team {a?.label} vs Team {b?.label}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold tabular-nums">{m.score_a} - {m.score_b}</div>
                        {!isCurrent && <button onClick={() => setExpandedMatchId(null)} className="text-gray-400 text-xs">▲</button>}
                        {isAdmin && editable && <button onClick={() => deleteMatch(m.id)} className="text-red-500 text-xs">❌</button>}
                      </div>
                    </div>
                    {isAdmin && editable && (
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => addGoal(m.id, m.team_a_id)} className="w-full bg-fulda text-white font-bold text-base py-4 rounded-lg shadow-sm active:scale-95 transition">+1 {a?.label}</button>
                        <button onClick={() => addGoal(m.id, m.team_b_id)} className="w-full bg-fulda text-white font-bold text-base py-4 rounded-lg shadow-sm active:scale-95 transition">+1 {b?.label}</button>
                      </div>
                    )}
                    {isAdmin && editable && !isEditingTeams && (
                      <button onClick={() => { setEditingTeamsForMatch(m.id); setEditTeamA(m.team_a_id); setEditTeamB(m.team_b_id) }}
                        className="w-full mt-2 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold">
                        🔄 {t('change_teams')}
                      </button>
                    )}
                    {isAdmin && editable && isEditingTeams && (
                      <div className="mt-2 p-2 border border-fulda rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <select value={editTeamA} onChange={e => setEditTeamA(e.target.value)} className="border dark:border-gray-700 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-900">
                            {teams.map(tt => <option key={tt.id} value={tt.id}>Team {tt.label}</option>)}
                          </select>
                          <select value={editTeamB} onChange={e => setEditTeamB(e.target.value)} className="border dark:border-gray-700 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-900">
                            {teams.map(tt => <option key={tt.id} value={tt.id}>Team {tt.label}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => changeMatchTeams(m.id)} className="flex-1 bg-fulda text-white text-xs py-2 rounded-lg font-semibold">✓</button>
                          <button onClick={() => { setEditingTeamsForMatch(null); setEditTeamA(''); setEditTeamB('') }} className="flex-1 bg-gray-300 dark:bg-gray-700 text-xs py-2 rounded-lg font-semibold">✕</button>
                        </div>
                      </div>
                    )}
                    {isAdmin && isCurrent && editable && (
                      <button onClick={() => confirmAndAdvance(m.id)} className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-sm active:scale-95 transition">✓ {t('submit_score')} → {t('next_match')}</button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {isAdmin && matches.length > 0 && editable && (
            <button onClick={submitSession} className="w-full mt-4 border-2 border-dashed border-fulda text-fulda dark:text-emerald-400 font-bold py-3 rounded-lg hover:bg-fulda hover:text-white">{t('submit_session')}</button>
          )}
          {isAdmin && session.submitted && (
            <button onClick={reopenSession} className="w-full mt-4 bg-gray-700 text-white py-2.5 rounded-lg font-semibold">{t('reopen_session')}</button>
          )}
        </section>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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

function PlayersPage() {
  const { isAdmin } = useAuth()
  const { t } = useT()
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')
  useEffect(() => { load() }, [])
  async function load() { const { data } = await supabase.from('players').select('*').order('name'); setPlayers(data || []) }
  async function add() {
    if (!name.trim()) return
    const tempId = `temp-${Date.now()}`
    const optimistic = { id: tempId, name: name.trim() }
    setPlayers(prev => [...prev, optimistic].sort((a,b) => a.name.localeCompare(b.name)))
    setName('')
    try {
      const { data, error } = await supabase.from('players').insert({ name: optimistic.name }).select().single()
      if (error) throw error
      setPlayers(prev => prev.map(p => p.id === tempId ? data : p).sort((a,b) => a.name.localeCompare(b.name)))
    } catch (e) { setPlayers(prev => prev.filter(p => p.id !== tempId)); alert(e.message || 'Error') }
  }
  async function del(e, idToDelete) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm(t('confirm_delete_player'))) return
    setPlayers(prev => prev.filter(p => p.id !== idToDelete))
    try { await supabase.from('players').delete().eq('id', idToDelete) } catch (e) { load() }
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
          <Link key={p.id} to={`/player/${p.id}`} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <span>{p.name}</span>
            {isAdmin && <button onClick={(e) => del(e, p.id)} className="text-red-500 text-sm">{t('remove')}</button>}
          </Link>
        ))}
        {players.length === 0 && <p className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{t('no_players')}</p>}
      </div>
    </div>
  )
}

function PlayerProfilePage() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const { t } = useT()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [appearances, setAppearances] = useState(0)
  const [goalsCount, setGoalsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  useEffect(() => { load() }, [id])
  async function load() {
    setLoading(true)
    const { data: p } = await supabase.from('players').select('*').eq('id', id).single()
    setPlayer(p)
    const { data: tp } = await supabase.from('team_players').select('team_id, teams!inner(session_id)').eq('player_id', id)
    const sessionIds = new Set((tp || []).map(x => x.teams?.session_id).filter(Boolean))
    setAppearances(sessionIds.size)
    const { data: g } = await supabase.from('goals').select('id').eq('player_id', id)
    setGoalsCount((g || []).length)
    setLoading(false)
  }
  async function rename() {
    const newName = prompt(t('rename_player'), player.name)
    if (!newName || newName.trim() === '' || newName.trim() === player.name) return
    setPlayer(prev => ({ ...prev, name: newName.trim() }))
    try { await supabase.from('players').update({ name: newName.trim() }).eq('id', id) } catch (e) { load() }
  }
  async function del() {
    if (!confirm(t('confirm_delete_player'))) return
    navigate('/players')
    try { await supabase.from('players').delete().eq('id', id) } catch (e) {}
  }
  if (loading) return <p>{t('loading')}</p>
  if (!player) return <p>{t('player_not_found')}</p>
  return (
    <div className="space-y-4">
      <Link to="/players" className="text-sm text-gray-500 dark:text-gray-400">{t('back_to_players')}</Link>
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">{player.name}</h1>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={rename} className="text-sm text-fulda dark:text-emerald-400 font-semibold">✏️ {t('edit')}</button>
              <button onClick={del} className="text-sm text-red-500">{t('remove')}</button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-fulda dark:text-emerald-400">{appearances}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase">{t('appearances')}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-fulda dark:text-emerald-400">{goalsCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase">{t('goals_count')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function VotePage() {
  const { sessionId } = useParams()
  const { t } = useT()
  const [session, setSession] = useState(null)
  const [players, setPlayers] = useState([])
  const [allVotedPlayerIds, setAllVotedPlayerIds] = useState(new Set())
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [existingVotes, setExistingVotes] = useState(null)
  const [votes, setVotes] = useState({ best_player: '', best_goalkeeper: '', best_defender: '', best_goal: '', pepe_award: '' })
  const [editing, setEditing] = useState(false)
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [sessionId])

  async function load() {
    setLoading(true)
    const { data: s } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
    setSession(s)
    const { data: tp } = await supabase.from('team_players').select('players(*), teams!inner(session_id)').eq('teams.session_id', sessionId)
    const uniq = {}; (tp || []).forEach(x => { if (x.players) uniq[x.players.id] = x.players })
    setPlayers(Object.values(uniq).sort((a,b) => a.name.localeCompare(b.name)))
    const { data: allVotes } = await supabase.from('votes').select('voter_player_id').eq('session_id', sessionId).not('voter_player_id', 'is', null)
    setAllVotedPlayerIds(new Set((allVotes || []).map(v => v.voter_player_id)))
    loadResults()
    setLoading(false)
  }

  async function checkAndLoadExistingVotes(playerId) {
    if (!playerId) { setExistingVotes(null); return }
    const { data } = await supabase.from('votes').select('*').eq('session_id', sessionId).eq('voter_player_id', playerId)
    if (data && data.length > 0) {
      setExistingVotes(data)
      const v = { best_player: '', best_goalkeeper: '', best_defender: '', best_goal: '', pepe_award: '' }
      data.forEach(vote => { if (Object.prototype.hasOwnProperty.call(v, vote.category)) v[vote.category] = vote.player_id })
      setVotes(v)
    } else {
      setExistingVotes([])
      setVotes({ best_player: '', best_goalkeeper: '', best_defender: '', best_goal: '', pepe_award: '' })
    }
  }

  async function loadResults() {
    const { data } = await supabase.from('votes').select('*, players(name)').eq('session_id', sessionId)
    const r = {}
    ;(data || []).forEach(v => {
      if (!v.player_id) return
      const key = `${v.category}_${v.player_id}`
      r[key] = (r[key] || { name: v.players?.name, category: v.category, count: 0 })
      r[key].count++
    })
    setResults(r)
  }

  async function cancelMyVote() {
    if (!selectedPlayerId) return
    if (!confirm(t('confirm_cancel_vote'))) return
    await supabase.from('votes').delete().eq('session_id', sessionId).eq('voter_player_id', selectedPlayerId)
    setExistingVotes([])
    setVotes({ best_player: '', best_goalkeeper: '', best_defender: '', best_goal: '', pepe_award: '' })
    setEditing(false)
    setAllVotedPlayerIds(prev => { const s = new Set(prev); s.delete(selectedPlayerId); return s })
    loadResults()
  }
  async function submit() {
    if (!selectedPlayerId) { alert(t('who_are_you')); return }
    const inserts = []
    for (const cat of ['best_player', 'best_goalkeeper', 'best_defender', 'best_goal', 'pepe_award']) {
      if (!votes[cat]) continue
      // Block self-voting

      inserts.push({ session_id: sessionId, category: cat, player_id: votes[cat], voter_player_id: selectedPlayerId })
    }
    if (inserts.length === 0) { alert('Select at least one category'); return }
    await supabase.from('votes').delete().eq('session_id', sessionId).eq('voter_player_id', selectedPlayerId)
    const { error } = await supabase.from('votes').insert(inserts)
    if (error) { alert(error.message); return }
    setExistingVotes(inserts)
    setEditing(false)
    setAllVotedPlayerIds(prev => new Set([...prev, selectedPlayerId]))
    loadResults()
  }

  if (loading) return <p className="p-4">{t('loading')}</p>
  if (!session) return <p className="p-4">{t('session_not_found')}</p>
  if (!session.voting_open) return <p className="p-4">{t('voting_not_open_session')}</p>

  const byCat = (cat) => Object.values(results).filter(r => r.category === cat).sort((a,b) => b.count - a.count)
  const hasVoted = existingVotes && existingVotes.length > 0
  const showForm = !hasVoted || editing

  return (
    <div className="space-y-5 max-w-lg mx-auto px-4 py-5">
      <h1 className="text-2xl font-bold">{t('vote')} — {session.name || session.date}</h1>

      {!selectedPlayerId ? (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-lg">{t('who_are_you')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('anonymous_note')}</p>
          <select value={selectedPlayerId}
            onChange={e => { setSelectedPlayerId(e.target.value); checkAndLoadExistingVotes(e.target.value) }}
            className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-3 text-base">
            <option value="">{t('select_yourself')}</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>{p.name}{allVotedPlayerIds.has(p.id) ? ` — ${t('already_voted')}` : ''}</option>
            ))}
          </select>
        </div>
      ) : (
        <>
<div className="flex items-center justify-between bg-fulda/10 dark:bg-emerald-900/30 border border-fulda/30 rounded-lg px-4 py-2 gap-2">
            <span className="text-sm font-semibold text-fulda dark:text-emerald-400 truncate">👤 {players.find(p=>p.id===selectedPlayerId)?.name}</span>
            <div className="flex gap-2 shrink-0">
              {hasVoted && (
                <button onClick={cancelMyVote} className="text-xs bg-red-500 text-white px-2 py-1 rounded font-semibold">🗑 {t('cancel_my_vote')}</button>
              )}
              <button onClick={() => { setSelectedPlayerId(''); setExistingVotes(null); setEditing(false) }} className="text-xs text-gray-500 underline">{t('back')}</button>
            </div>
          </div>

          {hasVoted && !editing && (
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm text-center space-y-3">
              <p className="text-fulda dark:text-emerald-400 font-semibold">{t('thanks_voting')}</p>
              <button onClick={() => setEditing(true)} className="text-sm border border-fulda text-fulda dark:text-emerald-400 px-4 py-2 rounded-lg font-semibold">{t('edit_vote')}</button>
            </div>
          )}

          {showForm && (
            <div className="space-y-3">
              {/* Pass selectedPlayerId to filter out self from each category */}
              <VoteSection title={t('best_player')} players={players} value={votes.best_player} onChange={v => setVotes({...votes, best_player: v})} />
              <VoteSection title={t('best_keeper')} players={players} value={votes.best_goalkeeper} onChange={v => setVotes({...votes, best_goalkeeper: v})} />
              <VoteSection title={t('best_defender')} players={players} value={votes.best_defender} onChange={v => setVotes({...votes, best_defender: v})} />
              <VoteSection title={t('best_goal')} players={players} value={votes.best_goal} onChange={v => setVotes({...votes, best_goal: v})} hint={t('choose_fav_goal')} />
              <VoteSection title={t('pepe_award')} players={players} value={votes.pepe_award} onChange={v => setVotes({...votes, pepe_award: v})} hint={t('pepe_hint')} />
              <button onClick={submit} className="w-full bg-fulda text-white py-3 rounded-lg font-bold shadow-sm active:scale-95 transition">
                {editing ? t('update_vote') : t('submit_vote')}
              </button>
              {editing && (
                <button onClick={() => setEditing(false)} className="w-full text-sm text-gray-500 dark:text-gray-400 py-2 border border-gray-300 dark:border-gray-700 rounded-lg">
                  {t('cancel')}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Live results — always visible */}
      <div className="space-y-3">
        {[['best_player', t('best_player')], ['best_goalkeeper', t('best_keeper')], ['best_defender', t('best_defender')], ['best_goal', t('best_goal')], ['pepe_award', t('pepe_award')]].map(([cat,label]) => {
          const list = byCat(cat)
          return (
            <div key={cat} className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold mb-2">{label}</h3>
              {list.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_votes')}</p> :
                <ol className="space-y-1 text-sm">{list.map((r, i) => (
                  <li key={r.name} className="flex justify-between">
                    <span><span className="text-gray-400 w-5 inline-block">{i+1}.</span> {r.name}</span>
                    <span className="font-bold text-fulda dark:text-emerald-400">{r.count}</span>
                  </li>
                ))}</ol>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Self excluded from each vote dropdown
function VoteSection({ title, players, value, onChange, hint, excludeId }) {
  const { t } = useT()
  const filtered = excludeId ? players.filter(p => p.id !== excludeId) : players
  return (
    <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
      <h3 className="font-bold mb-2">{title}</h3>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{hint}</p>}
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2">
        <option value="">{t('choose')}</option>
        {filtered.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  )
}

function LeaderboardPage() {
  const { t } = useT()
  const { theme } = useTheme()
  const [awardWinners, setAwardWinners] = useState({ best_player: [], best_goalkeeper: [], best_defender: [], best_goal: [], pepe_award: [] })
  const [goalsBySession, setGoalsBySession] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: sessions } = await supabase.from('sessions').select('id, date, submitted').order('date', { ascending: true })
    const { data: allVotes } = await supabase.from('votes').select('session_id, category, player_id, players(name)')

    const cats = ['best_player', 'best_goalkeeper', 'best_defender', 'best_goal', 'pepe_award']
    const winnerCount = {}

    // Include ALL sessions that have votes (not just submitted) — covers old sessions
    const sessionsWithVotes = new Set((allVotes || []).map(v => v.session_id))
    ;(sessions || []).filter(s => s.submitted || sessionsWithVotes.has(s.id)).forEach(s => {
      const sessionVotes = (allVotes || []).filter(v => v.session_id === s.id && v.player_id)
      cats.forEach(cat => {
        const catVotes = sessionVotes.filter(v => v.category === cat)
        if (catVotes.length === 0) return
        const countMap = {}
        catVotes.forEach(v => { if (v.players?.name) countMap[v.players.name] = (countMap[v.players.name] || 0) + 1 })
        const winner = Object.entries(countMap).sort((a,b) => b[1] - a[1])[0]
        if (winner) {
          if (!winnerCount[winner[0]]) winnerCount[winner[0]] = {}
          winnerCount[winner[0]][cat] = (winnerCount[winner[0]][cat] || 0) + 1
        }
      })
    })

    const newAwards = {}
    cats.forEach(cat => {
      newAwards[cat] = Object.entries(winnerCount)
        .filter(([, c]) => c[cat])
        .map(([name, c]) => [name, c[cat]])
        .sort((a,b) => b[1] - a[1])
    })
    setAwardWinners(newAwards)

    const { data: allGoals } = await supabase.from('goals').select('match_id, matches!inner(session_id)')
    const gc = {}
    ;(allGoals || []).forEach(x => { const sid = x.matches?.session_id; if (sid) gc[sid] = (gc[sid] || 0) + 1 })
    setGoalsBySession((sessions || []).map(s => ({ label: s.date, goals: gc[s.id] || 0 })))
    setLoading(false)
  }

  const Section = ({ title, list }) => (
    <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
      <h3 className="font-bold mb-3">{title}</h3>
      {list.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_data')}</p> :
        <ol className="space-y-1.5 text-sm">{list.slice(0,10).map(([n,c], i) => (
          <li key={n} className="flex justify-between items-center">
            <span><span className="text-gray-400 w-5 inline-block">{i+1}.</span> {n}</span>
            <span className="font-bold text-fulda dark:text-emerald-400 bg-fulda/10 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full text-xs">{c}×</span>
          </li>
        ))}</ol>}
    </div>
  )

  if (loading) return <p>{t('loading')}</p>
  const axisColor = theme === 'dark' ? '#9ca3af' : '#6b7280'
  const hasData = goalsBySession.some(d => d.goals > 0)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('season_lb')}</h1>
      {hasData && (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="font-bold mb-3">{t('goals_per_session')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalsBySession} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="label" stroke={axisColor} tick={{ fontSize: 10 }} />
                <YAxis stroke={axisColor} tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: theme === 'dark' ? '#111827' : '#fff', border: '1px solid #00A859', borderRadius: 8 }} />
                <Bar dataKey="goals" fill="#00A859" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <Section title={t('best_player_wins')} list={awardWinners.best_player || []} />
      <Section title={t('best_keeper_wins')} list={awardWinners.best_goalkeeper || []} />
      <Section title={t('best_defender_wins')} list={awardWinners.best_defender || []} />
      <Section title={t('best_goal_wins')} list={awardWinners.best_goal || []} />
      <Section title={t('pepe_wins')} list={awardWinners.pepe_award || []} />
    </div>
  )
}

function LoginPage() {
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  async function login() { setError(''); setLoading(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); setLoading(false); if (error) { setError(error.message); return } navigate('/') }
  async function logout() { await supabase.auth.signOut(); window.location.reload() }
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

function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/session/:id" element={<SessionPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/player/:id" element={<PlayerProfilePage />} />
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
