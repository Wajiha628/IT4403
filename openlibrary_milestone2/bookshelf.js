// These are the Open Library Work IDs for the selected books.
const selectedBooks = [
    "/works/OL45804W",  // Fantastic Mr Fox
    "/works/OL82563W",  // Harry Potter and the Philosopher's Stone
    "/works/OL102749W", // Moby Dick
    "/works/OL27448W",  // The Lord of the Rings
    "/works/OL27482W"   // The Hobbit
];

const bookshelfBooks = document.getElementById("bookshelfBooks");
const bookshelfStatus = document.getElementById("bookshelfStatus");

// Load and display the selected books.
async function loadBookshelf() {
    bookshelfStatus.textContent = "Loading your books...";

    let loadedBooks = 0;

    for (const bookKey of selectedBooks) {
        try {
            const response = await fetch(
                `https://openlibrary.org${bookKey}.json`
            );

            if (!response.ok) {
                continue;
            }

            const book = await response.json();

            // Create a card for this book.
            const card = document.createElement("article");
            card.className = "book-card";

            // Display the book cover if available.
            const cover = document.createElement("img");
            cover.alt = `Cover of ${book.title || "book"}`;

            if (book.covers && book.covers.length > 0) {
                cover.src =
                    `https://covers.openlibrary.org/b/id/${book.covers[0]}-M.jpg`;

                cover.onerror = function () {
                    this.alt = "No cover available";
                    this.removeAttribute("src");
                };
            } else {
                cover.alt = "No cover available for this book";
            }

            card.appendChild(cover);

            // Display the title.
            const title = document.createElement("h3");
            title.textContent = book.title || "Untitled";
            card.appendChild(title);

            // Link to the book details page.
            const link = document.createElement("a");
            link.href = `book.html?key=${encodeURIComponent(bookKey)}`;
            link.textContent = "View Book";
            link.className = "book-link";

            card.appendChild(link);
            bookshelfBooks.appendChild(card);

            loadedBooks++;

        } catch (error) {
            console.error(`Could not load ${bookKey}:`, error);
        }
    }

    if (loadedBooks > 0) {
        bookshelfStatus.textContent =
            `Your bookshelf has ${loadedBooks} book${loadedBooks === 1 ? "" : "s"}!`;
    } else {
        bookshelfStatus.textContent =
            "We couldn't load the books right now. Please refresh the page and try again.";
    }
}

loadBookshelf();