import React, { useState } from 'react';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import './MessageFilters.css';

const MessageFilters = ({ onSearch, onFilterByType, currentFilter, groupId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const messageTypes = [
    { value: 'all', label: 'All Messages', icon: '💬' },
    { value: 'text', label: 'Text Only', icon: '📝' },
    { value: 'file', label: 'Files Only', icon: '📎' },
    { value: 'mixed', label: 'Text + Files', icon: '📎💬' },
    { value: 'reply', label: 'Replies', icon: '↩️' }
  ];

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (filterType) => {
    onFilterByType(filterType === 'all' ? null : filterType);
    setShowFilters(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  const getCurrentFilterLabel = () => {
    if (!currentFilter) return 'All Messages';
    const filter = messageTypes.find(type => type.value === currentFilter);
    return filter ? filter.label : 'All Messages';
  };

  return (
    <div className="message-filters">
      <div className="search-container">
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={clearSearch} className="clear-search-btn">
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      <div className="filter-container">
        <button
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter />
          <span>{getCurrentFilterLabel()}</span>
        </button>

        {showFilters && (
          <div className="filter-dropdown">
            {messageTypes.map((type) => (
              <button
                key={type.value}
                className={`filter-option ${currentFilter === type.value || (!currentFilter && type.value === 'all') ? 'active' : ''}`}
                onClick={() => handleFilterChange(type.value)}
              >
                <span className="filter-icon">{type.icon}</span>
                <span className="filter-label">{type.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageFilters;