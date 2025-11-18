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

interface Artifact {
  id: string;
  name: string;
  description?: string;
  type: string;
  format: string;
  content: string;
  source: {
    sceneIds?: string[];
    arcIds?: string[];
    characterIds?: string[];
    includeAll?: boolean;
  };
  settings: Record<string, unknown>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    status: 'draft' | 'review' | 'final' | 'archived';
    version: number;
    regenerationCount?: number;
    lastRegeneratedAt?: string;
    tags?: string[];
  };
}

interface Template {
  id: string;
  name: string;
  description?: string;
  type: string;
  format: string;
  defaultSettings: Record<string, unknown>;
}

interface Stats {
  sceneCount: number;
  arcCount: number;
  characterCount: number;
  totalCost: number;
  avgScenePerArc: number;
}

// Get API URL from environment variables or use default
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function App() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<'scenes' | 'arcs' | 'characters' | 'artifacts' | 'ledger'>('scenes');
  const [apiAvailable, setApiAvailable] = useState(!!API_BASE);
  const [showArtifactModal, setShowArtifactModal] = useState(false);

  const loadScenes = useCallback(async () => {
    if (!API_BASE) return;
    try {
      const res = await fetch(`${API_BASE}/scenes`);
      const data = await res.json();
      setScenes(data);
    } catch (error) {
      console.error('Failed to load scenes:', error);
    }
  }, []);

  const loadArcs = useCallback(async () => {
    if (!API_BASE) return;
    try {
      const res = await fetch(`${API_BASE}/arcs`);
      const data = await res.json();
      setArcs(data);
    } catch (error) {
      console.error('Failed to load arcs:', error);
    }
  }, []);

  const loadCharacters = useCallback(async () => {
    if (!API_BASE) return;
    try {
      const res = await fetch(`${API_BASE}/characters`);
      const data = await res.json();
      setCharacters(data);
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    if (!API_BASE) return;
    try {
      const res = await fetch(`${API_BASE}/graph/stats`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  const loadArtifacts = useCallback(async () => {
    if (!API_BASE) return;
    try {
      const res = await fetch(`${API_BASE}/artifacts`);
      const data = await res.json();
      setArtifacts(data);
    } catch (error) {
      console.error('Failed to load artifacts:', error);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    if (!API_BASE) return;
    try {
      const res = await fetch(`${API_BASE}/templates`);
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, []);

  // טעינת נתונים
  useEffect(() => {
    loadScenes();
    loadArcs();
    loadCharacters();
    loadArtifacts();
    loadTemplates();
    loadStats();
  }, [loadScenes, loadArcs, loadCharacters, loadArtifacts, loadTemplates, loadStats]);

  const createScene = async () => {
    if (!apiAvailable) {
      alert('API server is not available. Please start the backend server.');
      return;
    }
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
    if (!apiAvailable) {
      alert('API server is not available. Please start the backend server.');
      return;
    }
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
    if (!apiAvailable) {
      alert('API server is not available. Please start the backend server.');
      return;
    }
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
      {!apiAvailable && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '5px',
          padding: '15px',
          marginBottom: '20px',
          color: '#856404',
        }}>
          <strong>⚠️ API Server Not Connected</strong>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>
            The backend API server is not available. To use all features, please start the backend server or configure a remote API URL.
          </p>
        </div>
      )}
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '2.5em' }}>📖 PCS — Plot Control System</h1>
        <p style={{ color: '#666', margin: '10px 0 0 0' }}>
          v2025.11-Δ4 • Sprint 3+ with Artifacts • Σ-Integrator Framework
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
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
          active={activeTab === 'artifacts'}
          onClick={() => setActiveTab('artifacts')}
          label="🎨 Artifacts"
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

      {activeTab === 'artifacts' && (
        <div>
          <Card>
            <CardHeader title="🎨 Artifacts" />
            <CardContent>
              <button
                onClick={() => setShowArtifactModal(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#FF5722',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                }}
              >
                ➕ צור Artifact
              </button>

              {artifacts.length === 0 ? (
                <p style={{ color: '#999' }}>אין artifacts עדיין. צור את הראשון!</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {artifacts.map((artifact) => (
                    <li
                      key={artifact.id}
                      style={{
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        marginBottom: '10px',
                        backgroundColor: '#fff8f0',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 10px 0' }}>
                            {artifact.name}
                            <span style={{
                              marginLeft: '10px',
                              fontSize: '0.7em',
                              padding: '3px 8px',
                              backgroundColor: getStatusColor(artifact.metadata.status),
                              color: 'white',
                              borderRadius: '3px',
                            }}>
                              {artifact.metadata.status}
                            </span>
                          </h3>
                          {artifact.description && (
                            <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                              {artifact.description}
                            </p>
                          )}
                          <p style={{ margin: '5px 0', color: '#666', fontSize: '0.85em' }}>
                            <strong>Type:</strong> {artifact.type} | <strong>Format:</strong> {artifact.format}
                          </p>
                          <p style={{ margin: '5px 0', color: '#666', fontSize: '0.85em' }}>
                            <strong>Version:</strong> {artifact.metadata.version} |
                            <strong> Regenerations:</strong> {artifact.metadata.regenerationCount || 0}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginLeft: '10px' }}>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`${API_BASE}/artifact/${artifact.id}/regenerate`, {
                                  method: 'POST',
                                });
                                if (res.ok) {
                                  loadArtifacts();
                                  alert('Artifact regenerated successfully!');
                                }
                              } catch (error) {
                                console.error('Failed to regenerate artifact:', error);
                              }
                            }}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '0.85em',
                            }}
                          >
                            🔄 Regenerate
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete artifact "${artifact.name}"?`)) return;
                              try {
                                const res = await fetch(`${API_BASE}/artifact/${artifact.id}`, {
                                  method: 'DELETE',
                                });
                                if (res.ok) {
                                  loadArtifacts();
                                }
                              } catch (error) {
                                console.error('Failed to delete artifact:', error);
                              }
                            }}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '0.85em',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
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

      {/* Artifact Creation Modal */}
      {showArtifactModal && (
        <ArtifactModal
          templates={templates}
          scenes={scenes}
          arcs={arcs}
          characters={characters}
          onClose={() => setShowArtifactModal(false)}
          onCreate={async (artifactData) => {
            try {
              const res = await fetch(`${API_BASE}/artifact/template`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(artifactData),
              });
              if (res.ok) {
                loadArtifacts();
                setShowArtifactModal(false);
                alert('Artifact created successfully!');
              }
            } catch (error) {
              console.error('Failed to create artifact:', error);
            }
          }}
        />
      )}
    </div>
  );
}

// Helper Functions
function getStatusColor(status: string): string {
  switch (status) {
    case 'draft': return '#9E9E9E';
    case 'review': return '#FF9800';
    case 'final': return '#4CAF50';
    case 'archived': return '#607D8B';
    default: return '#9E9E9E';
  }
}

// Artifact Creation Modal Component
function ArtifactModal({
  templates,
  scenes,
  arcs,
  characters,
  onClose,
  onCreate,
}: {
  templates: Template[];
  scenes: Scene[];
  arcs: Arc[];
  characters: Character[];
  onClose: () => void;
  onCreate: (data: any) => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [artifactName, setArtifactName] = useState<string>('');
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const [selectedArcs, setSelectedArcs] = useState<string[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [includeAll, setIncludeAll] = useState<boolean>(false);

  const handleCreate = () => {
    if (!selectedTemplate || !artifactName) {
      alert('Please select a template and provide a name');
      return;
    }

    onCreate({
      templateId: selectedTemplate,
      name: artifactName,
      source: {
        sceneIds: selectedScenes.length > 0 ? selectedScenes : undefined,
        arcIds: selectedArcs.length > 0 ? selectedArcs : undefined,
        characterIds: selectedCharacters.length > 0 ? selectedCharacters : undefined,
        includeAll,
      },
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>צור Artifact חדש</h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Template:
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '5px',
              border: '1px solid #ddd',
            }}
          >
            <option value="">-- Select Template --</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.type})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Artifact Name:
          </label>
          <input
            type="text"
            value={artifactName}
            onChange={(e) => setArtifactName(e.target.value)}
            placeholder="e.g., Act 1 Summary"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '5px',
              border: '1px solid #ddd',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={includeAll}
              onChange={(e) => setIncludeAll(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontWeight: 'bold' }}>Include all scenes/arcs/characters</span>
          </label>
        </div>

        {!includeAll && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Select Scenes:
              </label>
              <div style={{ maxHeight: '150px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
                {scenes.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '0.9em' }}>No scenes available</p>
                ) : (
                  scenes.map((scene) => (
                    <label key={scene.id} style={{ display: 'block', marginBottom: '5px' }}>
                      <input
                        type="checkbox"
                        checked={selectedScenes.includes(scene.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScenes([...selectedScenes, scene.id]);
                          } else {
                            setSelectedScenes(selectedScenes.filter((id) => id !== scene.id));
                          }
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      {scene.title}
                    </label>
                  ))
                )}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Select Arcs:
              </label>
              <div style={{ maxHeight: '100px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
                {arcs.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '0.9em' }}>No arcs available</p>
                ) : (
                  arcs.map((arc) => (
                    <label key={arc.id} style={{ display: 'block', marginBottom: '5px' }}>
                      <input
                        type="checkbox"
                        checked={selectedArcs.includes(arc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedArcs([...selectedArcs, arc.id]);
                          } else {
                            setSelectedArcs(selectedArcs.filter((id) => id !== arc.id));
                          }
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      {arc.intent}
                    </label>
                  ))
                )}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Select Characters:
              </label>
              <div style={{ maxHeight: '100px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
                {characters.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '0.9em' }}>No characters available</p>
                ) : (
                  characters.map((character) => (
                    <label key={character.id} style={{ display: 'block', marginBottom: '5px' }}>
                      <input
                        type="checkbox"
                        checked={selectedCharacters.includes(character.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCharacters([...selectedCharacters, character.id]);
                          } else {
                            setSelectedCharacters(selectedCharacters.filter((id) => id !== character.id));
                          }
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      {character.name}
                    </label>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#9E9E9E',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Create Artifact
          </button>
        </div>
      </div>
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
