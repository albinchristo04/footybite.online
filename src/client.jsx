import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import FilterEngine from './components/FilterEngine';
import MobileNavigation from './components/MobileNavigation';

const container = document.getElementById('filter-engine-root');
if (container) {
    const initialEvents = JSON.parse(container.dataset.events);
    const initialSport = container.dataset.sport || 'all';
    const isHomepage = container.dataset.homepage === 'true';
    const initialDate = container.dataset.date || 'today';
    hydrateRoot(container, <FilterEngine initialEvents={initialEvents} initialSport={initialSport} isHomepage={isHomepage} initialDate={initialDate} />);
}
