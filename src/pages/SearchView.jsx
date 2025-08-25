// src/pages/SearchView.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import { Link } from 'react-router-dom';

const SearchResultItem = ({ result }) => {
  const isProject = result.result_type === 'project';
  const icon = isProject ? '📂' : '📄';
  const linkTo = isProject ? `/projects/${result.id}` : `/documents/${result.id}`;

  return (
    <Link to={linkTo}>
        <div className="p-4 bg-gray-800 rounded-lg hover:bg-purple-800/50 transition-colors border border-transparent hover:border-purple-500">
            <div className="flex items-center">
                <span className="text-2xl mr-4">{icon}</span>
                <div>
                    <div className="font-semibold text-white">{result.title}</div>
                    <div className="text-sm text-gray-400">{result.context}</div>
                </div>
            </div>
        </div>
    </Link>
  );
};

const SearchView = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500); // 500ms de retraso
  const { token } = useAuth();

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const response = await apiClient.get('/search/', {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: debouncedQuery }
        });
        setResults(response.data);
      } catch (error) {
        console.error("Error en la búsqueda:", error);
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [debouncedQuery, token]);

  const projects = results.filter(r => r.result_type === 'project');
  const documents = results.filter(r => r.result_type === 'document');

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Búsqueda Global</h1>
      <div className="sticky top-0 z-10 mb-6">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca en todos tus proyectos y documentos..."
          className="w-full p-4 bg-gray-800 text-lg text-white rounded-lg border-2 border-gray-700 focus:border-purple-500 focus:outline-none"
        />
      </div>
      
      {loading && <p className="text-gray-400">Buscando...</p>}

      {!loading && query.length > 0 && results.length === 0 && (
        <p className="text-gray-500">No se encontraron resultados para "{query}".</p>
      )}

      <div className="space-y-8">
        {projects.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Proyectos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(result => <SearchResultItem key={`proj-${result.id}`} result={result} />)}
            </div>
          </div>
        )}
        {documents.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Documentos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map(result => <SearchResultItem key={`doc-${result.id}`} result={result} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;