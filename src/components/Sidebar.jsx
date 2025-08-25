import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const activeClass = 'bg-gray-700 text-white';
  const inactiveClass = 'text-gray-400 hover:bg-gray-700 hover:text-white';

  return (
    <Link to={to} className={`flex items-center p-2 space-x-3 rounded-md font-semibold ${isActive ? activeClass : inactiveClass}`}>
      {children}
    </Link>
  );
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-gray-800 p-4 flex flex-col justify-between">
      <div>
        <div className="text-2xl font-bold text-white mb-8 px-2">NuminaDocs</div>
        <nav>
          <ul className="space-y-2">
            <li>
              <NavLink to="/dashboard">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/mindmap">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.014A8.003 8.003 0 0112 3c1.398 0 2.743.57 3.714 1.543C18.343 6.57 19 9.714 19 12c2.007.429 2.986 1.143 2.986 2.986 0 1.429-.571 2.986-1.543 3.714A8.003 8.003 0 0112 21c-1.714 0-3.214-.429-4-1" /></svg>
                <span>Mapa Mental</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/search">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span>Búsqueda</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/projects">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                <span>Proyectos</span>
              </NavLink>
            </li>
             <li>
              <NavLink to="/templates">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                <span>Plantillas</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Configuración</span>
              </NavLink>
            </li>
            
            <li>
            <NavLink to="/archive">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                <span>Archivo</span>
            </NavLink>
            </li>

          </ul>
        </nav>
      </div>
      <div className="border-t border-gray-700 pt-4">
        {user && <p className="text-sm text-white font-semibold truncate px-2">{user.email}</p>}
        <button 
          onClick={handleLogout}
          className="w-full mt-2 text-left text-sm text-gray-400 hover:text-white p-2 rounded-md"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;