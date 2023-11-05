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
const selectType = document.getElementById("selectType");
const movieLocation = document.getElementById("selectTheater");
const showtime = document.getElementById('showtime');

let selectedType = selectType.value;
selectType.addEventListener('change',  function() {
    selectedType = selectType.value;
    initialize();
});

let selectedTheater = document.getElementById("selectTheater").value
movieLocation.addEventListener('change',  function() {
    selectedTheater = movieLocation.value;
    initialize();
});



// This is used to format timestamp into more userfriendly 13.45 format
function humanTime(timestamp) { // Timestamp comes as parameter
    const date = new Date(timestamp); // for clarity I do this line by line. First, we create a time from that timestamp.
    const hours = String(date.getHours()).padStart(2, '0'); // then we collect hours only from the timestamp and pad it with zeros.
    const minutes = String(date.getMinutes()).padStart(2, '0'); // same to minutes.
    return `${hours}.${minutes}`; // and return the time with padded zeros like 01.05
}


async function getCities() {
    const url = 'https://www.finnkino.fi/xml/TheatreAreas/';
    try {
        const response = await fetch(url);
        const xmlStr = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlStr, "text/xml");
        const theaterAreas = xmlDoc.querySelectorAll('TheatreArea');
        const selectBox = document.getElementById('selectTheater');
        theaterAreas.forEach(theaterArea => {
            const option = document.createElement('option');
            option.value = theaterArea.querySelector('ID').textContent;
            option.textContent = theaterArea.querySelector('Name').textContent;
            selectBox.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching or parsing theater area data:', error);
    }
}


// This is my OneShot template for the movies.
const template = `
<div class="onemovie">
    <div class="movie-container">
        <div class="left">
            <div class="movie-time">%dttmShowStart%</div>
            <div class="left movie-closing">Loppuu<br>%dttmShowEnd%</div>
        </div>
        <div class="movie-center">
            <div class="movie-title">%Title% <img src="%RatingImageUrl%" class="movie-mobile-rating-img" alt="%Rating%"></div>
            <div class="movie-info"><strong>%PresentationMethod%</strong> | %Genres% | Rated: %Rating%</div>
            <div class="movie-desc">Kesto: %LengthInMinutes% min. | %SpokenLanguage% | %TheatreAndAuditorium%</div>
            <div class="movie-mobile-links"><button>Osta liput</button> | <button>Finnkino</button></div>
        </div>
        <div class="movie-right">
            <div class="movie-rating"><img src="%RatingImageUrl%" alt="%Rating%"></div>
            <div class="movie-links"><button>Osta liput</button><br><button>Finnkino</button></div>
        </div>
    </div>
</div>
`;

// I use this to fill the template. 
function fillTemplate(data) { // I get the data as parameter from the getNextMovies or similar function  
    return template.replace(/%(\w+)%/g, (match, p1) => { // Data and Template has the same names. Data properties and %strings% in template. With regular expression I match those.
        return data[p1] || '';  // If there is no match, it returns '' for that property.
    });
}


function getNextMovies() {
    const thetime = new Date();
    //const timeNow = thetime.getTime();
    const timeNow = thetime.setHours(19,0,0,0); 
    //console.log(timeNow);
    const timeMidnight = thetime.setHours(24,0,0,0); 
    //console.log(timeMidnight);
    let htmlData = "<h2>Next Movies</h2><br>";
    
    // const timestamp = Date.parse(dateTimeString);
    for (let movieId in moviesDb) {
        if (moviesDb.hasOwnProperty(movieId)) {
            const movie = moviesDb[movieId];
            //console.log(movie.dttmShowStart);
            const begins = Date.parse(movie.dttmShowStart);
            if (begins > timeNow) {
                const currentMovie = {
                dttmShowStart: humanTime(begins),
                dttmShowEnd: humanTime(Date.parse(movie.dttmShowEnd)),
                Title: movie.Title,
                LengthInMinutes: movie.LengthInMinutes,
                Rating: movie.Rating,
                ProductionYear: movie.ProductionYear,
                Genres: movie.Genres,
                Theatre: movie.Theatre,
                TheatreAuditorium: movie.TheatreAuditorium,
                PresentationMethod: movie.PresentationMethod,
                SpokenLanguage: movie.SpokenLanguage.split('\n')[1].trim(), // This went full ape nuts. When I converted this XML to array I converted nested childs to Strings ... 
                RatingImageUrl: movie.RatingImageUrl,
                TheatreAndAuditorium: movie.TheatreAndAuditorium,
                ShowURL: movie.ShowURL
                }
                //console.log(movie.ShowUrl);
                htmlData += fillTemplate(currentMovie);
            } else {
                console.log("Tapahtuma / elokuva on menneisyydessä");
            }
        }
    }
    return htmlData;
}






// Function to send request to the XML API
async function fetchSchedule() {
    try {
        const url = `https://www.finnkino.fi/xml/Schedule/?area=${selectedTheater}`;
        console.log(url);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const xmlStr = await response.text();
        console.log("Full Async this time!");
        parseEvents(xmlStr);  // Parse the XML data
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}




function parseEvents(xmlStr) {
    const parser = new DOMParser();  // This is our XML shredder.
    const xmlDoc = parser.parseFromString(xmlStr, "text/xml");  // Parse Eeeverything...
    const shows = xmlDoc.querySelectorAll('Show'); // Get all the shows...
    Array.from(shows).filter(show => { // ... I build the array... 
        const eventType = show.querySelector('EventType').textContent; // using eventType as filter
        return eventType == selectedType; // and returning the data only if the eventType matches!
    }).forEach(show => { // and then; Lets go through the shows! (using newly built array)
        const movieId = show.querySelector('ID').textContent; // First we collect the movie/event ID
        const data = Array.from(show.children).reduce((acc, node) => { // Then we go through THIS shows all the other nodes
            acc[node.nodeName] = node.textContent; // Each child goes to their own index in array
            return acc; // and then we return that arrray to the new name "data"
        }, {}); 
        console.log("Going...");
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

async function initialize() {
    moviesDb = [];
    showtime.innerHTML = "";
    await getCities();
    await fetchSchedule();
    showtime.innerHTML = getNextMovies();
}
    
initialize();



    //console.log(getTitle("1946456"));