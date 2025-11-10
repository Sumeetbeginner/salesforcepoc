import { useState, useEffect } from 'react';
import axios from 'axios';

interface Record {
  Id: string;
  Name: string;
  JSON_Data__c: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  description: string;
}

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    description: ''
  });

  // Handle OAuth redirect and session management
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session');
    if (session) {
      setSessionId(session);
      localStorage.setItem('sessionId', session);
      window.history.replaceState({}, '', '/');
    } else {
      const stored = localStorage.getItem('sessionId');
      if (stored) setSessionId(stored);
    }
  }, []);

  // Fetch records when session is available
  const fetchRecords = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://localhost:3000/api/jsondata', {
        headers: { 'x-session-id': sessionId }
      });
      setRecords(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Session expired or invalid, clear it and show login
        setSessionId(null);
        localStorage.removeItem('sessionId');
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [sessionId]);

  // OAuth login handler
  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/api/login';
  };

  // Create new record
  const handleCreate = async () => {
    try {
      await axios.post('http://localhost:3000/api/jsondata', formData, {
        headers: { 'x-session-id': sessionId! }
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        description: ''
      });
      fetchRecords();
    } catch (err: any) {
      if (err.response?.status === 401) {
        setSessionId(null);
        localStorage.removeItem('sessionId');
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.error || err.message);
      }
    }
  };

  // Update existing record
  const handleUpdate = async (id: string) => {
    try {
      await axios.patch(`http://localhost:3000/api/jsondata/${id}`, formData, {
        headers: { 'x-session-id': sessionId! }
      });
      setEditing(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        description: ''
      });
      fetchRecords();
    } catch (err: any) {
      if (err.response?.status === 401) {
        setSessionId(null);
        localStorage.removeItem('sessionId');
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.error || err.message);
      }
    }
  };

  // Delete record
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/jsondata/${id}`, {
        headers: { 'x-session-id': sessionId! }
      });
      fetchRecords();
    } catch (err: any) {
      if (err.response?.status === 401) {
        setSessionId(null);
        localStorage.removeItem('sessionId');
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.error || err.message);
      }
    }
  };

  // Start editing a record
  const startEdit = (record: Record) => {
    setEditing(record.Id);
    setFormData(JSON.parse(record.JSON_Data__c));
  };

  // If not logged in, show login page
  if (!sessionId) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '50px',
          borderRadius: '15px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '450px',
          width: '90%',
          backdropFilter: 'blur(10px)'
        }}>
          <h1 style={{
            color: '#2c3e50',
            marginBottom: '15px',
            fontSize: '32px',
            fontWeight: 'bold'
          }}>
            Salesforce Integration POC
          </h1>
          <p style={{
            color: '#34495e',
            marginBottom: '35px',
            fontSize: '18px',
            lineHeight: '1.5'
          }}>
            Connect with Salesforce to manage your data records securely
          </p>
          <button
            onClick={handleLogin}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '18px 35px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              width: '100%',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }}
          >
            🚀 Login with Salesforce
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      minWidth: '220%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif',
      marginLeft: "-60%",
      padding: 0,
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '15px 20px',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h1 style={{
          color: '#2c3e50',
          margin: 0,
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          Salesforce Integration POC
        </h1>
        <button
          onClick={() => {
            setSessionId(null);
            localStorage.removeItem('sessionId');
          }}
          style={{
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#c0392b'}
          onMouseOut={(e) => e.currentTarget.style.background = '#e74c3c'}
        >
          Logout
        </button>
      </header>

      {/* Main Content - Responsive Two Column Split */}
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth < 1024 ? 'column' : 'row',
        minHeight: 'calc(100vh - 70px)',
        padding: '15px',
        gap: '15px',
        boxSizing: 'border-box'
      }}>
        {/* Left Column - Records List */}
        <div style={{
          flex: window.innerWidth < 1024 ? 'none' : '1',
          height: window.innerWidth < 1024 ? '50vh' : 'auto',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Error/Success Messages */}
          {error && (
            <div style={{
              background: '#fee',
              color: '#c0392b',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '15px',
              border: '1px solid #fcd0d0',
              fontSize: '13px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '15px'
          }}>
            <h2 style={{
              color: '#2c3e50',
              margin: 0,
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              📋 Records ({records.length})
            </h2>
            {loading && (
              <div style={{
                color: '#7f8c8d',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid #3498db',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Loading...
              </div>
            )}
          </div>

          {/* Records List */}
          <div style={{
            flex: '1',
            overflowY: 'auto',
            paddingRight: '8px'
          }}>
            {records.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 15px',
                color: '#7f8c8d',
                fontSize: '15px'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>📄</div>
                No records found.<br />Create your first record on the right!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {records.map(r => {
                  const data = JSON.parse(r.JSON_Data__c);
                  return (
                    <div key={r.Id} style={{
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                      borderRadius: '8px',
                      padding: '15px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      border: '1px solid #dee2e6',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    }}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <h3 style={{
                          margin: '0 0 8px 0',
                          color: '#2c3e50',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}>
                          {data.name || 'Unnamed Record'}
                        </h3>
                        <div style={{ fontSize: '13px', color: '#495057', lineHeight: '1.4' }}>
                          {data.email && (
                            <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>📧</span> {data.email}
                            </p>
                          )}
                          {data.phone && (
                            <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>📞</span> {data.phone}
                            </p>
                          )}
                          {data.company && (
                            <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>🏢</span> {data.company}
                            </p>
                          )}
                          {data.description && (
                            <p style={{ margin: '6px 0 0 0', padding: '8px', background: '#f8f9fa', borderRadius: '4px', borderLeft: '3px solid #3498db' }}>
                              <strong>📝 Note:</strong> {data.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          onClick={() => startEdit(r)}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#218838'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#28a745'}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.Id)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#c82333'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#dc3545'}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Create/Edit Form */}
        <div style={{
          flex: window.innerWidth < 1024 ? 'none' : '1',
          height: window.innerWidth < 1024 ? '50vh' : 'auto',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{
            color: '#2c3e50',
            marginBottom: '20px',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {editing ? '✏️ Edit Record' : '➕ Create New Record'}
          </h2>

          <form
            onSubmit={(e) => { e.preventDefault(); editing ? handleUpdate(editing) : handleCreate(); }}
            style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  fontSize: '13px'
                }}>
                  👤 Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3498db'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  fontSize: '13px'
                }}>
                  📧 Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3498db'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  fontSize: '13px'
                }}>
                  📞 Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3498db'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  fontSize: '13px'
                }}>
                  🏢 Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3498db'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  fontSize: '13px'
                }}>
                  📝 Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3498db'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e9ecef'}
                  placeholder="Enter description or additional notes"
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: 'auto',
              paddingTop: '15px'
            }}>
              <button
                type="submit"
                style={{
                  flex: '1',
                  background: editing ? 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' : 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 3px 10px rgba(39, 174, 96, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = editing ? '0 5px 15px rgba(243, 156, 18, 0.4)' : '0 5px 15px rgba(39, 174, 96, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = editing ? '0 3px 10px rgba(243, 156, 18, 0.3)' : '0 3px 10px rgba(39, 174, 96, 0.3)';
                }}
              >
                {editing ? '💾 Update Record' : '➕ Create Record'}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      company: '',
                      description: ''
                    });
                  }}
                  style={{
                    flex: '1',
                    background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #7f8c8d 0%, #6c7b7d 100%)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
                  }}
                >
                  ❌ Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Add CSS animation for loading spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default App;
