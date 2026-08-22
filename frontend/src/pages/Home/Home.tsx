import React from 'react';
import LandingPage from '../StudioApp/components/LandingPage';

export default function Home() {
    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col">
            <LandingPage />
        </div>
    );
}
