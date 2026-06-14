import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ onBackToPortfolio }) {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // App settings state
  const [activeTab, setActiveTab] = useState('general');
  const [portfolio, setPortfolio] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  
  // Modals / Item Editors
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Temp states for adding/editing items
  const [newEducation, setNewEducation] = useState({ date: '', title: '', subtitle: '' });
  const [newExperience, setNewExperience] = useState({ date: '', title: '', subtitle: '', description: '' });
  const [newActivity, setNewActivity] = useState({ date: '', title: '', subtitle: '' });
  const [newLanguage, setNewLanguage] = useState({ name: '', level: '' });
  const [newSoftwareSkill, setNewSoftwareSkill] = useState('');
  const [newPillSkill, setNewPillSkill] = useState('');
  const [newTag, setNewTag] = useState('');

  // Auto clear status alerts
  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Load portfolio data
  const fetchPortfolioData = async () => {
    try {
      setLoadError(null);
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      } else {
        setLoadError(`Server responded with status ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to load portfolio:", err);
      setLoadError("Could not connect to the backend server. Make sure it is running.");
    }
  };

  // Load message data
  const fetchMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  // Check login on startup
  useEffect(() => {
    fetchPortfolioData();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          handleLogout();
        } else {
          fetchMessages();
        }
      } catch (e) {
        handleLogout();
      }
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('adminToken', data.token);
        setToken(data.token);
      } else {
        setLoginError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setLoginError('Could not connect to the authentication server.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setMessages([]);
  };

  // Generic Save for portfolio configuration
  const savePortfolio = async (updatedData = portfolio) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPortfolio(data.portfolio);
        setStatusMessage({ type: 'success', text: 'Portfolio settings saved successfully!' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update portfolio.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network connection issue.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(messages.filter(msg => msg.id !== id));
        setStatusMessage({ type: 'success', text: 'Message removed.' });
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage(null);
        }
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to delete message.' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Avatar or Resume File
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type, file);

    setIsLoading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPortfolio({
          ...portfolio,
          avatarUrl: data.avatarUrl || portfolio.avatarUrl,
          resumeUrl: data.resumeUrl || portfolio.resumeUrl
        });
        setStatusMessage({ type: 'success', text: `${type === 'avatar' ? 'Avatar photo' : 'Resume PDF'} uploaded successfully!` });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed upload files.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Upload failed due to connection.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Admin Access</h2>
          {loginError && <div className="form-alert error">{loginError}</div>}
          <form onSubmit={handleLogin}>
            <div className="admin-field">
              <label>Username</label>
              <input
                type="text"
                className="admin-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="admin-field">
              <label>Password</label>
              <input
                type="password"
                className="admin-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-btn-submit">Sign In</button>
            <button
              type="button"
              className="btn-admin btn-admin-secondary"
              style={{ width: '100%', marginTop: '10px', borderRadius: '25px' }}
              onClick={onBackToPortfolio}
            >
              Back to Portfolio
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div style={{ padding: '40px', textAlignment: 'center', fontFamily: 'var(--font-sans)', color: '#1A3C34' }}>
        {loadError ? (
          <div style={{ color: '#d9534f' }}>
            <h4 style={{ marginBottom: '10px' }}>Failed to Load Admin Panel Data</h4>
            <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>{loadError}</p>
            <button 
              onClick={fetchPortfolioData} 
              style={{
                background: '#1A3C34',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div>Loading Admin Panel data...</div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-view">
      <div className="container">
        <div className="admin-header">
          <div className="admin-title-group">
            <h1>Admin Console</h1>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Hello, update your dynamic portfolio details below.</p>
          </div>
          <div className="admin-nav-actions">
            <button className="btn-admin btn-admin-secondary" onClick={onBackToPortfolio}>
              View Live Website
            </button>
            <button className="btn-admin btn-admin-accent" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {statusMessage.text && (
          <div className={`form-alert ${statusMessage.type}`}>
            {statusMessage.text}
          </div>
        )}

        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General Bio
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline lists
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Skills &amp; tags
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'uploads' ? 'active' : ''}`}
            onClick={() => setActiveTab('uploads')}
          >
            Upload Files
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('messages');
              fetchMessages();
            }}
          >
            Messages ({messages.length})
          </button>
        </div>

        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="admin-card">
            <div className="admin-card-title">General Settings</div>
            
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Name</label>
                <input
                  type="text"
                  className="admin-input"
                  value={portfolio.name || ''}
                  onChange={(e) => setPortfolio({ ...portfolio, name: e.target.value })}
                />
              </div>
              <div className="admin-field">
                <label>LinkedIn Link</label>
                <input
                  type="text"
                  className="admin-input"
                  value={portfolio.linkedin || ''}
                  onChange={(e) => setPortfolio({ ...portfolio, linkedin: e.target.value })}
                />
              </div>
            </div>

            <div className="admin-field">
              <label>Hero Title</label>
              <textarea
                className="admin-textarea"
                rows="2"
                value={portfolio.title || ''}
                onChange={(e) => setPortfolio({ ...portfolio, title: e.target.value })}
              />
            </div>

            <div className="admin-field">
              <label>Introduction / Biography</label>
              <textarea
                className="admin-textarea"
                rows="4"
                value={portfolio.bio || ''}
                onChange={(e) => setPortfolio({ ...portfolio, bio: e.target.value })}
              />
            </div>

            <div className="admin-card-title" style={{ marginTop: '30px' }}>Contact Info</div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Location</label>
                <input
                  type="text"
                  className="admin-input"
                  value={portfolio.contact?.location || ''}
                  onChange={(e) => setPortfolio({
                    ...portfolio,
                    contact: { ...portfolio.contact, location: e.target.value }
                  })}
                />
              </div>
              <div className="admin-field">
                <label>Email Address</label>
                <input
                  type="email"
                  className="admin-input"
                  value={portfolio.contact?.email || ''}
                  onChange={(e) => setPortfolio({
                    ...portfolio,
                    contact: { ...portfolio.contact, email: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="admin-field" style={{ maxWidth: '50%' }}>
              <label>Phone Number</label>
              <input
                type="text"
                className="admin-input"
                value={portfolio.contact?.phone || ''}
                onChange={(e) => setPortfolio({
                  ...portfolio,
                  contact: { ...portfolio.contact, phone: e.target.value }
                })}
              />
            </div>

            <button
              className="btn-admin btn-admin-primary"
              disabled={isLoading}
              onClick={() => savePortfolio()}
            >
              {isLoading ? 'Saving...' : 'Save General Details'}
            </button>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div>
            {/* EDUCATION */}
            <div className="admin-card">
              <div className="admin-card-title">Education Timeline</div>
              <div className="admin-list-editor">
                <div className="admin-list-items">
                  {portfolio.education?.map(edu => (
                    <div key={edu.id} className="admin-list-item-card">
                      <div className="admin-list-item-info">
                        <h5>{edu.title}</h5>
                        <p>{edu.subtitle} | <span style={{fontWeight:'bold'}}>{edu.date}</span></p>
                      </div>
                      <button
                        className="btn-admin-danger"
                        onClick={() => {
                          const updated = portfolio.education.filter(x => x.id !== edu.id);
                          savePortfolio({ ...portfolio, education: updated });
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div className="admin-inline-form">
                  <h4 style={{marginBottom:'15px', color:'var(--dark-green)'}}>Add Education Item</h4>
                  <div className="admin-form-row">
                    <div className="admin-field">
                      <label>Dates (e.g. 2024 - Present)</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newEducation.date}
                        onChange={(e) => setNewEducation({ ...newEducation, date: e.target.value })}
                        placeholder="2024 - Present"
                      />
                    </div>
                    <div className="admin-field">
                      <label>Degree / Title</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newEducation.title}
                        onChange={(e) => setNewEducation({ ...newEducation, title: e.target.value })}
                        placeholder="B.Sc. Computer Science"
                      />
                    </div>
                  </div>
                  <div className="admin-field">
                    <label>Institution / Subtitle</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={newEducation.subtitle}
                      onChange={(e) => setNewEducation({ ...newEducation, subtitle: e.target.value })}
                      placeholder="University of Science, City"
                    />
                  </div>
                  <button
                    className="btn-admin btn-admin-secondary"
                    onClick={() => {
                      if (!newEducation.date || !newEducation.title) {
                        alert("Dates and Title are required");
                        return;
                      }
                      const updated = [
                        ...(portfolio.education || []),
                        { ...newEducation, id: Date.now() }
                      ];
                      savePortfolio({ ...portfolio, education: updated });
                      setNewEducation({ date: '', title: '', subtitle: '' });
                    }}
                  >
                    Add Education Item
                  </button>
                </div>
              </div>
            </div>

            {/* EXPERIENCE */}
            <div className="admin-card">
              <div className="admin-card-title">Professional Experience</div>
              <div className="admin-list-editor">
                <div className="admin-list-items">
                  {portfolio.experience?.map(exp => (
                    <div key={exp.id} className="admin-list-item-card">
                      <div className="admin-list-item-info">
                        <h5>{exp.title}</h5>
                        <p>{exp.subtitle} | {exp.date}</p>
                        <p style={{fontSize:'0.8rem', color:'#777', marginTop:'5px'}}>{exp.description}</p>
                      </div>
                      <button
                        className="btn-admin-danger"
                        onClick={() => {
                          const updated = portfolio.experience.filter(x => x.id !== exp.id);
                          savePortfolio({ ...portfolio, experience: updated });
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div className="admin-inline-form">
                  <h4 style={{marginBottom:'15px', color:'var(--dark-green)'}}>Add Experience Item</h4>
                  <div className="admin-form-row">
                    <div className="admin-field">
                      <label>Dates</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newExperience.date}
                        onChange={(e) => setNewExperience({ ...newExperience, date: e.target.value })}
                        placeholder="2024 - Present"
                      />
                    </div>
                    <div className="admin-field">
                      <label>Job Title</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newExperience.title}
                        onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                        placeholder="Software Engineer"
                      />
                    </div>
                  </div>
                  <div className="admin-field">
                    <label>Company / Location</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={newExperience.subtitle}
                      onChange={(e) => setNewExperience({ ...newExperience, subtitle: e.target.value })}
                      placeholder="Remote / Bankura, India"
                    />
                  </div>
                  <div className="admin-field">
                    <label>Description</label>
                    <textarea
                      className="admin-textarea"
                      rows="2"
                      value={newExperience.description}
                      onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                      placeholder="Briefly describe key tasks & accomplishments..."
                    />
                  </div>
                  <button
                    className="btn-admin btn-admin-secondary"
                    onClick={() => {
                      if (!newExperience.date || !newExperience.title) {
                        alert("Dates and Title are required");
                        return;
                      }
                      const updated = [
                        ...(portfolio.experience || []),
                        { ...newExperience, id: Date.now() }
                      ];
                      savePortfolio({ ...portfolio, experience: updated });
                      setNewExperience({ date: '', title: '', subtitle: '', description: '' });
                    }}
                  >
                    Add Experience Item
                  </button>
                </div>
              </div>
            </div>

            {/* ACTIVITIES */}
            <div className="admin-card">
              <div className="admin-card-title">Activities</div>
              <div className="admin-list-editor">
                <div className="admin-list-items">
                  {portfolio.activities?.map(act => (
                    <div key={act.id} className="admin-list-item-card">
                      <div className="admin-list-item-info">
                        <h5>{act.title}</h5>
                        <p>{act.subtitle} | {act.date}</p>
                      </div>
                      <button
                        className="btn-admin-danger"
                        onClick={() => {
                          const updated = portfolio.activities.filter(x => x.id !== act.id);
                          savePortfolio({ ...portfolio, activities: updated });
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div className="admin-inline-form">
                  <h4 style={{marginBottom:'15px', color:'var(--dark-green)'}}>Add Activity Item</h4>
                  <div className="admin-form-row">
                    <div className="admin-field">
                      <label>Dates</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newActivity.date}
                        onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
                        placeholder="2025"
                      />
                    </div>
                    <div className="admin-field">
                      <label>Title</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newActivity.title}
                        onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                        placeholder="Web Developer"
                      />
                    </div>
                  </div>
                  <div className="admin-field">
                    <label>Subtitle / Description</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={newActivity.subtitle}
                      onChange={(e) => setNewActivity({ ...newActivity, subtitle: e.target.value })}
                      placeholder="Designed Web Apps"
                    />
                  </div>
                  <button
                    className="btn-admin btn-admin-secondary"
                    onClick={() => {
                      if (!newActivity.date || !newActivity.title) {
                        alert("Dates and Title are required");
                        return;
                      }
                      const updated = [
                        ...(portfolio.activities || []),
                        { ...newActivity, id: Date.now() }
                      ];
                      savePortfolio({ ...portfolio, activities: updated });
                      setNewActivity({ date: '', title: '', subtitle: '' });
                    }}
                  >
                    Add Activity Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SKILLS & TAGS TAB */}
        {activeTab === 'skills' && (
          <div>
            {/* SOFTWARE SKILLS LIST */}
            <div className="admin-card">
              <div className="admin-card-title">Software Skills &amp; Icons</div>
              <p style={{fontSize:'0.85rem', color:'#666', marginBottom:'15px'}}>Tags representing software interfaces like Ps, Ai, Blender, etc.</p>
              <div className="tag-container" style={{marginBottom:'20px'}}>
                {portfolio.skills?.software?.map((skill, index) => (
                  <span key={index} className="software-icons" style={{display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 10px', background:'white'}}>
                    {skill}
                    <button
                      type="button"
                      style={{border:'none', background:'none', color:'#d9534f', fontWeight:'bold', cursor:'pointer'}}
                      onClick={() => {
                        const updated = portfolio.skills.software.filter((_, i) => i !== index);
                        savePortfolio({
                          ...portfolio,
                          skills: { ...portfolio.skills, software: updated }
                        });
                      }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="admin-inline-form" style={{border:'none', paddingTop:0}}>
                <div style={{display:'flex', gap:'10px', maxWidth:'400px'}}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Premiere, Figma"
                    value={newSoftwareSkill}
                    onChange={(e) => setNewSoftwareSkill(e.target.value)}
                  />
                  <button
                    className="btn-admin btn-admin-secondary"
                    onClick={() => {
                      if (!newSoftwareSkill.trim()) return;
                      const updated = [...(portfolio.skills.software || []), newSoftwareSkill.trim()];
                      savePortfolio({
                        ...portfolio,
                        skills: { ...portfolio.skills, software: updated }
                      });
                      setNewSoftwareSkill('');
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* CODING SKILLS TEXT */}
            <div className="admin-card">
              <div className="admin-card-title">Coding Skills Text</div>
              <div className="admin-field">
                <label>Skills Details (Separate languages with bullet dot &amp; newline)</label>
                <textarea
                  className="admin-textarea"
                  rows="3"
                  value={portfolio.skills?.coding || ''}
                  onChange={(e) => setPortfolio({
                    ...portfolio,
                    skills: { ...portfolio.skills, coding: e.target.value }
                  })}
                />
              </div>
              <button
                className="btn-admin btn-admin-primary"
                onClick={() => savePortfolio()}
              >
                Save Coding Skills
              </button>
            </div>

            {/* UI PILLS SKILLS */}
            <div className="admin-card">
              <div className="admin-card-title">UI Design Pills</div>
              <div className="tag-container" style={{marginBottom:'20px'}}>
                {portfolio.skills?.pills?.map((pill, index) => (
                  <span key={index} className="pill-list" style={{display:'inline-flex', alignItems:'center', gap:'10px'}}>
                    {pill}
                    <button
                      type="button"
                      style={{border:'none', background:'none', color:'#FDBA31', fontWeight:'bold', cursor:'pointer'}}
                      onClick={() => {
                        const updated = portfolio.skills.pills.filter((_, i) => i !== index);
                        savePortfolio({
                          ...portfolio,
                          skills: { ...portfolio.skills, pills: updated }
                        });
                      }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="admin-inline-form" style={{border:'none', paddingTop:0}}>
                <div style={{display:'flex', gap:'10px', maxWidth:'400px'}}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Interface Prototyping"
                    value={newPillSkill}
                    onChange={(e) => setNewPillSkill(e.target.value)}
                  />
                  <button
                    className="btn-admin btn-admin-secondary"
                    onClick={() => {
                      if (!newPillSkill.trim()) return;
                      const updated = [...(portfolio.skills.pills || []), newPillSkill.trim()];
                      savePortfolio({
                        ...portfolio,
                        skills: { ...portfolio.skills, pills: updated }
                      });
                      setNewPillSkill('');
                    }}
                  >
                    Add Pill
                  </button>
                </div>
              </div>
            </div>

            {/* HOBBY TAGS */}
            <div className="admin-card">
              <div className="admin-card-title">General Metadata Tags</div>
              <div className="tag-container" style={{marginBottom:'20px'}}>
                {portfolio.tags?.map((tag, index) => (
                  <span key={index} className="tag" style={{display:'inline-flex', alignItems:'center', gap:'8px'}}>
                    #{tag}
                    <button
                      type="button"
                      style={{border:'none', background:'none', color:'#E76F51', fontWeight:'bold', cursor:'pointer'}}
                      onClick={() => {
                        const updated = portfolio.tags.filter((_, i) => i !== index);
                        savePortfolio({ ...portfolio, tags: updated });
                      }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="admin-inline-form" style={{border:'none', paddingTop:0}}>
                <div style={{display:'flex', gap:'10px', maxWidth:'400px'}}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. FrontEnd"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                  />
                  <button
                    className="btn-admin btn-admin-secondary"
                    onClick={() => {
                      if (!newTag.trim()) return;
                      const updated = [...(portfolio.tags || []), newTag.trim().replace('#', '')];
                      savePortfolio({ ...portfolio, tags: updated });
                      setNewTag('');
                    }}
                  >
                    Add Tag
                  </button>
                </div>
              </div>
            </div>

            {/* LANGUAGES */}
            <div className="admin-card">
              <div className="admin-card-title">Languages</div>
              <div className="admin-list-editor">
                <div className="admin-list-items">
                  {portfolio.languages?.map(lang => (
                    <div key={lang.id} className="admin-list-item-card">
                      <div className="admin-list-item-info">
                        <h5>{lang.name}</h5>
                        <p>{lang.level}</p>
                      </div>
                      <button
                        className="btn-admin-danger"
                        onClick={() => {
                          const updated = portfolio.languages.filter(x => x.id !== lang.id);
                          savePortfolio({ ...portfolio, languages: updated });
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div className="admin-inline-form">
                  <h4 style={{marginBottom:'15px', color:'var(--dark-green)'}}>Add Language</h4>
                  <div className="admin-form-row">
                    <div className="admin-field">
                      <label>Language Name</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newLanguage.name}
                        onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                        placeholder="Bengali"
                      />
                    </div>
                    <div className="admin-field">
                      <label>Proficiency Level</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newLanguage.level}
                        onChange={(e) => setNewLanguage({ ...newLanguage, level: e.target.value })}
                        placeholder="Native / Fluent / Basic"
                      />
                    </div>
                  </div>
                  <button
                    className="btn-admin btn-admin-secondary"
                    onClick={() => {
                      if (!newLanguage.name || !newLanguage.level) {
                        alert("Name and level are required");
                        return;
                      }
                      const updated = [
                        ...(portfolio.languages || []),
                        { ...newLanguage, id: Date.now() }
                      ];
                      savePortfolio({ ...portfolio, languages: updated });
                      setNewLanguage({ name: '', level: '' });
                    }}
                  >
                    Add Language
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPLOADS TAB */}
        {activeTab === 'uploads' && (
          <div className="admin-card">
            <div className="admin-card-title">Upload Profile Photo &amp; Resume PDF</div>
            <div className="admin-upload-grid">
              
              <div>
                <h4 style={{marginBottom:'10px', color:'var(--dark-green)'}}>Profile Avatar Picture</h4>
                <p style={{fontSize:'0.8rem', color:'#666', marginBottom:'15px'}}>Replaces the hero circle profile image (`my_img.jpeg`)</p>
                
                <div className="upload-box" onClick={() => document.getElementById('avatar-input').click()}>
                  <span className="upload-icon">📷</span>
                  <p>Click to select or replace profile image</p>
                  <p style={{fontSize:'0.75rem', color:'#999'}}>PNG / JPG formats accepted</p>
                  <input
                    type="file"
                    id="avatar-input"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'avatar')}
                  />
                </div>
                {portfolio.avatarUrl && (
                  <div style={{marginTop:'15px'}}>
                    <p style={{fontSize:'0.8rem', color:'#777'}}>Current Photo preview:</p>
                    <img src={portfolio.avatarUrl} alt="Avatar Preview" className="upload-preview-img" />
                  </div>
                )}
              </div>

              <div>
                <h4 style={{marginBottom:'10px', color:'var(--dark-green)'}}>Resume Document (PDF)</h4>
                <p style={{fontSize:'0.8rem', color:'#666', marginBottom:'15px'}}>Replaces download link file (`Jit_Singha_Mahapatra_Resume.pdf`)</p>
                
                <div className="upload-box" onClick={() => document.getElementById('resume-input').click()}>
                  <span className="upload-icon">📄</span>
                  <p>Click to select or replace resume file</p>
                  <p style={{fontSize:'0.75rem', color:'#999'}}>PDF format only</p>
                  <input
                    type="file"
                    id="resume-input"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handleFileUpload(e, 'resume')}
                  />
                </div>
                {portfolio.resumeUrl && (
                  <div style={{marginTop:'15px', textAlign:'center'}}>
                    <p style={{fontSize:'0.8rem', color:'#777'}}>Current PDF address:</p>
                    <a href={portfolio.resumeUrl} target="_blank" rel="noreferrer" style={{color:'var(--terracotta)', fontWeight:'bold', fontSize:'0.9rem'}}>
                      Download Current Resume 🔗
                    </a>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="admin-card">
            <div className="admin-card-title">User Inquiries / Messages</div>
            {messages.length === 0 ? (
              <div style={{padding:'20px 0', textAlignment:'center', color:'#888'}}>
                No messages received yet. All contact forms submissions will appear here.
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Sender</th>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map(msg => (
                      <tr key={msg.id}>
                        <td>{new Date(msg.date).toLocaleDateString()}</td>
                        <td style={{fontWeight:'bold'}}>{msg.name}</td>
                        <td>{msg.email}</td>
                        <td>{msg.subject}</td>
                        <td>
                          <button
                            className="btn-admin btn-admin-secondary"
                            style={{padding:'4px 10px', fontSize:'0.8rem', marginRight:'5px'}}
                            onClick={() => setSelectedMessage(msg)}
                          >
                            View
                          </button>
                          <button
                            className="btn-admin-danger"
                            onClick={() => handleDeleteMessage(msg.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MESSAGE DETAILS MODAL */}
      {selectedMessage && (
        <div className="message-detail-modal">
          <div className="message-modal-content">
            <button className="message-modal-close" onClick={() => setSelectedMessage(null)}>&times;</button>
            <h3 style={{fontFamily:'var(--font-serif)', color:'var(--dark-green)', marginBottom:'20px'}}>
              Message Details
            </h3>
            <div style={{marginBottom:'15px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
              <p><strong>From:</strong> {selectedMessage.name} (<a href={`mailto:${selectedMessage.email}`} style={{color:'var(--terracotta)'}}>{selectedMessage.email}</a>)</p>
              <p><strong>Date:</strong> {new Date(selectedMessage.date).toLocaleString()}</p>
              <p><strong>Subject:</strong> {selectedMessage.subject}</p>
            </div>
            <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'8px', whiteSpace:'pre-wrap', maxHeight:'300px', overflowY:'auto'}}>
              {selectedMessage.message}
            </div>
            <div style={{marginTop:'20px', textAlign:'right'}}>
              <button
                className="btn-admin btn-admin-secondary"
                onClick={() => setSelectedMessage(null)}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
