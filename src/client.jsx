import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import FilterEngine from './components/FilterEngine';

const container = document.getElementById('filter-engine-root');
if (container) {
    const initialEvents = JSON.parse(container.dataset.events);
    const initialSport = container.dataset.sport || 'all';
    hydrateRoot(container, <FilterEngine initialEvents={initialEvents} initialSport={initialSport} />);
}
