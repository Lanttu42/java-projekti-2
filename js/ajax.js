/*
 _______ __                              |               
|    ___|__.-----.-----.               --o--                
|   .___|  |o    |     |                 |               
|___|__ |__|__|__|__|__|_______ ______o _______ _______ 
|  |/  |_     _|    | o|       |_     _|_     _|    |  |
|     < _|   |_|       |   -   | |   |  _|   |_|       |
|__|\__|_______|__|____|_______| |___| |_______|__|____|
                                       Legendary Edition                     

                                    
Known issue: 
 - Abuses API's by fetching all the data again and again. 
 - Search is "text4text" match only. No magic here. 
 - API keys are unsecurely visible in the code.
 
 Disclaimer: 
 This is a consept model of Finnkinotin. Real App should utilize backend-code to fetch movie data hourly
 and only Delta changes. Using backend allows more secure Key handling, better API-requests better error
 handling. For example: Currently, if Finnkino API is not responding, this app wont show any movies.

*/


let moviesDb = {}; // This is All Movies Database. Empty yet. Gonna fill it.
const loadingDiv = document.getElementById("loadingtext"); // Preparing to update Loading text in realtime
let loadingText = loadingDiv.innerHTML // Lets get our default value from that loadingDiv
const selectType = document.getElementById("selectType"); // Movie or Live Event selection
const movieLocation = document.getElementById("selectTheater"); // Which theater is selected
const showtime = document.getElementById('showtime'); // This is where everyhing is crafted. 


// Time and date. This is sadly used only to display time and date at the beginning of the website. 
function getCurrentDate() { // preparing function
    const date = new Date(); // Create a new object date from Date()
    const day = String(date.getDate()).padStart(2, '0'); // Stringify the results of getdate and add zeros 01.09.2023
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Same-o-same-o...
    const year = date.getFullYear(); // get the year from that object
    return `${day}.${month}.${year}`; // Return it as dd.mm.yyyy format. 
}

function getCurrentTime() { // preparing function
    const date = new Date(); // date as new object
    const hours = String(date.getHours()).padStart(2, '0'); // Stringify again, because I like those zeros.
    const minutes = String(date.getMinutes()).padStart(2, '0'); // same as above
    return `${hours}.${minutes}`; // return it in Finnish time format.
}

// And finally use those
document.getElementById("currentDate").innerHTML = getCurrentDate(); // to write currenDate into HTML
document.getElementById("currentTime").innerHTML = "Kello: "+getCurrentTime(); // and currentTime into HTML


const searchTerm = document.getElementById('searchThis'); // define where the searchValue can be fetched
document.getElementById('searchForm').addEventListener('submit', function(event) { // adding eventListener as function
    document.getElementById("searchResults").innerHTML = ""; // Empty SearchResults Div
    const movieContainers = document.querySelectorAll('.onemovie'); // Get all the currently displayed movies.
    event.preventDefault(); // We dont like Submit to reload the page
    const searchValue = searchTerm.value.trim().toLowerCase(); // Turning everything lowercase. Yes. No case-sensitive search
    let movieCount = movieContainers.length; // How many movies we had before Search
    let toShow = 0; // Zero that counter for now
    movieContainers.forEach(movie => { // Lets go through the movieContainers as movie by movie
        const movieText = movie.textContent.toLowerCase(); // Get all text content from a movie container and convert it to lower case
        if (movieText.includes(searchValue)) { // If this movieText now holds the searhValue
            movie.style.display = 'block'; // the movie DIV will stay visible (or turned visible)
            toShow++; // lets add one toShow
        } else { // if the searchValue is not found
            movie.style.display = 'none'; // hide the div.
        } // End of IF
    }); // end of forEach
    if (toShow < 1) { // if toShow is less than 1
        document.getElementById("statusbox").innerHTML = "Hakutermillä <span style='color: #FFF'>\""+searchValue+"\"</span> ei löytynyt tuloksia..."; // We tell that to the user
        document.getElementById("statusbox").style.display = "block"; // and show the statusbox
    } else { // but if it is 1 or more
        document.getElementById("searchResults").innerHTML = "Hakutuloksia "+toShow+" ("+movieCount+" mahdollisista)"; // we tell the results to the user
        document.getElementById("statusbox").style.display = "none"; // and hide the statusbox
    } // end of IF
}); // End of Function / event listener

let selectedType = selectType.value; // selectedType will be use later in this code. Now we just collect that from the pulldown menu
selectType.addEventListener('change',  function() { // and add eventlistener to update the screen if this is changed.
    selectedType = selectType.value; // collect the value again for later use
    initialize(); // start the initialize  function
}); // end of function / eventListener

let Theaters = {}; // Empty Theaters array
let selectedTheater = getLatestTheaterID(); // This one gets latest TheaterID from localstorage. 

