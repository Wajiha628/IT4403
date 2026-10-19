
/*
Resources: https://openlibrary.org/developers/api
*/

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const resultsPerPage = document.getElementById("resultsPerPage");
const bookResults = document.getElementById("bookResults");
const statusMessage = document.getElementById("statusMessage");
const previousButton = document.getElementById("previousPage");
const nextButton = document.getElementById("nextPage");
const pageNumber = document.getElementById("pageInfo");
let currentSearch = "";
let currentPage = 1;
let totalPages = 1;

// Search when the user submits the form
searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const searchTerm = searchInput.value.trim();

    if (searchTerm === "") {
        statusMessage.textContent = "Please enter a book title or author.";
        return;
    }

    currentSearch = searchTerm;
    currentPage = 1;

    searchBooks();
});

// Change the number of results displayed per page
resultsPerPage.addEventListener("change", function () {
    if (currentSearch !== "") {
        currentPage = 1;
        searchBooks();
    }
});

// Go to the previous page
previousButton.addEventListener("click", function () {
    if (currentPage > 1) {
        currentPage--;
        searchBooks();
    }
});

// Go to the next page
nextButton.addEventListener("click", function () {
    if (currentPage < totalPages) {
        currentPage++;
        searchBooks();
    }
});

// Search the Open Library API
async function searchBooks() {
    console.log("searchBooks function started");


    const limit = Number(resultsPerPage.value);
    const offset = (currentPage - 1) * limit;

    statusMessage.textContent = "Searching for books...";
    bookResults.innerHTML = "";

    previousButton.disabled = true;
    nextButton.disabled = true;

    try {
        const url =
            "https://openlibrary.org/search.json?q=" +
            encodeURIComponent(currentSearch) +
            "&limit=" + limit +
            "&offset=" + offset;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to retrieve book information.");
        }

        const data = await response.json();

        totalPages = Math.ceil(data.numFound / limit);

        if (data.docs.length === 0) {
            statusMessage.textContent = "No books found. Try another search.";
            pageNumber.textContent = "Page 1";
            totalPages = 1;
            updatePagination();
            return;
        }

        statusMessage.textContent =
            "Found " + data.numFound.toLocaleString() + " books.";

        displayBooks(data.docs);
        updatePagination();

    } catch (error) {
        statusMessage.textContent =
            "Something went wrong while searching. Please try again.";

        pageNumber.textContent = "Page " + currentPage;
        console.error("Search error:", error);
    }
}

// Display the book results
function displayBooks(books) {
    bookResults.innerHTML = "";

    books.forEach(function (book) {
        const bookCard = document.createElement("article");
        bookCard.className = "book-card";

        // Display the book cover if one is available
        if (book.cover_i) {
            const cover = document.createElement("img");

            cover.src =
                "https://covers.openlibrary.org/b/id/" +
                book.cover_i + "-M.jpg";

            cover.alt = "Cover of " + (book.title || "Untitled book");
            cover.loading = "lazy";

            cover.onerror = function () {
                cover.style.display = "none";
            };

            bookCard.appendChild(cover);
        }

        const title = document.createElement("h3");
        title.textContent = book.title || "Untitled";

        const author = document.createElement("p");
        author.textContent =
            "Author(s): " +
            (book.author_name
                ? book.author_name.join(", ")
                : "Unknown author");

        const year = document.createElement("p");
        year.textContent =
            "First published: " + (book.first_publish_year || "Unknown");

        const detailsLink = document.createElement("a");
        detailsLink.textContent = "View Details";

        if (book.key) {
            detailsLink.href =
                "book.html?key=" + encodeURIComponent(book.key);
        } else {
            detailsLink.href = "book.html";
        }

        bookCard.appendChild(title);
        bookCard.appendChild(author);
        bookCard.appendChild(year);
        bookCard.appendChild(detailsLink);

        bookResults.appendChild(bookCard);
    });
}

// Update the pagination controls
function updatePagination() {
    pageNumber.textContent =
        "Page " + currentPage + " of " + totalPages;

    previousButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;

    document.getElementById("pagination").hidden = false;
}