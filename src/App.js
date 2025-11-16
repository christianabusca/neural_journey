import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Swords, Zap, Award, Target, Lock, Unlock, RefreshCw, Github, Linkedin, ExternalLink } from 'lucide-react';

function App() {
  const [phases, setPhases] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;

  // Fetch data from Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      const phasesRes = await fetch(`${SUPABASE_URL}/rest/v1/phases?select=*&order=id`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const phasesData = await phasesRes.json();
      setPhases(phasesData);

      const tracksRes = await fetch(`${SUPABASE_URL}/rest/v1/tracks?select=*&order=phase_id`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const tracksData = await tracksRes.json();
      setTracks(tracksData);

      const coursesRes = await fetch(`${SUPABASE_URL}/rest/v1/courses?select=*&order=track_id`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const coursesData = await coursesRes.json();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCourseCompletion = async (courseId, currentStatus) => {
    if (!isAdmin) {
      alert('Admin access required to edit courses');
      return;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/courses?id=eq.${courseId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          is_completed: !currentStatus,
          completed_date: !currentStatus ? new Date().toISOString().split('T')[0] : null
        })
      });

      if (response.ok) {
        setCourses(courses.map(course => 
          course.id === courseId 
            ? { ...course, is_completed: !currentStatus, completed_date: !currentStatus ? new Date().toISOString().split('T')[0] : null }
            : course
        ));
      }
    } catch (error) {
      console.error('Error updating course:', error);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
      setAdminPassword('');
    } else {
      alert('Incorrect password');
    }
  };

  const getTracksForPhase = (phaseId) => tracks.filter(track => track.phase_id === phaseId);
  const getCoursesForTrack = (trackId) => courses.filter(course => course.track_id === trackId);

  const getPhaseStats = (phaseId) => {
    const phaseTracks = getTracksForPhase(phaseId);
    let completed = 0;
    let total = 0;
    phaseTracks.forEach(track => {
      const trackCourses = getCoursesForTrack(track.id);
      trackCourses.forEach(course => {
        total++;
        if (course.is_completed) completed++;
      });
    });
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const getTrackStats = (trackId) => {
    const trackCourses = getCoursesForTrack(trackId);
    const completed = trackCourses.filter(c => c.is_completed).length;
    const total = trackCourses.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const getTotalProgress = () => {
    const completed = courses.filter(c => c.is_completed).length;
    const total = courses.length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getTotalStats = () => {
    const completed = courses.filter(c => c.is_completed).length;
    const notStarted = courses.filter(c => !c.is_completed).length;
    let tracksInProgress = 0;
    tracks.forEach(track => {
      const trackCourses = getCoursesForTrack(track.id);
      const hasCompleted = trackCourses.some(c => c.is_completed);
      const hasIncomplete = trackCourses.some(c => !c.is_completed);
      if (hasCompleted && hasIncomplete) tracksInProgress++;
    });
    return { completed, inProgress: tracksInProgress, notStarted };
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 50) return 'text-yellow-400';
    if (percentage >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  const totalProgress = getTotalProgress();
  const totalStats = getTotalStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-xl">Loading your cultivation journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 md:p-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-10 h-10 text-yellow-400 animate-pulse" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Neural Ascension
            </h1>
            <Swords className="w-10 h-10 text-purple-400" />
          </div>
          <p className="text-xl md:text-2xl text-gray-300 mb-2">The Scholar Who Traversed Data to Become the AI Overlord</p>
          <p className="text-sm md:text-base text-gray-400 italic">A Structured Learning Path of Christian Abusca</p>
        </div>

        {/* Journey Description */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-purple-500/30 shadow-xl mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl md:text-3xl font-bold">The Journey of Cultivation</h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <p className="text-base md:text-lg leading-relaxed">
              Every cultivator begins with fragile foundations before unlocking deeper realms. This path is divided into <span className="text-purple-400 font-semibold">7 phases</span>, each one a cultivation stage with its own discipline, skills, and tests.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/20">
                <div className="text-3xl font-bold text-purple-400 mb-1">55</div>
                <div className="text-sm text-gray-400">Skill Tracks</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/20">
                <div className="text-3xl font-bold text-pink-400 mb-1">12-18</div>
                <div className="text-sm text-gray-400">Months Timeline</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/20">
                <div className="text-3xl font-bold text-yellow-400 mb-1">7</div>
                <div className="text-sm text-gray-400">Cultivation Phases</div>
              </div>
            </div>
            <p className="text-sm md:text-base leading-relaxed">
              <span className="text-purple-400 font-semibold">Focus Areas:</span> AI/ML, Data Science, Cloud Computing, Data Engineering, Business Analytics, Production Systems, and AI Agents
            </p>
            <p className="text-sm md:text-base italic text-gray-400 border-l-4 border-purple-500 pl-4">
              "Cultivation is endless. Each dataset you tame, each model you forge, is a step closer to true ascension."
            </p>
          </div>
        </div>

        {/* Social Links & Admin Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://github.com/christianabusca"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-all border border-purple-500/30"
            >
              <Github className="w-5 h-5" />
              Connect on GitHub
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/christianabusca/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all"
            >
              <Linkedin className="w-5 h-5" />
              Connect on LinkedIn
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="flex gap-3">
            {!isAdmin ? (
              <button
                onClick={() => setShowPasswordPrompt(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-all"
              >
                <Lock className="w-5 h-5" />
                Admin Login
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsAdmin(false)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all"
                >
                  <Unlock className="w-5 h-5" />
                  Admin Mode
                </button>
                <button
                  onClick={fetchData}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>

        {showPasswordPrompt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-purple-500/30">
              <h3 className="text-2xl font-bold mb-4">Admin Login</h3>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-purple-500/30 focus:outline-none focus:border-purple-500 mb-4 text-white"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAdminLogin}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setAdminPassword('');
                  }}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overall Progress Card */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-yellow-400" />
              <h2 className="text-xl md:text-2xl font-bold">Cultivation Progress</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl md:text-3xl font-bold text-purple-400">{totalProgress.toFixed(1)}%</div>
              <div className="text-xs md:text-sm text-gray-400">Overall Completion</div>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{totalStats.completed}</div>
              <div className="text-xs md:text-sm text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{totalStats.inProgress}</div>
              <div className="text-xs md:text-sm text-gray-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{totalStats.notStarted}</div>
              <div className="text-xs md:text-sm text-gray-400">Not Started</div>
            </div>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="max-w-7xl mx-auto space-y-6">
        {phases.map((phase) => {
          const stats = getPhaseStats(phase.id);
          const isExpanded = selectedPhase === phase.id;
          const phaseTracks = getTracksForPhase(phase.id);
          
          return (
            <div key={phase.id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 shadow-xl overflow-hidden">
              <div 
                className={`p-4 md:p-6 cursor-pointer hover:bg-slate-700/50 transition-all ${isExpanded ? 'bg-slate-700/50' : ''}`}
                onClick={() => setSelectedPhase(isExpanded ? null : phase.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl md:text-5xl">{['🌱', '📊', '🤖', '🔬', '☁️', '🏗️', '🎯'][phase.id - 1]}</div>
                    <div>
                      <h3 className="text-lg md:text-2xl font-bold">{phase.title}</h3>
                      <p className="text-xs md:text-sm text-gray-400">Phase {phase.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl md:text-4xl font-bold ${getProgressColor(stats.percentage)}`}>
                      {stats.percentage.toFixed(0)}%
                    </div>
                    <div className="text-xs md:text-sm text-gray-400">{stats.completed}/{stats.total}</div>
                  </div>
                </div>
                <div className="mt-4 w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 md:p-6 bg-slate-900/50 border-t border-purple-500/20">
                  <h4 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Skill Tracks
                  </h4>
                  <div className="space-y-4">
                    {phaseTracks.map((track) => {
                      const trackStats = getTrackStats(track.id);
                      const trackCourses = getCoursesForTrack(track.id);
                      
                      return (
                        <div key={track.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-sm md:text-base">{track.title}</h5>
                            <span className="text-xs md:text-sm text-gray-400">
                              {trackStats.completed}/{trackStats.total}
                            </span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2 mb-3 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                              style={{ width: `${trackStats.percentage}%` }}
                            />
                          </div>
                          <div className="space-y-2">
                            {trackCourses.map((course) => (
                              <div
                                key={course.id}
                                onClick={() => toggleCourseCompletion(course.id, course.is_completed)}
                                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                                  isAdmin ? 'cursor-pointer hover:bg-slate-700' : 'cursor-default'
                                } ${course.is_completed ? 'bg-green-900/20 border border-green-500/30' : 'bg-slate-700/50'}`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {course.is_completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                  ) : (
                                    <div className="w-5 h-5 border-2 border-gray-500 rounded-full flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{course.title}</div>
                                  </div>
                                </div>
                                {course.completed_date && (
                                  <div className="text-xs text-gray-400">
                                    {new Date(course.completed_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-12 text-center">
        <p className="text-gray-400 text-sm italic">
          "May your gradient descend swiftly and your loss converge eternally." ⚡
        </p>
      </div>
    </div>
  );
}

export default App;