// These are the only optimizers that I have made for this code. I keep the latest theater ID in localstorage
// so I dont load "All Theaters ID" every time when user comes to the page.
function getLatestTheaterID() { // function start
    let cityID = localStorage.getItem('FavoriteTheaterID'); // Getting cityID from locastorage file FavorieTheaterID
    if (!cityID) { // If there isn't any cityID available
        cityID = 1014; // cityID will be defaulted to Pääkaupunkiseutu
    } // end of IF
    return parseInt(cityID); // return the collected cityID as Integer
} // end of function

function storeLatestTheaterID(thisID) { // Start the function to store cityID to localStorage
    localStorage.setItem('FavoriteTheaterID', parseInt(thisID)); // we save that that cityID to FavoriteTheaterID file in local storage
} // end of function

movieLocation.addEventListener('change',  function() { // Adding event listener to look for changes in Theater selection
    selectedTheater = movieLocation.value; // Assign the pulldown value to selectedTheater
    showtime.innerHTML = '<div class="loading-screen"><div id="loadingtext"> Etsitään sulle niit elokuvii... </div><div class="film-reel"> o </div></div>'; // Start the Loading... animation again
    storeLatestTheaterID(selectedTheater); // Store selection to localstorage
    initialize(); // start the page initialization routine again
}); // end of function / eventListener

