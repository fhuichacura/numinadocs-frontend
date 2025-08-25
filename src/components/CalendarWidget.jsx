import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';

const CalendarWidget = () => {
  const { token } = useAuth();
  const calendarRef = useRef(null);

  const fetchEvents = async (fetchInfo, successCallback, failureCallback) => {
    try {
      const response = await apiClient.get('/calendar/', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start: fetchInfo.startStr,
          end: fetchInfo.endStr,
        },
      });
      const events = response.data.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
      }));
      successCallback(events);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
      failureCallback(error);
    }
  };

  const handleDateClick = async (arg) => {
    const title = prompt('Nombre del Evento:');
    if (title) {
      try {
        const payload = {
          title: title,
          start_time: arg.dateStr,
        };
        await apiClient.post('/calendar/', JSON.stringify(payload), {
           headers: { 
             'Content-Type': 'application/json',
             Authorization: `Bearer ${token}` 
            },
        });
        if (calendarRef.current) {
          calendarRef.current.getApi().refetchEvents();
        }
      } catch (error) {
        console.error("Error al crear el evento:", error);
        alert("No se pudo crear el evento.");
      }
    }
  };

  const handleEventClick = async (clickInfo) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el evento '${clickInfo.event.title}'?`)) {
      try {
        await apiClient.delete(`/calendar/${clickInfo.event.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        clickInfo.event.remove();
      } catch (error) {
        console.error("Error al eliminar el evento:", error);
        alert("No se pudo eliminar el evento.");
      }
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg h-full text-sm">
      <h2 className="text-xl font-semibold text-white mb-4">Calendario / Agenda</h2>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={fetchEvents}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="100%"
        locale="es"
        headerToolbar={{
          left: 'prev',
          center: 'title',
          right: 'next'
        }}
        buttonText={{
          today: 'Hoy',
        }}
      />
    </div>
  );
};

export default CalendarWidget;