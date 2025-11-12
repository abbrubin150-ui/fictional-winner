/**
 * PCS Main App Component
 * React UI for Plot Control System
 */

import React, { useState, useEffect, useCallback } from 'react';

interface Scene {
  id: string;
  title: string;
  premise: string;
  why: string;
  how: string;
  cost: number;
}

interface Arc {
  id: string;
  intent: string;
  scenes: string[];
}

interface Character {
  id: string;
  name: string;
  description: string;
  role: string;
  traits: string[];
  scenePresence: string[];
  relationships: Record<string, unknown>[];
}

const API_BASE = 'http://localhost:3000';

export default function App() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState<'scenes' | 'arcs' | 'characters' | 'ledger'>('scenes');

  const loadScenes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/scenes`);
      const data = await res.json();
      setScenes(data);
    } catch (error) {
      console.error('Failed to load scenes:', error);
    }
  }, []);

  const loadArcs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/arcs`);
      const data = await res.json();
      setArcs(data);
    } catch (error) {
      console.error('Failed to load arcs:', error);
    }
  }, []);

  const loadCharacters = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/characters`);
      const data = await res.json();
      setCharacters(data);
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/graph/stats`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  // טעינת נתונים
  useEffect(() => {
    loadScenes();
    loadArcs();
    loadCharacters();
    loadStats();
  }, [loadScenes, loadArcs, loadCharacters, loadStats]);

  const createScene = async () => {
    const title = prompt('כותרת הסצנה:');
    if (!title) return;

    const premise = prompt('Premise (מה קורה):');
    if (!premise) return;

    const why = prompt('Why (למה):');
    if (!why) return;

    const how = prompt('How (איך):');
    if (!how) return;

    const costStr = prompt('Cost (עלות נרטיבית):');
    const cost = parseFloat(costStr || '1');

    try {
      const res = await fetch(`${API_BASE}/scene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, premise, why, how, cost }),
      });

      if (res.ok) {
        loadScenes();
        loadStats();
      }
    } catch (error) {
      console.error('Failed to create scene:', error);
    }
  };

  const createArc = async () => {
    const intent = prompt('Intent (כוונת ה-Arc):');
    if (!intent) return;

    try {
      const res = await fetch(`${API_BASE}/arc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent }),
      });

      if (res.ok) {
        loadArcs();
        loadStats();
      }
    } catch (error) {
      console.error('Failed to create arc:', error);
    }
  };

  const createCharacter = async () => {
    const name = prompt('Character Name:');
    if (!name) return;

    const description = prompt('Description:');
    if (!description) return;

    const role = prompt('Role (protagonist/antagonist/supporting/other):') || 'other';

    try {
      const res = await fetch(`${API_BASE}/character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, role }),
      });

      if (res.ok) {
        loadCharacters();
        loadStats();
      }
    } catch (error) {
      console.error('Failed to create character:', error);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '2.5em' }}>📖 PCS — Plot Control System</h1>
        <p style={{ color: '#666', margin: '10px 0 0 0' }}>
          v2025.11-Δ1 • Sprint 1 • Σ-Integrator Framework
        </p>
      </header>

      {/* Stats Dashboard */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '15px',
          marginBottom: '30px',
        }}>
          <StatCard label="סצנות" value={stats.sceneCount} />
          <StatCard label="Arcs" value={stats.arcCount} />
          <StatCard label="דמויות" value={stats.characterCount || 0} />
          <StatCard label="עלות כוללת" value={stats.totalCost.toFixed(1)} />
          <StatCard label="ממוצע סצנות/Arc" value={stats.avgScenePerArc.toFixed(1)} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <TabButton
          active={activeTab === 'scenes'}
          onClick={() => setActiveTab('scenes')}
          label="סצנות"
        />
        <TabButton
          active={activeTab === 'arcs'}
          onClick={() => setActiveTab('arcs')}
          label="Arcs"
        />
        <TabButton
          active={activeTab === 'characters'}
          onClick={() => setActiveTab('characters')}
          label="דמויות"
        />
        <TabButton
          active={activeTab === 'ledger'}
          onClick={() => setActiveTab('ledger')}
          label="Ledger"
        />
      </div>

      {/* Content */}
      {activeTab === 'scenes' && (
        <div>
          <Card>
            <CardHeader title="סצנות" />
            <CardContent>
              <button
                onClick={createScene}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                }}
              >
                ➕ הוסף סצנה
              </button>

              {scenes.length === 0 ? (
                <p style={{ color: '#999' }}>אין סצנות עדיין</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {scenes.map((scene) => (
                    <li
                      key={scene.id}
                      style={{
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        marginBottom: '10px',
                      }}
                    >
                      <h3 style={{ margin: '0 0 10px 0' }}>{scene.title}</h3>
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                        <strong>Premise:</strong> {scene.premise}
                      </p>
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                        <strong>Cost:</strong> {scene.cost}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'arcs' && (
        <div>
          <Card>
            <CardHeader title="Arcs" />
            <CardContent>
              <button
                onClick={createArc}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                }}
              >
                ➕ הוסף Arc
              </button>

              {arcs.length === 0 ? (
                <p style={{ color: '#999' }}>אין Arcs עדיין</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {arcs.map((arc) => (
                    <li
                      key={arc.id}
                      style={{
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        marginBottom: '10px',
                      }}
                    >
                      <h3 style={{ margin: '0 0 10px 0' }}>{arc.intent}</h3>
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                        <strong>סצנות:</strong> {arc.scenes.length}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'characters' && (
        <div>
          <Card>
            <CardHeader title="דמויות" />
            <CardContent>
              <button
                onClick={createCharacter}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#9C27B0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                }}
              >
                ➕ הוסף דמות
              </button>

              {characters.length === 0 ? (
                <p style={{ color: '#999' }}>אין דמויות עדיין</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {characters.map((character) => (
                    <li
                      key={character.id}
                      style={{
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        marginBottom: '10px',
                        backgroundColor: '#f9f9f9',
                      }}
                    >
                      <h3 style={{ margin: '0 0 10px 0' }}>
                        {character.name}
                        <span style={{
                          marginLeft: '10px',
                          fontSize: '0.7em',
                          padding: '3px 8px',
                          backgroundColor: '#9C27B0',
                          color: 'white',
                          borderRadius: '3px',
                        }}>
                          {character.role}
                        </span>
                      </h3>
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                        <strong>תיאור:</strong> {character.description}
                      </p>
                      {character.traits && character.traits.length > 0 && (
                        <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                          <strong>תכונות:</strong> {character.traits.join(', ')}
                        </p>
                      )}
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                        <strong>סצנות:</strong> {character.scenePresence?.length || 0}
                      </p>
                      {character.relationships && character.relationships.length > 0 && (
                        <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                          <strong>קשרים:</strong> {character.relationships.length}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div>
          <Card>
            <CardHeader title="Decision Ledger" />
            <CardContent>
              <p style={{ color: '#666' }}>
                יומן ההחלטות מכיל את כל הפעולות הקריטיות במערכת.
              </p>
              <a
                href={`${API_BASE}/ledger`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2196F3' }}
              >
                📋 צפה בלוג מלא
              </a>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Helper Components
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        padding: '15px 20px',
        borderBottom: '1px solid #ddd',
        fontWeight: 'bold',
        fontSize: '1.2em',
      }}
    >
      {title}
    </div>
  );
}

function CardContent({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '20px' }}>{children}</div>;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: 'white',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#333' }}>{value}</div>
      <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>{label}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        border: active ? '2px solid #2196F3' : '1px solid #ddd',
        borderRadius: '5px',
        backgroundColor: active ? '#E3F2FD' : 'white',
        cursor: 'pointer',
        fontWeight: active ? 'bold' : 'normal',
      }}
    >
      {label}
    </button>
  );
}
