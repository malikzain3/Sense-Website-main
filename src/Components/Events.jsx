import React, { useState, useEffect } from 'react';
import EventCard from './EventCard';
import "./Events.css";

const Events = () => {
  const [homeEvents, setHomeEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeEvents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/events?limit=3');
        if (!response.ok) throw new Error('Failed to fetch events');
        
        const data = await response.json();

        // Sort: Upcoming first, then by date
        const sortedData = [...data].sort((a, b) => {
          const dateA = new Date(`${a.month} ${a.date}, ${a.year}`).getTime() || 0;
          const dateB = new Date(`${b.month} ${b.date}, ${b.year}`).getTime() || 0;
          const isAUpcoming = a.status?.toLowerCase() === 'upcoming';
          const isBUpcoming = b.status?.toLowerCase() === 'upcoming';

          if (isAUpcoming && !isBUpcoming) return -1;
          if (!isAUpcoming && isBUpcoming) return 1;
          return isAUpcoming ? dateA - dateB : dateB - dateA;
        });

        setHomeEvents(sortedData);
      } catch (error) {
        console.error("Error fetching home events:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeEvents();
  }, []);

  if (loading) return <div className="loading-text">Loading Events...</div>;

  return (
    <div id='Events'>
      <div className="Events-Heading">Events</div>
      
      <div className="Events-Content">
        {homeEvents.length === 0 ? (
          <p style={{ textAlign: 'center', width: '100%', padding: '20px' }}>No events to show.</p>
        ) : (
          homeEvents.map((item) => (
            <EventCard 
              key={item.id} 
              {...item}
              image={item.image_url} 
            />
          ))
        )}
      </div>

      <div className="All-Events-Button">
        <button onClick={() => window.location.href = '/EventsPage'}>
          SEE ALL EVENTS
        </button>
      </div>
    </div>
  );
};

export default Events;