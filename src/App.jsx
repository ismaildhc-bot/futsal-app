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
  const { user, isAdmin } = useAuth()
  const location = useLocation()
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-fulda text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">⚽ Futsal Kurs</Link>
          <nav className="flex gap-3 text-sm items-center">
            <Link to="/" className={location.pathname === '/' ? 'underline' : ''}>Sessions</Link>
            <Link to="/players" className={location.pathname === '/players' ? 'underline' : ''}>Players</Link>
            <Link to="/leaderboard" className={location.pathname === '/leaderboard' ? 'underline' : ''}>Leaderboard</Link>
            {isAdmin
              ? <span className="bg-white text-fulda px-2 py-1 rounded text-xs font-bold">ADMIN</span>
              : <Link to="/login" className="bg-white text-fulda px-2 py-1 rounded text-xs font-bold">Admin Login</Link>}
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
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
        {isAdmin && <button onClick={createSession} className="bg-fulda text-white px-4 py-2 rounded font-semibold">+ New Session</button>}
      </div>
      {sessions.length === 0 && <p className="text-gray-500">No sessions yet.</p>}
      <div className="space-y-3">
        {sessions.map(s => (
          <Link key={s.id} to={`/session/${s.id}`} className="block bg-white border rounded-lg p-4 shadow-sm hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{s.name || s.date}</div>
                <div className="text-sm text-gray-500">{s.date} · {s.num_teams} teams</div>
              </div>
              {s.voting_open && <span className="bg-fulda text-white text-xs px-2 py-1 rounded">VOTING OPEN</span>}
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

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [sRes, tRes, pRes, tpRes, mRes, gRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('id', id).single(),
      supabase.from('teams').select('*').eq('session_id', id).order('label'),
      supabase.from('players').select('*').order('name'),
      supabase.from('team_players').select('*, players(*), teams!inner(session_id)').eq('teams.session_id', id),
      supabase.from('matches').select('*').eq('session_id', id).order('match_order'),
      supabase.from('goals').select('*, players(name), matches!inner(session_id)').eq('matches.session_id', id),
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
    // remove from any team in this session
    const sessionTeamIds = teams.map(t => t.id)
    await supabase.from('team_players').delete().eq('player_id', playerId).in('team_id', sessionTeamIds)
    if (teamId) await supabase.from('team_players').insert({ player_id: playerId, team_id: teamId })
    loadAll()
  }

  async function generateMatches() {
    if (matches.length > 0) {
      if (!confirm('Matches already exist. Delete and regenerate?')) return
      await supabase.from('matches').delete().eq('session_id', id)
    }
    const list = []
    let order = 1
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        list.push({ session_id: id, team_a_id: teams[i].id, team_b_id: teams[j].id, match_order: order++ })
      }
    }
    await supabase.from('matches').insert(list)
    loadAll()
  }

  async function addGoal(matchId, teamId, playerId) {
    await supabase.from('goals').insert({ match_id: matchId, team_id: teamId, player_id: playerId })
    const match = matches.find(m => m.id === matchId)
    const isA = match.team_a_id === teamId
    await supabase.from('matches').update({
      score_a: isA ? match.score_a + 1 : match.score_a,
      score_b: !isA ? match.score_b + 1 : match.score_b,
      played: true,
    }).eq('id', matchId)
    loadAll()
  }

  async function removeLastGoal(matchId, teamId) {
    const match = matches.find(m => m.id === matchId)
    const teamGoals = goals.filter(g => g.match_id === matchId && g.team_id === teamId)
    if (teamGoals.length === 0) return
    const last = teamGoals[teamGoals.length - 1]
    await supabase.from('goals').delete().eq('id', last.id)
    const isA = match.team_a_id === teamId
    await supabase.from('matches').update({
      score_a: isA ? Math.max(0, match.score_a - 1) : match.score_a,
      score_b: !isA ? Math.max(0, match.score_b - 1) : match.score_b,
    }).eq('id', matchId)
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

  // Stats per team
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

  // Top scorers in this session
  const scorerMap = {}
  goals.forEach(g => {
    const name = g.players?.name || 'Unknown'
    scorerMap[name] = (scorerMap[name] || 0) + 1
  })
  const topScorers = Object.entries(scorerMap).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{session.name || session.date}</h1>
          <p className="text-sm text-gray-500">{session.date} · {session.num_teams} teams</p>
        </div>
        {isAdmin && <button onClick={deleteSession} className="text-red-600 text-sm">Delete</button>}
      </div>

      {/* Standings */}
      <section className="bg-white border rounded-lg p-4">
        <h2 className="font-bold mb-2">Standings</h2>
        <table className="w-full text-sm">
          <thead className="text-gray-500"><tr><th className="text-left">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>Pts</th></tr></thead>
          <tbody>
            {teamStats.map((t, i) => (
              <tr key={t.id} className={i === 0 && t.played > 0 ? 'font-bold text-fulda' : ''}>
                <td className="text-left">{i === 0 && t.played > 0 ? '🏆 ' : ''}Team {t.label}</td>
                <td className="text-center">{t.played}</td><td className="text-center">{t.wins}</td><td className="text-center">{t.draws}</td><td className="text-center">{t.losses}</td>
                <td className="text-center">{t.gf}</td><td className="text-center">{t.ga}</td><td className="text-center">{t.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Teams & roster */}
      <section className="bg-white border rounded-lg p-4">
        <h2 className="font-bold mb-2">Teams</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teams.map(t => {
            const players = teamPlayers.filter(tp => tp.team_id === t.id)
            return (
              <div key={t.id} className="border rounded p-3">
                <div className="font-semibold mb-1">Team {t.label} ({players.length})</div>
                <ul className="text-sm">
                  {players.map(p => <li key={p.id} className="flex justify-between">
                    <span>{p.players?.name}</span>
                    {isAdmin && <button onClick={() => assignPlayer(p.player_id, null)} className="text-red-500 text-xs">remove</button>}
                  </li>)}
                </ul>
              </div>
            )
          })}
        </div>
        {isAdmin && (
          <div className="mt-4">
            <h3 className="font-semibold text-sm mb-2">Assign players (tap player → team)</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {allPlayers.map(p => {
                const assigned = teamPlayers.find(tp => tp.player_id === p.id)
                return (
                  <div key={p.id} className="flex items-center justify-between text-sm border-b py-1">
                    <span>{p.name} {assigned && <span className="text-fulda font-bold">→ {assigned.teams?.session_id ? teams.find(t=>t.id===assigned.team_id)?.label : ''}</span>}</span>
                    <div className="flex gap-1">
                      {teams.map(t => (
                        <button key={t.id} onClick={() => assignPlayer(p.id, t.id)} className="bg-gray-200 hover:bg-fulda hover:text-white px-2 py-1 rounded text-xs">{t.label}</button>
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

      {/* Matches */}
      <section className="bg-white border rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold">Matches</h2>
          {isAdmin && <button onClick={generateMatches} className="bg-fulda text-white px-3 py-1 rounded text-sm">Generate matches</button>}
        </div>
        {matches.length === 0 && <p className="text-sm text-gray-500">No matches yet. Click "Generate matches" once teams are set.</p>}
        <div className="space-y-3">
          {matches.map(m => {
            const a = teams.find(t => t.id === m.team_a_id)
            const b = teams.find(t => t.id === m.team_b_id)
            const aPlayers = teamPlayers.filter(tp => tp.team_id === m.team_a_id)
            const bPlayers = teamPlayers.filter(tp => tp.team_id === m.team_b_id)
            return (
              <div key={m.id} className="border rounded p-3">
                <div className="flex justify-between items-center">
                  <div className="font-semibold">Match {m.match_order}: Team {a?.label} vs Team {b?.label}</div>
                  <div className="text-xl font-bold">{m.score_a} - {m.score_b}</div>
                </div>
                {isAdmin && (
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <div className="font-semibold mb-1">Team {a?.label} goal:</div>
                      <select onChange={e => { if (e.target.value) { addGoal(m.id, m.team_a_id, e.target.value); e.target.value='' } }} className="w-full border rounded px-1 py-1">
                        <option value="">+ goal scorer…</option>
                        {aPlayers.map(p => <option key={p.id} value={p.player_id}>{p.players?.name}</option>)}
                      </select>
                      <button onClick={() => removeLastGoal(m.id, m.team_a_id)} className="text-red-500 mt-1">undo last</button>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Team {b?.label} goal:</div>
                      <select onChange={e => { if (e.target.value) { addGoal(m.id, m.team_b_id, e.target.value); e.target.value='' } }} className="w-full border rounded px-1 py-1">
                        <option value="">+ goal scorer…</option>
                        {bPlayers.map(p => <option key={p.id} value={p.player_id}>{p.players?.name}</option>)}
                      </select>
                      <button onClick={() => removeLastGoal(m.id, m.team_b_id)} className="text-red-500 mt-1">undo last</button>
                    </div>
                  </div>
                )}
                {goals.filter(g => g.match_id === m.id).length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    Goals: {goals.filter(g => g.match_id === m.id).map(g => g.players?.name).join(', ')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Top scorers */}
      {topScorers.length > 0 && (
        <section className="bg-white border rounded-lg p-4">
          <h2 className="font-bold mb-2">Top scorers (this session)</h2>
          <ol className="list-decimal pl-5 text-sm">
            {topScorers.map(([name, n]) => <li key={name}>{name} — <strong>{n}</strong></li>)}
          </ol>
        </section>
      )}

      {/* Voting */}
      <section className="bg-white border rounded-lg p-4">
        <h2 className="font-bold mb-2">Voting</h2>
        {session.voting_open
          ? <Link to={`/vote/${id}`} className="inline-block bg-fulda text-white px-4 py-2 rounded font-semibold">Open voting page →</Link>
          : <p className="text-sm text-gray-500">Voting not open yet.</p>}
        {isAdmin && (
          <div className="mt-3">
            <button onClick={toggleVoting} className="bg-gray-800 text-white px-3 py-1 rounded text-sm">
              {session.voting_open ? 'Close voting' : 'Open voting'}
            </button>
            {session.voting_open && <p className="text-xs text-gray-500 mt-2">Share this URL: <code className="bg-gray-100 px-1">{window.location.origin}/vote/{id}</code></p>}
          </div>
        )}
      </section>
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
      <h1 className="text-2xl font-bold mb-4">Players ({players.length})</h1>
      {isAdmin && (
        <div className="flex gap-2 mb-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Player name" className="flex-1 border rounded px-3 py-2" onKeyDown={e => e.key === 'Enter' && add()} />
          <button onClick={add} className="bg-fulda text-white px-4 rounded">Add</button>
        </div>
      )}
      <div className="bg-white border rounded-lg divide-y">
        {players.map(p => (
          <div key={p.id} className="px-4 py-2 flex justify-between items-center">
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

  // group results by category
  const byCat = (cat) => Object.values(results).filter(r => r.category === cat).sort((a,b) => b.count - a.count)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vote — {session.name || session.date}</h1>

      {!submitted ? (
        <div className="space-y-4">
          <VoteSection title="🏆 Best Player" players={players} value={votes.best_player} onChange={v => setVotes({...votes, best_player: v})} />
          <VoteSection title="🧤 Best Goalkeeper" players={players} value={votes.best_goalkeeper} onChange={v => setVotes({...votes, best_goalkeeper: v})} />
          <VoteSection title="⚽ Best Goal" players={players} value={votes.best_goal} onChange={v => setVotes({...votes, best_goal: v})} hint="Choose who scored your favourite goal" />
          <button onClick={submit} className="w-full bg-fulda text-white py-3 rounded font-bold">Submit vote</button>
        </div>
      ) : (
        <p className="text-fulda font-semibold">✅ Thanks for voting! See live results below.</p>
      )}

      {/* live results */}
      <div className="space-y-4">
        {[
          ['best_player','🏆 Best Player'],
          ['best_goalkeeper','🧤 Best Goalkeeper'],
          ['best_goal','⚽ Best Goal'],
        ].map(([cat,label]) => {
          const list = byCat(cat)
          return (
            <div key={cat} className="bg-white border rounded-lg p-4">
              <h3 className="font-bold mb-2">{label}</h3>
              {list.length === 0 ? <p className="text-sm text-gray-500">No votes yet.</p> :
                <ol className="list-decimal pl-5 text-sm">{list.map(r => <li key={r.name}>{r.name} — <strong>{r.count}</strong></li>)}</ol>
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
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">{title}</h3>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border rounded px-3 py-2">
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
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-bold mb-2">{title}</h3>
      {list.length === 0 ? <p className="text-sm text-gray-500">No data yet.</p> :
        <ol className="list-decimal pl-5 text-sm">{list.slice(0,10).map(([n,c]) => <li key={n}>{n} — <strong>{c}</strong></li>)}</ol>}
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
    <div className="max-w-sm mx-auto bg-white border rounded-lg p-6">
      <h1 className="text-xl font-bold mb-4">Admin Login</h1>
      <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" className="w-full border rounded px-3 py-2 mb-3" />
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full border rounded px-3 py-2 mb-3" onKeyDown={e => e.key === 'Enter' && login()} />
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <button onClick={login} disabled={loading} className="w-full bg-fulda text-white py-2 rounded font-semibold mb-2">{loading ? 'Logging in…' : 'Log in'}</button>
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
