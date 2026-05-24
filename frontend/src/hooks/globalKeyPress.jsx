import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
function useGlobalKeyPress() {
    const [currentWord, setCurrentWord] = useState('');
    const navigate = useNavigate();
    let location = useLocation();

    useEffect(() => {
        // Function to handle keydown events
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') {
                if (currentWord === '9789390166268' && location.pathname === '/sales/form/') {
                    navigate('/');
                } else
                if (currentWord === '9789390166268') {
                    console.log("key is :", currentWord);
                    navigate('/sales/form/');
                }
                setCurrentWord(''); // Clear the current word after logging
            } else {
                setCurrentWord((prevWord) => prevWord + event.key);
            }
        };
        
        if (location.pathname === '/sales/form/') {
            // If on the "/disable" route, do not set up the event listener
            return;
        }
        // Add the event listener
        window.addEventListener('keydown', handleKeyDown);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentWord]); // Dependency array includes currentWord

    return currentWord;
}

export default useGlobalKeyPress;
