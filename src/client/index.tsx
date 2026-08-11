import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './Components/app';

// Check if the app is being server-side rendered
const rootElement = document.getElementById('root');

if (rootElement) {
    // Use hydrate if SSR content exists, otherwise use render
    const hasSSRContent = rootElement.innerHTML.trim().length > 0 && 
                          !rootElement.innerHTML.includes('<!-- SSR_CONTENT -->');
    
    if (hasSSRContent) {
        // Hydrate for SSR compatibility
        console.log('Hydrating SSR content...');
        ReactDOM.hydrate(
            <App />,
            rootElement
        );
    } else {
        // Standard client-side render
        console.log('Client-side rendering...');
        ReactDOM.render(
            <App />,
            rootElement
        );
    }
} else {
    console.error('Root element not found');
}