let movieDetails = {}; // empty movieDetails
// Now we cut to the beef...
async function getMovieData(title, year) { // start function in asyncrounous mode (tell the code to await the results)
    loadingDiv.innerHTML = loadingText+"<br> Etsitään "+title+" kohdetta OMDB:ltä..."; // Fancy loading addon - show the results in realtime
    const apiKey = '3ec3720b'; // Unsecure way to use API-keys
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&y=${year}&apikey=${apiKey}`; // define url to use that API-key and where the data is
    const defaultMovieData = {}; // define and empty defaultMovieData this is just to prevent stupid error messages if Finnkino XML fails

    try { // try this... 
        const response = await fetch(url); // get data from async fetch to response
        if (!response.ok) { // check the response. 
            throw new Error('OUTS! Fetching data failed:  ' + response.statusText); // Throwing error and fail the try
        } // end if
        const movieData = await response.json(); // fill movieData with response JSON
        return movieData; // return the moviedata. Try Success!
    } catch (error) { // about that fail...
        console.error('There has been a problem with your fetch operation:', error); // show an error message to console log
        return defaultMovieData; // return the defaultMovieData to prevent crashing
    } // end of try and catach
} // end of async function


// This is used to format timestamp into more userfriendly 13.45 format
function humanTime(timestamp) { // Timestamp comes as parameter
    const date = new Date(timestamp); // for clarity I do this line by line. First, we create a time from that timestamp.
    const hours = String(date.getHours()).padStart(2, '0'); // then we collect hours only from the timestamp and pad it with zeros.
    const minutes = String(date.getMinutes()).padStart(2, '0'); // same to minutes.
    return `${hours}.${minutes}`; // and return the time with padded zeros like 01.05
} // end of function... Only 100 lines more to comment!


async function getCities() { // Start of async function getCtities. This will collect TheaterCodes and names.
    const url = 'https://www.finnkino.fi/xml/TheatreAreas/'; // url where to get them
    try { // Start of Try and Catch
        const response = await fetch(url);  // fetchin URL again to response
        const xmlStr = await response.text(); // lets await this also to get the data into xmlstr
        const parser = new DOMParser(); // Create new parser object
        const xmlDoc = parser.parseFromString(xmlStr, "text/xml"); // parse the XML using that DOMParser object
        const theaterAreas = xmlDoc.querySelectorAll('TheatreArea'); // Now we can use familiar commands like this to selected TheatreAreas
        const selectBox = document.getElementById('selectTheater'); // define that selectBox is our div with ID selectTheater 
        theaterAreas.forEach(theaterArea => { // and go through our xmlStr that we parsed to DOM Document theaterArea by TheaterArea
            const option = document.createElement('option'); // We create new element to option 
            const thiscityID = theaterArea.querySelector('ID').textContent; // collect current ID from the DOM document
            if (thiscityID !== "1029") { // we don't like the "All theaters" - everyhing besides that goes.
                option.value = thiscityID; // adding new value to option
                option.textContent = theaterArea.querySelector('Name').textContent; // and user friendly text for that value
                selectBox.appendChild(option); // Adding the Option to select box
                Theaters[thiscityID] = option.textContent; // Lets fill that Theaters array with the current data also
                if (thiscityID == selectedTheater) { // Check if this ID is the same as currently selected ID
                    option.selected = true; // IT is! Lets make this one Selected!
                } // end if
            } // End if
        }); // End ForEach
    } catch (error) { // End try... Could have done withour this ...
        console.error('OUTS! Finnkino did not give any Theater info: ', error); // Give some fancy error
    } // End try and catch
} // end of Function


// This is my OneShot template for the movies. Not going to explain it line by line. :D
const template = `
<div class="onemovie">
    <div class="movie-container">
        <div class="left">
            <div class="movie-time">%dttmShowStart%</div>
            <div class="left movie-closing"><small>Loppuu</small><br>%dttmShowEnd%</div>
        </div>
        <div class="movie-center">
            <div class="movie-title">%Title%<img src="%RatingImageUrl%" class="movie-mobile-rating-img" alt="%Rating%"></div>
            <div class="movie-info"><strong>%PresentationMethod%</strong> - %Genres% - Rated: %Rating% - Kesto: %LengthInMinutes% min. | %SpokenLanguage% | %TheatreAndAuditorium%<br>
            %Director% %IMDB% %Actors%</div>
            <div class="movie-desc">%Plot%</div>
            <div class="movie-links"><a class="gotoFinnkino" target="_blank" href="%EventURL%">Siirry Finnkinon sivustolle</a></div>
            <div class="movie-mobile-ticketlinks"><a href="%ShowURL%" class="movie-mobile-BuyTickets">Osta liput</a></div>
        </div>
        <div class="movie-right">
            <div class="movie-image"><img src="%movieImage%" style="height:auto;" alt="%Title% - kuva elokuvasta"></div>
            <div class="movie-ticketlinks"><a href="%ShowURL%" class="movie-BuyTickets">Osta liput</a></div>
        </div>
    </div>
</div>
`; // End of template

// I use this to fill the template. 
function fillTemplate(data) { // I get the data as parameter from the getNextMovies or similar function  
    return template.replace(/%(\w+)%/g, (match, p1) => { // Data and Template has the same names. Data properties and %strings% in template. With regular expression I match those.
        return data[p1] || '';  // If there is no match, it returns '' for that property.
    }); // end matching
} // end of function

function abshort(moviesDb) { // Finnkino results movies without any ordering. I used a-b shorting with the dates
    const moviesArray = Object.values(moviesDb); // All movies comes as parameter
    moviesArray.sort((a, b) => new Date(a.dttmShowStart) - new Date(b.dttmShowStart)); // if a showtime is before b showtime no need to arrange.  AB short is actually pretty nice function!
    return moviesArray; // After shorting, return the shorted array
} // end of function

// Get Next movies is the Heart and Soul of this app. This only shows the movies that are still showing today 
// and after this moment.
async function getNextMovies() {  // start async function to get next movies
    const thetime = new Date(); // creating thetime
    const shortedDb = abshort(moviesDb); // this is where I shortmovies as I noticed that they are not shorted
    //const timeNow = thetime.setHours(19,0,0,0);  //  Debug time
    const timeNow = thetime.getTime();  // Get current time
    const timeMidnight = thetime.setHours(24,0,0,0);  // get today midnight
    let htmlData = `<h2>Seuraavat elokuvat kohteessa:<br>${Theaters[selectedTheater]}</h2><br>`; // Add Header to HTMLdata
    let debugCount = 0; // Debug counter to prevent multiple API Fetches while creating the app
    let apicount = 0; // Api usage counter 
    for (let movieId in shortedDb) { // Lets go through those shorted movies. 
        //if ((shortedDb.hasOwnProperty(movieId)) && (debugCount < 3)) { // Debug mode 
        if (shortedDb.hasOwnProperty(movieId)) { // if the MovieID really has some data in it (This is used to prevent some mäyhem)
            const movie = shortedDb[movieId]; // For easier use, collect the movie ID to movie
            const begins = Date.parse(movie.dttmShowStart); // Current movie starting time
            let movieBegins = humanTime(begins); // lets turn it HumanTime as we are going to display this.
            const isItSoon = parseInt((begins - timeNow) / (60000)); // How much time we got left?
            if (isItSoon < 30) movieBegins = isItSoon+"Min"; // Less than 30 min? Ok. Show minutes instead of time
            if (isItSoon < 2) movieBegins = "RUN"; // less than 2 minutes? You better RUN
            if (begins > timeNow) { // still, if it begins after current time, we will add it to be displayed
                await getMovieData(movie.Title, movie.ProductionYear).then(movieDetails => { // At first, lets get the OMDB data and THEN
                    apicount++; // Count that we used that OMDB API. Because there is 1000 fetch limit per day...
                    let currentMovie = { // Well, yes back to .then --> lets fill out that currenMovie
                    dttmShowStart: movieBegins,
                    dttmShowEnd: humanTime(Date.parse(movie.dttmShowEnd)),
                    Title: movie.Title,
                    LengthInMinutes: movie.LengthInMinutes,
                    Rating: movie.Rating,
                    ProductionYear: movie.ProductionYear,
                    Genres: movie.Genres,
                    Theatre: movie.Theatre,
                    movieImage: movie.Images.split('\n')[4].trim(),
                    TheatreAuditorium: movie.TheatreAuditorium,
                    PresentationMethod: movie.PresentationMethod,
                    SpokenLanguage: movie.SpokenLanguage.split('\n')[1].trim(), // This went full ape nuts. When I converted this XML to array I converted nested childs to Strings ... 
                    RatingImageUrl: movie.RatingImageUrl,
                    EventURL: movie.EventURL,
                    TheatreAndAuditorium: movie.TheatreAndAuditorium,
                    ShowURL: movie.ShowURL,
                    Plot: movieDetails.Plot,
                    Actors: movieDetails.Actors ? "Pääosassa :" + movieDetails.Actors : "Pääosassa : N/A",
                    Director: movieDetails.Director ? "Ohjaaja: " + movieDetails.Director : "Ohjaaja: N/A",
                    IMDB: movieDetails.imdbRating ? "IMDB pisteet: " + movieDetails.imdbRating : "IMDB pisteet: N/A"
                
                }; // End of filling currentMovie
                htmlData += fillTemplate(currentMovie); // Use the template to build this HTML data
                }); // End of Awaited getMoviedata
                debugCount++; // add debug counter
            } else { // If !begings > timeNow
                console.log("Tapahtuma / elokuva on menneisyydessä"); // Add it to the log
            } // End of IF

        } // End of hasOwnProperty IF
    } // End of FOR
    const statusbox = document.getElementById("statusbox"); // Define Statusbox
    if (apicount < 1) { // if api was not used ( = no movies searched )
        statusbox.style = "display: block;" // display the div
        statusbox.innerHTML = "Ei tuloksia. Oliskohan tältä päivältä jo kaikki nähty?" // and add error message into it
    } else { // else
        statusbox.innerHTML = ""; // nothing inside
        statusbox.style = "display: none;" // no displaying
    } // end of IF
    return htmlData; // And then we return the HTMLdata to initializer to add it into showtime
}


// Function to send request to the XML API
async function fetchSchedule() { // async function to fetch finnkino movies
    loadingDiv.innerHTML = loadingText+"<br> Kysytään Finnkinolta ..."; // fancy update to loading animation
    try { // Lets start Try and Catch again.
        const url = `https://www.finnkino.fi/xml/Schedule/?area=${selectedTheater}`; // this is what we get. selectedTheater comes from pulldown or/and localstorage
        const response = await fetch(url); // lets await until fetch returns our response
        if (!response.ok) { // check that response
            throw new Error(`Fetching the Schedule failed: ${response.status}`); // Forming an error message
        } // end of IF
        const xmlStr = await response.text(); // xmlStr gets text() from response
        parseEvents(xmlStr);  // Parse the XML data
    } catch (error) { // if there was an error thrown
        console.error('I think it failed... ', error); // with a message
    } // end of try
} // end of async function


