import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabase.js'

// =================== AUTH HOOK ===================
function useAuth() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      checkAdmin(session?.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      checkAdmin(session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function checkAdmin(u) {
    if (!u) { setIsAdmin(false); setLoading(false); return }
    const { data } = await supabase.from('admins').select('email').eq('email', u.email).maybeSingle()
    setIsAdmin(!!data)
    setLoading(false)
  }

  return { user, isAdmin, loading }
}

// =================== LAYOUT ===================
function Layout({ children }) {
  const { isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Detect if we're on a session detail page
  const sessionMatch = location.pathname.match(/^\/session\/([^/]+)/)
  const inSession = !!sessionMatch
  const sessionId = sessionMatch ? sessionMatch[1] : null

  // Top-level nav items
  const topNav = [
    { to: '/',            icon: '🏠', label: 'Sessions',    active: location.pathname === '/' },
    { to: '/players',     icon: '👥', label: 'Players',     active: location.pathname === '/players' },
    { to: '/leaderboard', icon: '⭐', label: 'Leaderboard', active: location.pathname === '/leaderboard' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      {/* HEADER */}
      <header className="bg-fulda text-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {inSession && (
              <button onClick={() => navigate('/')} className="text-white/90 hover:text-white text-sm">← Back</button>
            )}
            <Link to="/" className="text-lg font-bold">⚽ Futsal Kurs</Link>
          </div>
          {isAdmin
            ? <span className="bg-white text-fulda px-2 py-0.5 rounded text-xs font-bold">ADMIN</span>
            : <Link to="/login" className="bg-white text-fulda px-2 py-0.5 rounded text-xs font-bold">Login</Link>}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-3xl mx-auto px-4 py-5">{children}</main>

      {/* BOTTOM NAV (only on top-level pages, not in session) */}
      {!inSession && (
        <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-3xl mx-auto grid grid-cols-3">
            {topNav.map(item => (
              <Link key={item.to} to={item.to} className={`flex flex-col items-center py-2.5 transition ${item.active ? 'text-fulda' : 'text-gray-500'}`}>
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
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    const { data } = await supabase.from('sessions').select('*').order('date', { ascending: false })
    setSessions(data || [])
    setLoading(false)
  }

  async function createSession() {
    const today = new Date().toISOString().split('T')[0]
    const numTeams = parseInt(prompt('How many teams? (2 to 10)', '3') || '3')
    if (numTeams < 2 || numTeams > 10) { alert('Must be between 2 and 10'); return }
    const { data, error } = await supabase.from('sessions')
      .insert({ date: today, num_teams: numTeams, name: `Session ${today}` })
      .select().single()
    if (error) { alert(error.message); return }
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].slice(0, numTeams)
    await supabase.from('teams').insert(labels.map(l => ({ session_id: data.id, label: l })))
    navigate(`/session/${data.id}`)
  }

  if (loading) return <p>Loading…</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sessions</h1>
        {isAdmin && <button onClick={createSession} className="bg-fulda text-white px-4 py-2 rounded-lg font-semibold shadow-sm active:scale-95 transition">+ New</button>}
      </div>
      {sessions.length === 0 && <p className="text-gray-500 text-sm">No sessions yet.</p>}
      <div className="space-y-3">
        {sessions.map(s => (
          <Link key={s.id} to={`/session/${s.id}`} className="block bg-white border rounded-xl p-4 shadow-sm hover:shadow active:scale-[0.99] transition">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{s.name || s.date}</div>
                <div className="text-sm text-gray-500 mt-0.5">{s.date} · {s.num_teams} teams</div>
              </div>
              {s.voting_open && <span className="bg-fulda text-white text-xs px-2 py-1 rounded-full font-semibold">VOTING</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// =================== SESSION DETAIL ===================
function SessionPage() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const [session, setSession] = useState(null)
  const [teams, setTeams] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [teamPlayers, setTeamPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [assistPickerFor, setAssistPickerFor] = useState(null)
  const [activeTab, setActiveTab] = useState('standings') // 'standings' | 'teams' | 'matches'

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
    setSession(sRes.data)
    setTeams(tRes.data || [])
    setAllPlayers(pRes.data || [])
    setTeamPlayers(tpRes.data || [])
    setMatches(mRes.data || [])
    setGoals(gRes.data || [])
    setLoading(false)
  }

  async function assignPlayer(playerId, teamId) {
    const sessionTeamIds = teams.map(t => t.id)
    const player = allPlayers.find(p => p.id === playerId)
    const targetTeam = teams.find(t => t.id === teamId)

    setTeamPlayers(prev => {
      const filtered = prev.filter(tp => !(tp.player_id === playerId && sessionTeamIds.includes(tp.team_id)))
      if (teamId && player && targetTeam) {
        filtered.push({
          id: `temp-${Date.now()}`,
          player_id: playerId,
          team_id: teamId,
          players: player,
          teams: { session_id: id },
        })
      }
      return filtered
    })

    try {
      await supabase.from('team_players').delete().eq('player_id', playerId).in('team_id', sessionTeamIds)
      if (teamId) await supabase.from('team_players').insert({ player_id: playerId, team_id: teamId })
    } catch (e) {
      loadAll()
    }
  }

  async function generateMatches() {
    if (matches.length > 0) {
      if (!confirm('Matches already exist. Delete and regenerate?')) return
      await supabase.from('matches').delete().eq('session_id', id)
    }
    const rounds = parseInt(prompt('How many rounds? (each round = every team plays every other team once)', '3') || '3')
    if (rounds < 1 || rounds > 20) { alert('Must be between 1 and 20'); return }
    const list = []
    let order = 1
    for (let r = 1; r <= rounds; r++) {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          list.push({ session_id: id, team_a_id: teams[i].id, team_b_id: teams[j].id, match_order: order++, round: r })
        }
      }
    }
    await supabase.from('matches').insert(list)
    loadAll()
  }

  async function addRound() {
    const maxRound = matches.length === 0 ? 0 : Math.max(...matches.map(m => m.round || 1))
    const newRound = maxRound + 1
    const maxOrder = matches.length === 0 ? 0 : Math.max(...matches.map(m => m.match_order))
    let order = maxOrder + 1
    const list = []
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        list.push({ session_id: id, team_a_id: teams[i].id, team_b_id: teams[j].id, match_order: order++, round: newRound })
      }
    }
    await supabase.from('matches').insert(list)
    loadAll()
  }

  async function addMatchToRound(roundNum) {
    if (teams.length < 2) { alert('Need at least 2 teams'); return }
    const labelList = teams.map(t => t.label).join(', ')
    const aLabel = prompt(`First team label? (${labelList})`)
    if (!aLabel) return
    const bLabel = prompt(`Second team label? (${labelList})`)
    if (!bLabel) return
    const a = teams.find(t => t.label.toLowerCase() === aLabel.trim().toLowerCase())
    const b = teams.find(t => t.label.toLowerCase() === bLabel.trim().toLowerCase())
    if (!a || !b) { alert('Team label not found'); return }
    if (a.id === b.id) { alert('Choose two different teams'); return }
    const maxOrder = matches.length === 0 ? 0 : Math.max(...matches.map(m => m.match_order))
    await supabase.from('matches').insert({
      session_id: id, team_a_id: a.id, team_b_id: b.id, match_order: maxOrder + 1, round: roundNum,
    })
    loadAll()
  }

  async function deleteRound(roundNum) {
    if (!confirm(`Delete all matches in Round ${roundNum}?`)) return
    await supabase.from('matches').delete().eq('session_id', id).eq('round', roundNum)
    loadAll()
  }

  async function deleteMatch(matchId) {
    if (!confirm('Delete this match?')) return
    await supabase.from('matches').delete().eq('id', matchId)
    loadAll()
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

  async function deleteGoal(goalId) {
    if (!confirm('Delete this goal?')) return
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
    setAssistPickerFor(null)
    loadAll()
  }

  async function renameTeam(teamId, currentLabel) {
    const newLabel = prompt('New team name:', currentLabel)
    if (!newLabel || newLabel.trim() === '' || newLabel.trim() === currentLabel) return
    await supabase.from('teams').update({ label: newLabel.trim() }).eq('id', teamId)
    loadAll()
  }

  async function toggleVoting() {
    const open = !session.voting_open
    await supabase.from('sessions').update({ voting_open: open, voting_opened_at: open ? new Date().toISOString() : session.voting_opened_at }).eq('id', id)
    loadAll()
  }

  async function deleteSession() {
    if (!confirm('Delete this entire session? This cannot be undone.')) return
    await supabase.from('sessions').delete().eq('id', id)
    window.location.href = '/'
  }

  if (loading) return <p>Loading…</p>
  if (!session) return <p>Session not found.</p>

  const teamStats = teams.map(t => {
    let played = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0
    matches.forEach(m => {
      if (!m.played) return
      if (m.team_a_id === t.id) {
        played++; gf += m.score_a; ga += m.score_b
        if (m.score_a > m.score_b) wins++
        else if (m.score_a < m.score_b) losses++
        else draws++
      } else if (m.team_b_id === t.id) {
        played++; gf += m.score_b; ga += m.score_a
        if (m.score_b > m.score_a) wins++
        else if (m.score_b < m.score_a) losses++
        else draws++
      }
    })
    return { ...t, played, wins, draws, losses, gf, ga, points: wins * 3 + draws }
  }).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga))

  const scorerMap = {}
  goals.forEach(g => {
    if (!g.players) return
    const name = g.players.name
    scorerMap[name] = (scorerMap[name] || 0) + 1
  })
  const topScorers = Object.entries(scorerMap).sort((a, b) => b[1] - a[1])

  const GoalRow = ({ g, samePool }) => {
    const isPicking = assistPickerFor === g.id
    return (
      <div className="flex items-center justify-between text-sm bg-gray-50 px-2 py-1.5 rounded-lg">
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <span>⚽ {g.players?.name || 'Team Goal'}</span>
          {g.assist_player?.name && <span>🎯 {g.assist_player.name}</span>}
          {isAdmin && g.player_id && !g.assist_player_id && !isPicking && (
            <button onClick={() => setAssistPickerFor(g.id)} className="text-xs text-fulda underline">+ assist</button>
          )}
          {isAdmin && isPicking && (
            <select autoFocus onChange={e => setAssist(g.id, e.target.value)} onBlur={() => setAssistPickerFor(null)} className="text-xs border rounded px-1 py-0.5">
              <option value="">— pick assist —</option>
              {samePool.filter(p => p.player_id !== g.player_id).map(p => <option key={p.id} value={p.player_id}>{p.players?.name}</option>)}
            </select>
          )}
        </div>
        {isAdmin && <button onClick={() => deleteGoal(g.id)} className="text-red-500 text-base ml-2 leading-none">❌</button>}
      </div>
    )
  }

  const sessionTabs = [
    { key: 'standings', icon: '🏆', label: 'Standings' },
    { key: 'teams',     icon: '👥', label: 'Teams' },
    { key: 'matches',   icon: '⚽', label: 'Matches' },
  ]

  return (
    <div className="space-y-5 pb-20">
      {/* Session header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{session.name || session.date}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{session.date} · {session.num_teams} teams</p>
        </div>
        {isAdmin && <button onClick={deleteSession} className="text-red-600 text-sm">Delete</button>}
      </div>

      {/* ============ STANDINGS TAB ============ */}
      {activeTab === 'standings' && (
        <>
          <section className="bg-white border rounded-xl p-4 shadow-sm">
            <h2 className="font-bold mb-3">Standings</h2>
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs uppercase">
                <tr><th className="text-left pb-2">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>Pts</th></tr>
              </thead>
              <tbody>
                {teamStats.map((t, i) => (
                  <tr key={t.id} className={`${i === 0 && t.played > 0 ? 'font-bold text-fulda' : ''} border-t`}>
                    <td className="text-left py-2">{i === 0 && t.played > 0 ? '🏆 ' : ''}Team {t.label}</td>
                    <td className="text-center">{t.played}</td><td className="text-center">{t.wins}</td><td className="text-center">{t.draws}</td><td className="text-center">{t.losses}</td>
                    <td className="text-center">{t.gf}</td><td className="text-center">{t.ga}</td><td className="text-center font-semibold">{t.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {topScorers.length > 0 && (
            <section className="bg-white border rounded-xl p-4 shadow-sm">
              <h2 className="font-bold mb-3">⭐ Top scorers (this session)</h2>
              <ol className="space-y-1.5 text-sm">
                {topScorers.map(([name, n], i) => (
                  <li key={name} className="flex justify-between">
                    <span><span className="text-gray-400 w-5 inline-block">{i+1}.</span> {name}</span>
                    <span className="font-bold text-fulda">{n}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="bg-white border rounded-xl p-4 shadow-sm">
            <h2 className="font-bold mb-2">🗳 Voting</h2>
            {session.voting_open
              ? <Link to={`/vote/${id}`} className="inline-block bg-fulda text-white px-4 py-2 rounded-lg font-semibold shadow-sm">Open voting page →</Link>
              : <p className="text-sm text-gray-500">Voting not open yet.</p>}
            {isAdmin && (
              <div className="mt-3">
                <button onClick={toggleVoting} className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                  {session.voting_open ? 'Close voting' : 'Open voting'}
                </button>
                {session.voting_open && <p className="text-xs text-gray-500 mt-2 break-all">Share: <code className="bg-gray-100 px-1 rounded">{window.location.origin}/vote/{id}</code></p>}
              </div>
            )}
          </section>
        </>
      )}

      {/* ============ TEAMS TAB ============ */}
      {activeTab === 'teams' && (
        <section className="bg-white border rounded-xl p-4 shadow-sm">
          <h2 className="font-bold mb-3">Teams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teams.map(t => {
              const players = teamPlayers.filter(tp => tp.team_id === t.id)
              return (
                <div key={t.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="font-semibold mb-2 flex items-center justify-between">
                    <span>Team {t.label} <span className="text-gray-400 font-normal">({players.length})</span></span>
                    {isAdmin && <button onClick={() => renameTeam(t.id, t.label)} className="text-xs text-gray-500 hover:text-fulda">✏️</button>}
                  </div>
                  <ul className="text-sm space-y-1">
                    {players.map(p => <li key={p.id} className="flex justify-between items-center">
                      <span>{p.players?.name}</span>
                      {isAdmin && <button onClick={() => assignPlayer(p.player_id, null)} className="text-red-500 text-xs">remove</button>}
                    </li>)}
                    {players.length === 0 && <li className="text-xs text-gray-400 italic">No players yet</li>}
                  </ul>
                </div>
              )
            })}
          </div>
          {isAdmin && (
            <div className="mt-5">
              <h3 className="font-semibold text-sm mb-2">Assign players (tap player → team)</h3>
              <div className="space-y-1 max-h-80 overflow-y-auto border rounded-lg p-2">
                {allPlayers.map(p => {
                  const assigned = teamPlayers.find(tp => tp.player_id === p.id)
                  return (
                    <div key={p.id} className="flex items-center justify-between text-sm border-b last:border-b-0 py-1.5">
                      <span>{p.name} {assigned && <span className="text-fulda font-bold">→ {teams.find(t=>t.id===assigned.team_id)?.label || ''}</span>}</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {teams.map(t => (
                          <button key={t.id} onClick={() => assignPlayer(p.id, t.id)} className="bg-gray-200 hover:bg-fulda hover:text-white px-2 py-1 rounded text-xs font-semibold">{t.label}</button>
                        ))}
                        {assigned && <button onClick={() => assignPlayer(p.id, null)} className="text-red-500 text-xs px-1">x</button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============ MATCHES TAB ============ */}
      {activeTab === 'matches' && (
        <section className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">Matches</h2>
            {isAdmin && matches.length === 0 && <button onClick={generateMatches} className="bg-fulda text-white px-3 py-1.5 rounded-lg text-sm font-semibold">Generate matches</button>}
          </div>
          {matches.length === 0 && <p className="text-sm text-gray-500">No matches yet. Click "Generate matches" once teams are set.</p>}

          {(() => {
            const rounds = [...new Set(matches.map(m => m.round || 1))].sort((a,b) => a-b)
            return rounds.map(roundNum => {
              const roundMatches = matches.filter(m => (m.round || 1) === roundNum)
              return (
                <div key={roundNum} className="mb-5">
                  <div className="flex justify-between items-center bg-fulda text-white px-3 py-2 rounded-t-lg">
                    <h3 className="font-bold">🏆 Round {roundNum}</h3>
                    {isAdmin && <button onClick={() => deleteRound(roundNum)} className="text-xs bg-white text-fulda px-2 py-1 rounded font-semibold">🗑 Delete</button>}
                  </div>
                  <div className="border border-t-0 rounded-b-lg p-3 space-y-3 bg-gray-50">
                    {roundMatches.map(m => {
                      const a = teams.find(t => t.id === m.team_a_id)
                      const b = teams.find(t => t.id === m.team_b_id)
                      const aPlayers = teamPlayers.filter(tp => tp.team_id === m.team_a_id)
                      const bPlayers = teamPlayers.filter(tp => tp.team_id === m.team_b_id)
                      const aGoals = goals.filter(g => g.match_id === m.id && g.team_id === m.team_a_id)
                      const bGoals = goals.filter(g => g.match_id === m.id && g.team_id === m.team_b_id)
                      return (
                        <div key={m.id} className="border rounded-lg p-3 bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-semibold text-sm">Match {m.match_order}: Team {a?.label} vs Team {b?.label}</div>
                            <div className="flex items-center gap-2">
                              <div className="text-xl font-bold tabular-nums">{m.score_a} - {m.score_b}</div>
                              {isAdmin && <button onClick={() => deleteMatch(m.id)} className="text-red-500 text-xs">❌</button>}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {/* TEAM A column */}
                            <div className="space-y-2">
                              {isAdmin && (
                                <>
                                  <button onClick={() => addGoal(m.id, m.team_a_id, null)} className="w-full bg-fulda text-white font-bold text-base py-3 rounded-lg shadow-sm active:scale-95 transition">
                                    +1 {a?.label}
                                  </button>
                                  <select onChange={e => { if (e.target.value) { addGoal(m.id, m.team_a_id, e.target.value); e.target.value='' } }} className="w-full border rounded-lg px-2 py-1.5 text-xs text-gray-600 bg-white">
                                    <option value="">or pick scorer…</option>
                                    {aPlayers.map(p => <option key={p.id} value={p.player_id}>{p.players?.name}</option>)}
                                  </select>
                                </>
                              )}
                              {aGoals.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <div className="text-xs font-semibold text-gray-500">Team {a?.label}</div>
                                  {aGoals.map(g => <GoalRow key={g.id} g={g} samePool={aPlayers} />)}
                                </div>
                              )}
                            </div>

                            {/* TEAM B column */}
                            <div className="space-y-2">
                              {isAdmin && (
                                <>
                                  <button onClick={() => addGoal(m.id, m.team_b_id, null)} className="w-full bg-fulda text-white font-bold text-base py-3 rounded-lg shadow-sm active:scale-95 transition">
                                    +1 {b?.label}
                                  </button>
                                  <select onChange={e => { if (e.target.value) { addGoal(m.id, m.team_b_id, e.target.value); e.target.value='' } }} className="w-full border rounded-lg px-2 py-1.5 text-xs text-gray-600 bg-white">
                                    <option value="">or pick scorer…</option>
                                    {bPlayers.map(p => <option key={p.id} value={p.player_id}>{p.players?.name}</option>)}
                                  </select>
                                </>
                              )}
                              {bGoals.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <div className="text-xs font-semibold text-gray-500">Team {b?.label}</div>
                                  {bGoals.map(g => <GoalRow key={g.id} g={g} samePool={bPlayers} />)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {isAdmin && (
                      <button onClick={() => addMatchToRound(roundNum)} className="w-full text-xs border border-dashed border-fulda text-fulda py-2 rounded-lg hover:bg-fulda hover:text-white font-semibold">
                        + Add match to Round {roundNum}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          })()}

          {isAdmin && matches.length > 0 && (
            <button onClick={addRound} className="w-full mt-3 border-2 border-dashed border-fulda text-fulda font-semibold py-2.5 rounded-lg hover:bg-fulda hover:text-white">
              + Add another round
            </button>
          )}
        </section>
      )}

      {/* SESSION BOTTOM TABS */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto grid grid-cols-3">
          {sessionTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex flex-col items-center py-2.5 transition ${activeTab === tab.key ? 'text-fulda' : 'text-gray-500'}`}>
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
    if (!confirm('Remove this player?')) return
    await supabase.from('players').delete().eq('id', id); load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Players <span className="text-gray-400 font-normal">({players.length})</span></h1>
      {isAdmin && (
        <div className="flex gap-2 mb-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Player name" className="flex-1 border rounded-lg px-3 py-2" onKeyDown={e => e.key === 'Enter' && add()} />
          <button onClick={add} className="bg-fulda text-white px-4 rounded-lg font-semibold shadow-sm">Add</button>
        </div>
      )}
      <div className="bg-white border rounded-xl divide-y shadow-sm">
        {players.map(p => (
          <div key={p.id} className="px-4 py-3 flex justify-between items-center">
            <span>{p.name}</span>
            {isAdmin && <button onClick={() => del(p.id)} className="text-red-500 text-sm">Remove</button>}
          </div>
        ))}
        {players.length === 0 && <p className="px-4 py-3 text-gray-500 text-sm">No players yet.</p>}
      </div>
    </div>
  )
}

// =================== VOTE PAGE ===================
function VotePage() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [players, setPlayers] = useState([])
  const [goals, setGoals] = useState([])
  const [votes, setVotes] = useState({ best_player: '', best_goalkeeper: '', best_goal: '' })
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState({})
  const fingerprint = getFingerprint()

  useEffect(() => { load() }, [sessionId])

  async function load() {
    const { data: s } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
    setSession(s)
    const { data: tp } = await supabase.from('team_players').select('players(*), teams!inner(session_id)').eq('teams.session_id', sessionId)
    const uniq = {}; (tp || []).forEach(t => { if (t.players) uniq[t.players.id] = t.players })
    setPlayers(Object.values(uniq))
    const { data: g } = await supabase.from('goals').select('*, players(name), matches!inner(session_id)').eq('matches.session_id', sessionId)
    setGoals(g || [])
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

  if (!session) return <p>Loading…</p>
  if (!session.voting_open) return <p>Voting is not open for this session.</p>

  const byCat = (cat) => Object.values(results).filter(r => r.category === cat).sort((a,b) => b.count - a.count)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Vote — {session.name || session.date}</h1>

      {!submitted ? (
        <div className="space-y-3">
          <VoteSection title="🏆 Best Player" players={players} value={votes.best_player} onChange={v => setVotes({...votes, best_player: v})} />
          <VoteSection title="🧤 Best Goalkeeper" players={players} value={votes.best_goalkeeper} onChange={v => setVotes({...votes, best_goalkeeper: v})} />
          <VoteSection title="⚽ Best Goal" players={players} value={votes.best_goal} onChange={v => setVotes({...votes, best_goal: v})} hint="Choose who scored your favourite goal" />
          <button onClick={submit} className="w-full bg-fulda text-white py-3 rounded-lg font-bold shadow-sm">Submit vote</button>
        </div>
      ) : (
        <p className="text-fulda font-semibold">✅ Thanks for voting! See live results below.</p>
      )}

      <div className="space-y-3">
        {[
          ['best_player','🏆 Best Player'],
          ['best_goalkeeper','🧤 Best Goalkeeper'],
          ['best_goal','⚽ Best Goal'],
        ].map(([cat,label]) => {
          const list = byCat(cat)
          return (
            <div key={cat} className="bg-white border rounded-xl p-4 shadow-sm">
              <h3 className="font-bold mb-2">{label}</h3>
              {list.length === 0 ? <p className="text-sm text-gray-500">No votes yet.</p> :
                <ol className="space-y-1 text-sm">{list.map((r, i) => <li key={r.name} className="flex justify-between"><span><span className="text-gray-400 w-5 inline-block">{i+1}.</span> {r.name}</span><span className="font-bold text-fulda">{r.count}</span></li>)}</ol>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

function VoteSection({ title, players, value, onChange, hint }) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <h3 className="font-bold mb-2">{title}</h3>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border rounded-lg px-3 py-2">
        <option value="">— choose —</option>
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
  const [scorers, setScorers] = useState([])
  const [bestPlayers, setBestPlayers] = useState([])
  const [bestKeepers, setBestKeepers] = useState([])

  useEffect(() => { load() }, [])
  async function load() {
    const { data: g } = await supabase.from('goals').select('players(name)')
    const sm = {}; (g||[]).forEach(x => { if (x.players) sm[x.players.name] = (sm[x.players.name]||0)+1 })
    setScorers(Object.entries(sm).sort((a,b)=>b[1]-a[1]))

    const { data: vp } = await supabase.from('votes').select('players(name), category').eq('category','best_player')
    const pm = {}; (vp||[]).forEach(x => { if (x.players) pm[x.players.name] = (pm[x.players.name]||0)+1 })
    setBestPlayers(Object.entries(pm).sort((a,b)=>b[1]-a[1]))

    const { data: vk } = await supabase.from('votes').select('players(name), category').eq('category','best_goalkeeper')
    const km = {}; (vk||[]).forEach(x => { if (x.players) km[x.players.name] = (km[x.players.name]||0)+1 })
    setBestKeepers(Object.entries(km).sort((a,b)=>b[1]-a[1]))
  }

  const Section = ({ title, list }) => (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <h3 className="font-bold mb-3">{title}</h3>
      {list.length === 0 ? <p className="text-sm text-gray-500">No data yet.</p> :
        <ol className="space-y-1.5 text-sm">{list.slice(0,10).map(([n,c], i) => <li key={n} className="flex justify-between"><span><span className="text-gray-400 w-5 inline-block">{i+1}.</span> {n}</span><span className="font-bold text-fulda">{c}</span></li>)}</ol>}
    </div>
  )
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Season Leaderboard</h1>
      <Section title="⚽ Top Scorers" list={scorers} />
      <Section title="🏆 Most Best Player Awards" list={bestPlayers} />
      <Section title="🧤 Most Best Goalkeeper Awards" list={bestKeepers} />
    </div>
  )
}

// =================== LOGIN ===================
function LoginPage() {
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
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="max-w-sm mx-auto bg-white border rounded-xl p-6 shadow-sm">
      <h1 className="text-xl font-bold mb-4">Admin Login</h1>
      <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" className="w-full border rounded-lg px-3 py-2 mb-3" />
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full border rounded-lg px-3 py-2 mb-3" onKeyDown={e => e.key === 'Enter' && login()} />
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <button onClick={login} disabled={loading} className="w-full bg-fulda text-white py-2 rounded-lg font-semibold mb-2 shadow-sm">{loading ? 'Logging in…' : 'Log in'}</button>
      <button onClick={logout} className="w-full text-gray-500 text-sm">Log out</button>
    </div>
  )
}

// =================== APP ROOT ===================
function App() {
  return (
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
  )
}

export default App
