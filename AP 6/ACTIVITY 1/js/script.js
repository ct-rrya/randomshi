// ACTIVITY 1 - JS

// object literal method
const song = {
  title: "The Beginning",
  artist: "ONE OK ROCK",
  genre: "Rock",
  mood: "Head-banging",
}

console.log(song);

// new object method
const song2 = new Object();
song2.title = "Close to you";
song2.artist = "The Carpenters";
song2.genre = "Pop";
song2.mood = "Chill";

console.log(song2);

// i like the object literal method better because it is easier to read and understand. 
// It is also easier to create multiple objects using the object literal method. 
// The new object method is more verbose and can be harder to read, especially when
//  creating multiple objects.
const song3 = {
  title: "Bring me to life",
  artist: "Evanescence",
  genre: "Rock",
  mood: "Head-banging",
}

console.log(song3);

// ACTIVITY 2 - JS
const playlist = {
    name: "songs i like",
    desc: "a playlist of songs that i like",
    songs: [song, song2, song3],
}

console.log(playlist);

//damn 

// ACTIVITY 3 - HTML INJECTION

// Get the HTML elements
const featuredTitle = document.getElementById("featured-title");
const featuredArtist = document.getElementById("featured-artist");
const featuredGenre = document.getElementById("featured-genre");
const featuredMood = document.getElementById("featured-mood");

// Put the song information into the HTML
featuredTitle.textContent = song.title;
featuredArtist.textContent = song.artist;
featuredGenre.textContent = song.genre;
featuredMood.textContent = song.mood;

// SONGS I EFFIN' LIKE
const favoriteSongs = document.getElementById("favorite-songs");

playlist.songs.forEach((song, index) => {

    let creationMethod;

    if (song === song2) {
        creationMethod = "Created using new Object()";
    } else {
        creationMethod = "Created using Object Literal";
    }

    favoriteSongs.innerHTML += `
        <div class="song-item" title="${creationMethod}">
            <span class="song-number">${String(index + 1).padStart(2, "0")}</span>

            <div class="song-main">
                <span class="song-title">${song.title}</span>
                <span class="song-artist">${song.artist}</span>
            </div>

            <span class="song-mood">${song.mood}</span>

            <span class="song-icon">♪</span>
        </div>
    `;

});