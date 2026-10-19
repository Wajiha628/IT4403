
const bookStatus = document.getElementById("bookStatus");
const bookDetails = document.getElementById("bookDetails");

// Get the book ID from the URL.
const params = new URLSearchParams(window.location.search);
const bookKey = params.get("key");

// Create an element safely and add text to it.
function createElement(tag, text, parent) {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.appendChild(element);
    return element;
}

// Load the selected book from Open Library.
async function loadBook() {
    if (!bookKey) {
        bookStatus.textContent =
            "No book was selected. Please return to Search and choose a book.";
        return;
    }

    try {
        bookStatus.textContent = "Loading book information...";
        
        const response = await fetch(
            `https://openlibrary.org${bookKey}.json`
        );

        if (!response.ok) {
            throw new Error("Book information could not be found.");
        }

        const book = await response.json();

        // Clear the loading message and old content.
        bookDetails.replaceChildren();
        bookStatus.textContent = "";

        // Book cover
        const cover = document.createElement("img");
        cover.className = "book-cover";
        cover.alt = `Cover of ${book.title || "this book"}`;

        if (book.covers && book.covers.length > 0) {
            cover.src =
                `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`;
        } else {
            cover.alt = "No book cover available";
            cover.classList.add("no-cover");
        }

        bookDetails.appendChild(cover);

        // Book title
        createElement("h2", book.title || "Untitled", bookDetails);

        // Description
        createElement("h3", "About This Book", bookDetails);

        let description = "No description is available for this book.";

        if (typeof book.description === "string") {
            description = book.description;
        } else if (book.description && book.description.value) {
            description = book.description.value;
        }

        createElement("p", description, bookDetails);

        // Subjects
        createElement("h3", "Subjects", bookDetails);

        if (book.subjects && book.subjects.length > 0) {
            const subjectList = document.createElement("ul");

            book.subjects.slice(0, 10).forEach(subject => {
                createElement("li", subject, subjectList);
            });

            bookDetails.appendChild(subjectList);
        } else {
            createElement("p", "No subjects listed.", bookDetails);
        }

        // Open Library link
        const openLibraryLink = document.createElement("a");
        openLibraryLink.href = `https://openlibrary.org${bookKey}`;
        openLibraryLink.textContent = "View on Open Library";
        openLibraryLink.target = "_blank";
        openLibraryLink.rel = "noopener noreferrer";
        openLibraryLink.className = "button";

        bookDetails.appendChild(openLibraryLink);

    } catch (error) {
        console.error("Error loading book:", error);
        bookStatus.textContent =
            "Sorry, we couldn't load this book. Please try again.";
    }
}

loadBook();
