import React, { useEffect, useState } from 'react';
import TeamMemberInfo from '../Components/TeamMemberInfo';
import "./TeamPage.css";

const TeamPage = () => {
  const [cabinet, setCabinet] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/team");
        if (!response.ok) throw new Error("Failed to fetch team data");
        const data = await response.json();
        
        // Ensure numeric rank sorting
        const sortedData = [...data].sort((a, b) => parseInt(a.rank || 99) - parseInt(b.rank || 99));
        
        // Case-insensitive filtering for safe category grouping
        setCabinet(sortedData.filter(m => m.category?.toLowerCase() === 'cabinet'));
        setTeam(sortedData.filter(m => m.category?.toLowerCase() === 'team'));
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', paddingTop: '180px', fontSize: '18px' }}>Loading Team Members... ⏳</div>;
  }

  return (
    <div className='team-page-wrapper' style={{ paddingTop: '120px' }}>
      <div className="team-section">
        <h2 className="section-title">Executive <span>Cabinet</span></h2>
        <div className="team-grid-container">
          {cabinet.length === 0 ? (
            <p style={{ textAlign: 'center', width: '100%' }}>No Cabinet members found.</p>
          ) : (
            cabinet.map((member) => (
              <div 
                key={member.id} 
                className={`member-card-wrapper ${
                  String(member.rank) === '1' ? 'pres' : String(member.rank) === '2' ? 'vp' : String(member.rank) === '3' ? 'gs' : ''
                }`}
              >
                <TeamMemberInfo 
                  Image={member.image_url} 
                  Name={member.name} 
                  Designation={member.role} 
                  Category={member.category} 
                />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="section-divider-line"></div>

      <div className="team-section">
        <h2 className="section-title">Our <span>Core Team</span></h2>
        <div className="team-grid-container">
          {team.length === 0 ? (
            <p style={{ textAlign: 'center', width: '100%' }}>No Core Team members found.</p>
          ) : (
            team.map((member) => (
              <div key={member.id} className="member-card-wrapper">
                <TeamMemberInfo 
                  Image={member.image_url} 
                  Name={member.name} 
                  Designation={member.role} 
                  Category={member.category} 
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamPage;