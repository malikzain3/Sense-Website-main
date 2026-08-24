import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeamMemberInfo from './TeamMemberInfo';
import "./Team.css";

const Team = () => {
  const navigate = useNavigate();
  const [topMembers, setTopMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/team?limit=3');
        if (!response.ok) throw new Error('Failed to fetch team members');
        
        const data = await response.json();
        
        // Ensure standard numeric rank sorting
        const sorted = data.sort((a, b) => parseInt(a.rank || 99) - parseInt(b.rank || 99));
        setTopMembers(sorted);
      } catch (error) {
        console.error("Error fetching team:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  if (loading) return <div className="loading-text" style={{ textAlign: 'center', padding: '50px' }}>Loading Team...</div>;

  return (
    <div id='Team'>
      <div className="Team-Heading">Our Team</div>
      <div className="Team-content">
        <div className="Team-Text">Meet Our Prestigious Team</div>
        <div className="Team-Member">
          {topMembers.length === 0 ? (
            <p>No team members found.</p>
          ) : (
            topMembers.map((member) => (
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
      <div className="More-Team-Button">  
        <button onClick={() => navigate('/TeamPage')}>See Our Team</button>
      </div>
    </div>
  );
};

export default Team;