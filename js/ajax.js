/*
 _______ __                              |               
|    ___|__.-----.-----.               --o--                
|   .___|  |o    |     |                 |               
|___|__ |__|__|__|__|__|_______ ______o _______ _______ 
|  |/  |_     _|    | o|       |_     _|_     _|    |  |
|     < _|   |_|       |   -   | |   |  _|   |_|       |
|__|\__|_______|__|____|_______| |___| |_______|__|____|
                                       Legendary Edition                     


*/


let moviesDb = {}; // This is All Movies Database. Empty yet. Gonna fill it.

// This is used to format timestamp into more userfriendly 13.45 format
function humanTime(timestamp) { // Timestamp comes as parameter
    const date = new Date(timestamp); // for clarity I do this line by line. First, we create a time from that timestamp.
    const hours = String(date.getHours()).padStart(2, '0'); // then we collect hours only from the timestamp and pad it with zeros.
    const minutes = String(date.getMinutes()).padStart(2, '0'); // same to minutes.
    return `${hours}.${minutes}`; // and return the time with padded zeros like 01.05
}

// Function to send request to the XML API
async function fetchSchedule() {
    try {
        // Define the URL for the API endpoint
        const url = 'https://www.finnkino.fi/xml/Schedule/';
        
        // Send the request over the network
        const response = await fetch(url);
        
        // Check for a successful response
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the response text as XML
        const xmlStr = await response.text();
        console.log("Full Async this time!");
        parseXML(xmlStr);  // Parse the XML data
        
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}


// Function to parse XML data
function parseXML(xmlStr) {
    const parser = new DOMParser();  // This is our XML shredder.
    const xmlDoc = parser.parseFromString(xmlStr, "text/xml");  // Parse Eeeverything...
    const shows = xmlDoc.querySelectorAll('Show'); // Get all the shows...
    
    // Array on stereoids. I wanted to filter only the movies (who goes to concert in a movie theater?!) so ...
    Array.from(shows).filter(show => { // ... I build the array... 
        const eventType = show.querySelector('EventType').textContent; // using eventType as filter
        return eventType === 'Movie'; // and returning the data only if the eventType matches!
    }).forEach(show => { // and then; Lets go through the shows! (using newly built array)
        const movieId = show.querySelector('ID').textContent; // First we collect the movie/event ID
        const data = Array.from(show.children).reduce((acc, node) => { // Then we go through THIS shows all the other nodes
            acc[node.nodeName] = node.textContent; // Each child goes to their own index in array
            return acc; // and then we return that arrray to the new name "data"
        }, {}); 
        moviesDb[movieId] = data; // Finally we add this show to MoviesDb using current show ID as index and Data with accumulated node names as properties. 
    });

}

// Call function to fetch schedule
// fetchSchedule(); // Yes. Now! Fetch movies and fill that moviesDb!
console.log("Loading and Parsing...");
function displayMovie(movieId) {
    const movie = moviesDb[movieId];
    if (movie) {
        console.log(movie.Title);  // Access moviesDb within another function
    } else {
        console.error('Movie not found:', movieId);
    }
}

// Fetch movies, then display a specific movie
    //displayMovie('1946456');
    async function initialize() {
        await fetchSchedule();
        // This code will run after moviesDb has been populated
           // Create a new script element
    const script = document.createElement('script');

    // Set the src attribute to the URL of the script file you want to load
    script.src = 'js/showtime.js';

    // Optional: Set up an event listener to be notified when the script has finished loading
    script.onload = function() {
        console.log('Script loaded!');
    };

    // Append the script element to the document
    document.body.appendChild(script);
    }
    
    initialize();



    //console.log(getTitle("1946456"));