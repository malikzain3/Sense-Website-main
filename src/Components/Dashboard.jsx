import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import toast from "react-hot-toast";
import EventModal from "./EventModal";
import TeamModal from "./TeamModal";
import { Save, Plus, MapPin, Clock, Trash2, Upload, UserPlus, Lock, Hourglass, Pencil } from "lucide-react";

const Dashboard = () => {
  const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [team, setTeam] = useState([]);

  // Track original baseline state for change diffing
  const [baselineEvents, setBaselineEvents] = useState([]);
  const [baselineGallery, setBaselineGallery] = useState([]);
  const [baselineTeam, setBaselineTeam] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    title: "", description: "", date: "", month: "", year: "",
    time: "", venue: "", image_url: "", status: "upcoming",
    register_link: "", drive_link: "",
  });

  const [teamFormData, setTeamFormData] = useState({
    name: "", role: "", image_url: "", category: "", rank: "",
  });

  const forceLogout = (message) => {
    localStorage.removeItem("token");
    localStorage.removeItem("loginTime");
    toast.error(message || "Session expired! Please login again.");
    window.location.href = "/LoginPage";
  };

  // 1. JWT Local Verification
 useEffect(() => {
  const verifySession = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      forceLogout("Unauthorized access! Please login.");
      return;
    }

    try {
      // Send token to backend for cryptographic verification
      const res = await fetch("http://localhost:5000/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Invalid token");
      setIsAuthenticated(true);
    } catch (err) {
      forceLogout("Invalid session! Please login again.");
    }
  };

  verifySession();
}, []);

  // Fetch all data from Express API
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [evRes, galRes, tmRes] = await Promise.all([
        fetch("http://localhost:5000/api/events"),
        fetch("http://localhost:5000/api/gallery"),
        fetch("http://localhost:5000/api/team")
      ]);

      const evData = await evRes.json();
      const galData = await galRes.json();
      const tmData = await tmRes.json();

      setEvents(evData);
      setBaselineEvents(JSON.parse(JSON.stringify(evData)));

      setGallery(galData);
      setBaselineGallery(JSON.parse(JSON.stringify(galData)));

      setTeam(tmData);
      setBaselineTeam(JSON.parse(JSON.stringify(tmData)));
    } catch (err) {
      toast.error("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated]);

  // Handle modal body locking
  useEffect(() => {
    if (showForm || showTeamForm) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
  }, [showForm, showTeamForm]);

  const hasChanges =
    JSON.stringify(events) !== JSON.stringify(baselineEvents) ||
    JSON.stringify(gallery) !== JSON.stringify(baselineGallery) ||
    JSON.stringify(team) !== JSON.stringify(baselineTeam);

  // Convert uploaded image file to Base64 data URL
  const uploadImageToServer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // --- Event Handlers ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imageUrl = await uploadImageToServer(file);
      setFormData((prev) => ({ ...prev, image_url: imageUrl }));
      toast.success("Image uploaded! 📸");
    } catch (err) {
      toast.error("Image upload failed!");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      setEvents(events.map((ev) => (ev.id === currentId ? { ...formData, id: currentId } : ev)));
      toast.success("Event updated!");
    } else {
      const newEvent = { ...formData, id: `temp_${Date.now()}` };
      setEvents([newEvent, ...events]);
      toast.success("Event added!");
    }
    closeForm();
  };

  const handleDeleteEvent = (id) => {
    setEvents(events.filter((ev) => ev.id !== id));
    toast.success("Event removed!");
  };

  // --- Gallery Handlers ---
  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imageUrl = await uploadImageToServer(file);
      const newPhoto = { id: `temp_${Date.now()}`, image_url: imageUrl };
      setGallery([newPhoto, ...gallery]);
      toast.success("Photo added!");
    } catch (err) {
      toast.error("Upload failed!");
    }
  };

  const handleDeleteGallery = (id) => {
    setGallery(gallery.filter((g) => g.id !== id));
    toast.success("Photo removed!");
  };

  // --- Team Handlers ---
  const handleTeamImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imageUrl = await uploadImageToServer(file);
      setTeamFormData((prev) => ({ ...prev, image_url: imageUrl }));
      toast.success("Photo uploaded! 📸");
    } catch (err) {
      toast.error("Upload failed!");
    }
  };

  const handleTeamSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      setTeam(team.map((m) => (m.id === currentId ? { ...teamFormData, id: currentId } : m)));
      toast.success("Member updated!");
    } else {
      const newMember = { ...teamFormData, id: `temp_${Date.now()}` };
      setTeam([newMember, ...team]);
      toast.success("Member added!");
    }
    closeTeamForm();
  };

  const handleDeleteTeam = (id) => {
    setTeam(team.filter((m) => m.id !== id));
    toast.success("Member removed!");
  };

  const closeForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setFormData({
      title: "", description: "", date: "", month: "", year: "",
      time: "", venue: "", image_url: "", status: "upcoming",
      register_link: "", drive_link: "",
    });
  };

  const closeTeamForm = () => {
    setShowTeamForm(false);
    setIsEditing(false);
    setTeamFormData({ name: "", role: "", image_url: "", category: "", rank: "" });
  };

  // Batch Sync Changes to PostgreSQL via Express API
  const handleGlobalSave = async () => {
    const loadingToast = toast.loading("Saving changes...");
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/dashboard/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ events, gallery, team })
      });

      if (!response.ok) throw new Error("Failed to synchronize changes");

      await fetchAll();
      toast.success("✅ All changes saved!", { id: loadingToast });
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Save failed! " + (error.message || "Unknown error"), { id: loadingToast });
    }
  };

  if (!isAuthenticated) return <div style={{ textAlign: "center", padding: "100px", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}><Lock size={24} /> Verifying access...</div>;
  if (loading) return <div style={{ textAlign: "center", padding: "100px", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}><Hourglass size={24} /> Loading...</div>;

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(`${a.month} ${a.date}, ${a.year}`).getTime() || 0;
    const dateB = new Date(`${b.month} ${b.date}, ${b.year}`).getTime() || 0;
    const isAUpcoming = a.status?.toLowerCase() === "upcoming";
    const isBUpcoming = b.status?.toLowerCase() === "upcoming";

    if (isAUpcoming && !isBUpcoming) return -1;
    if (!isAUpcoming && isBUpcoming) return 1;
    return isAUpcoming ? dateA - dateB : dateB - dateA;
  });

  return (
    <div className="dashboard-wrapper">
      <div className="global-save-container">
        <button className="global-save-btn" disabled={!hasChanges} onClick={handleGlobalSave} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span className="save-icon" style={{ display: "inline-flex", alignItems: "center" }}><Save size={18} /></span> {hasChanges ? "SAVE CHANGES" : "No Changes"}
        </button>
      </div>

      {/* EVENTS SECTION */}
      <div className="dashboard-section">
        <div className="dashboard-header">
          <h1>Manage <span>Events</span></h1>
          <button className="add-main-btn" onClick={() => setShowForm(true)} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Plus size={18} /> Add Event</button>
        </div>
        <div className="dashboard-grid">
          {sortedEvents.map((ev) => (
            <div key={ev.id} className="dash-event-card">
              <div className="card-img-container">
                <img src={ev.image_url || "https://via.placeholder.com/300x180"} alt="" />
                <span className={`status-badge ${ev.status?.toLowerCase()}`}>{ev.status}</span>
              </div>
              <div className="dash-card-content">
                <div className="card-date-badge">{ev.date} {ev.month} {ev.year}</div>
                <h3>{ev.title}</h3>
                <p className="card-desc">{ev.description}</p>
                <div className="card-meta">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><MapPin size={14} /> {ev.venue}</span> | <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Clock size={14} /> {ev.time}</span>
                </div>
                <div className="dash-actions">
                  <button className="edit-btn" onClick={() => { setFormData(ev); setCurrentId(ev.id); setIsEditing(true); setShowForm(true); }} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Pencil size={14} /> Edit</button>
                  <button className="delete-btn" onClick={() => handleDeleteEvent(ev.id)} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="section-divider" />

      {/* GALLERY SECTION */}
      <div className="dashboard-section gallery-dash-section">
        <div className="dashboard-header">
          <h1>Manage <span>Gallery</span></h1>
          <label className="add-main-btn" style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
            <Upload size={18} /> Upload Photo
            <input type="file" accept="image/*" hidden onChange={handleGalleryUpload} />
          </label>
        </div>
        <div className="gallery-dash-grid">
          {gallery.map((item) => (
            <div key={item.id} className="gallery-item-card">
              <img src={item.image_url} alt="Gallery" />
              <div className="gallery-controls-overlay">
                <button className="control-btn delete-icon" onClick={() => handleDeleteGallery(item.id)}><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="section-divider" />

      {/* TEAM SECTION */}
      <div className="dashboard-section">
        <div className="dashboard-header">
          <h1>Manage <span>Team</span></h1>
          <button className="add-main-btn" onClick={() => setShowTeamForm(true)} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><UserPlus size={18} /> Add Member</button>
        </div>
        <div className="dashboard-grid">
          {[...team].sort((a, b) => a.rank - b.rank).map((m) => (
            <div key={m.id} className="dash-event-card">
              <div className="card-img-container">
                <img src={m.image_url || "https://via.placeholder.com/150"} alt="" style={{ height: "220px" }} />
                <span className={`status-badge ${m.category?.toLowerCase()}`}>{m.category}</span>
              </div>
              <div className="dash-card-content" style={{ textAlign: "center" }}>
                <h3>{m.name}</h3>
                <p className="card-meta">{m.role}</p>
                <div className="dash-actions">
                  <button className="edit-btn" onClick={() => { setTeamFormData(m); setCurrentId(m.id); setIsEditing(true); setShowTeamForm(true); }} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Pencil size={14} /> Edit</button>
                  <button className="delete-btn" onClick={() => handleDeleteTeam(m.id)} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <EventModal
          isEditing={isEditing}
          closeForm={closeForm}
          handleSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          handleImageUpload={handleImageUpload}
        />
      )}

      {showTeamForm && (
        <TeamModal
          isEditing={isEditing}
          closeForm={closeTeamForm}
          handleSubmit={handleTeamSubmit}
          formData={teamFormData}
          setFormData={setTeamFormData}
          handleImageUpload={handleTeamImage}
        />
      )}
    </div>
  );
};

export default Dashboard;