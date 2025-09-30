
import React, { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 ${className}`}>
            {children}
        </div>
    );
};

export default Card;
