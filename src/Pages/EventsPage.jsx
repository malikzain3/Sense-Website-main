import React, { useState, useEffect } from "react";
import EventCard from "../Components/EventCard";
import "./EventsPage.css";

const EventsPage = () => {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/events");
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();

        // Sort: Upcoming events first, then by date
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(`${a.month} ${a.date}, ${a.year}`).getTime() || 0;
          const dateB = new Date(`${b.month} ${b.date}, ${b.year}`).getTime() || 0;
          const isAUpcoming = a.status?.toLowerCase() === 'upcoming';
          const isBUpcoming = b.status?.toLowerCase() === 'upcoming';
          
          if (isAUpcoming && !isBUpcoming) return -1;
          if (!isAUpcoming && isBUpcoming) return 1;
          return isAUpcoming ? dateA - dateB : dateB - dateA;
        });

        setEvents(sorted);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className={`events-container ${mounted ? "page-entered" : "page-entering"}`}>
      <h1 className="events-title">All <span>Events</span></h1>
      
      {loading ? (
        <p className="no-events">Loading events... ⏳</p>
      ) : events.length === 0 ? (
        <p className="no-events">No events found.</p>
      ) : (
        <div className="events-grid">
          {events.map((item, i) => (
            <div key={item.id} className="card-wrapper flex justify-center" style={{ "--card-i": i }}>
              <EventCard
                {...item}
                image={item.image_url}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;