import React from 'react';

interface RequireMetaConnectionProps {
    children: React.ReactNode;
}

/**
 * DEPRECATED: This component no longer blocks access.
 * Users can now access the dashboard without Meta connection.
 * A WelcomeModal will be shown instead to encourage connection.
 */
export const RequireMetaConnection: React.FC<RequireMetaConnectionProps> = ({ children }) => {
    // Allow access regardless of Meta connection status
    // The WelcomeModal in Dashboard will handle prompting users to connect
    return <>{children}</>;
};
