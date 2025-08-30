import React from 'react';

interface RainbowTextProps {
  children: React.ReactNode;
  animated?: boolean;
  className?: string;
}

export function RainbowText({ children, animated = true, className = '' }: RainbowTextProps) {
  // Convert children to string to handle template literals and other React nodes
  const textContent = String(children);
  const characters = textContent.split('');
  
  return (
    <span className={`rainbow-text ${animated ? 'animated' : ''} ${className}`}>
      {characters.map((char, index) => (
        <span 
          key={index}
          className="char"
          style={{
            '--char-percent': index / characters.length
          } as React.CSSProperties}
        >
          {char}
        </span>
      ))}
    </span>
  );
}