
import React from 'react';

const BtcIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-accent">
        <path d="M16.5 7.5h2.5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2.5m-11-11h2.5a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-2.5m11 11V4.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2z"></path>
    </svg>
);

const Header: React.FC = () => {
  return (
    <header className="bg-shark/50 backdrop-blur-sm border-b border-tuna sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <BtcIcon />
            <h1 className="text-xl md:text-2xl font-bold text-white">
              Sinais VWAP <span className="text-cyan-accent">BTC/USD</span>
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