function parseEvents(xmlStr) { // Function to parse events
    const parser = new DOMParser();  // This is again our XML shredder.
    const xmlDoc = parser.parseFromString(xmlStr, "text/xml");  // XML to DOM Document
    const shows = xmlDoc.querySelectorAll('Show'); // Get all the shows... 
    Array.from(shows).filter(show => { // ... I build the array... 
        const eventType = show.querySelector('EventType').textContent; // using eventType as filter
        return eventType == selectedType; // and returning the data only if the eventType matches!
    }).forEach(show => { // and then; Lets go through the shows! (using newly built array)
        const movieId = show.querySelector('ID').textContent; // First we collect the movie/event ID
        const data = Array.from(show.children).reduce((acc, node) => { // Then we go through THIS shows all the other nodes
            acc[node.nodeName] = node.textContent; // Each child goes to their own index in array
            return acc; // and then we return that arrray to the new name "data"
        }, {});  // End of array building
        moviesDb[movieId] = data; // Finally we add this show to MoviesDb using current show ID as index and Data with accumulated node names as properties. 
    }); // End of Foreach wich was function in array.from
} // end of function

// INITIALIZE! Now when all the code has loaded, we are ready to go.
// Initialize is also called when theater is changed.
async function initialize() { // Start of Async initalize
    moviesDb = []; // Empty moviesDb because new data is coming!
    await getCities(); // Get current cities
    await fetchSchedule(); // Fetch the current Schedule
    showtime.innerHTML = await getNextMovies(); // finally fill the Showtime DIV
} // end of Function

initialize(); // Energize!
