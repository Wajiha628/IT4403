
$(document).ready(function () {

    const API_URL = "https://openlibrary.org";
    const BOOKS_PER_PAGE = 10;
    const MAX_RESULTS = 50;

    let currentPage = 1;
    let currentSearch = "";
    let searchBooksData = [];
    let totalPages = 0;
    let searchInProgress = false;

    // Create a book cover or a fallback placeholder
    function createCover(coverId, title, size) {

        if (!coverId) {
            return $("<div>")
                .addClass("book-cover-placeholder")
                .text("No cover available");
        }

        const image = $("<img>")
            .addClass("book-cover")
            .attr(
                "src",
                "https://covers.openlibrary.org/b/id/" +
                coverId + "-" + size + ".jpg"
            )
            .attr("alt", title + " book cover");

        // Replace unavailable images with a placeholder
        image.on("error", function () {
            $(this).replaceWith(
                $("<div>")
                    .addClass("book-cover-placeholder")
                    .text("No cover available")
            );
        });

        return image;
    }

    // Search form submission
    $("#searchForm").on("submit", function (event) {

        event.preventDefault();

        if (searchInProgress) {
            return;
        }

        currentSearch = $("#searchInput").val().trim();

        if (currentSearch === "") {
            $("#searchStatus")
                .text("Please enter a book title or keyword.")
                .removeClass("success-message")
                .addClass("error-message");

            return;
        }

        currentPage = 1;
        searchBooks();
    });

    // Retrieve up to 50 search results
    function searchBooks() {

        searchInProgress = true;

        $("#searchButton").prop("disabled", true);
        $("#searchStatus")
            .text("Searching for books...")
            .removeClass("error-message success-message");

        $("#searchResults").empty();
        updatePagination();

        $.ajax({
            url: API_URL + "/search.json",
            method: "GET",
            dataType: "json",
            data: {
                q: currentSearch,
                limit: MAX_RESULTS
            }
        })

        .done(function (data) {

            searchBooksData = (data.docs || []).slice(0, MAX_RESULTS);

            if (searchBooksData.length === 0) {

                totalPages = 0;
                currentPage = 1;

                $("#searchStatus")
                    .text("No books found. Try another search.")
                    .addClass("error-message");

                updatePagination();
                return;
            }

            totalPages = Math.ceil(
                searchBooksData.length / BOOKS_PER_PAGE
            );

            const resultCount = searchBooksData.length;

            let message = "Found " + data.numFound + " books.";

            if (Number(data.numFound) > MAX_RESULTS) {
                message += " Showing the first 50 results.";
            }

            message += " Displaying " + resultCount + " available results.";

            $("#searchStatus")
                .text(message)
                .addClass("success-message");

            displayCurrentPage();
        })

        .fail(function () {

            searchBooksData = [];
            totalPages = 0;
            currentPage = 1;

            $("#searchStatus")
                .text("Unable to retrieve books. Please try again.")
                .addClass("error-message");

            $("#searchResults").empty();
            updatePagination();
        })

        .always(function () {

            searchInProgress = false;
            $("#searchButton").prop("disabled", false);
            updatePagination();
        });
    }

    // Display the current group of 10 books
    function displayCurrentPage() {

        const start = (currentPage - 1) * BOOKS_PER_PAGE;

        const currentBooks = searchBooksData.slice(
            start,
            start + BOOKS_PER_PAGE
        );

        displayBooks(currentBooks, "#searchResults");

        updatePagination();
    }

    // Create and display book cards
    function displayBooks(books, container) {

        $(container).empty();

        books.forEach(function (book) {

            const title = book.title || "Untitled";

            const authorNames = book.author_name || [];

            const authorText = authorNames.length > 0
                ? authorNames.join(", ")
                : "Unknown author";

            const card = $("<div>").addClass("book-card");

            const cover = createCover(book.cover_i, title, "M");

            const heading = $("<h3>")
                .addClass("book-title")
                .text(title);

            const author = $("<p>").text(authorText);

            const button = $("<button>")
                .attr("type", "button")
                .text("View Details")
                .on("click", function () {

                    getBookDetails(
                        book.key,
                        authorNames,
                        book.cover_i
                    );
                });

            card.append(cover, heading, author, button);

            $(container).append(card);
        });
    }

    // Update pagination information and buttons
    function updatePagination() {

        $("#pageInfo").text(
            totalPages === 0
                ? "Page 0 of 0"
                : "Page " + currentPage + " of " + totalPages
        );

        $("#previousButton").prop(
            "disabled",
            searchInProgress || currentPage <= 1
        );

        $("#nextButton").prop(
            "disabled",
            searchInProgress || currentPage >= totalPages
        );
    }

    // Previous page
    $("#previousButton").on("click", function () {

        if (!searchInProgress && currentPage > 1) {

            currentPage--;
            displayCurrentPage();
        }
    });

    // Next page
    $("#nextButton").on("click", function () {

        if (!searchInProgress && currentPage < totalPages) {

            currentPage++;
            displayCurrentPage();
        }
    });

    // Retrieve selected book details using its Work ID
    function getBookDetails(bookKey, authorNames, searchCoverId) {

        if (!bookKey) {
            $("#bookDetails").text("Book information is unavailable.");
            return;
        }

        $("#bookDetails").html(
            "<p class='empty-message'>Loading book details...</p>"
        );

        $.ajax({
            url: API_URL + bookKey + ".json",
            method: "GET",
            dataType: "json"
        })

        .done(function (book) {

            const title = book.title || "Untitled";

            const workID = bookKey.replace("/works/", "");

            // Handle different description formats
            let description = "Description unavailable.";

            if (typeof book.description === "string") {
                description = book.description;
            } else if (
                book.description &&
                book.description.value
            ) {
                description = book.description.value;
            }

            // Handle author information
            const authors = authorNames && authorNames.length > 0
                ? authorNames.join(", ")
                : "Author information unavailable.";

            // Handle missing subjects
            const subjects = book.subjects
                ? book.subjects.slice(0, 10)
                : [];

            const coverId = book.covers && book.covers.length > 0
                ? book.covers[0]
                : searchCoverId;

            // Create details layout
            const details = $("<div>").addClass("details-content");

            const cover = createCover(coverId, title, "L");

            const information = $("<div>");

            information.append(
                $("<h3>").text(title)
            );

            information.append(
                $("<p>").text("Work ID: " + workID)
            );

            information.append(
                $("<p>").text("Authors: " + authors)
            );

            information.append(
                $("<h4>").text("Description")
            );

            information.append(
                $("<p>").text(description)
            );

            information.append(
                $("<h4>").text("Subjects")
            );

            if (subjects.length > 0) {

                const subjectList = $("<ul>");

                subjects.forEach(function (subject) {
                    subjectList.append(
                        $("<li>").text(subject)
                    );
                });

                information.append(subjectList);

            } else {

                information.append(
                    $("<p>").text("No subjects available.")
                );
            }

            information.append(
                $("<a>")
                    .addClass("open-library-link")
                    .attr("href", API_URL + bookKey)
                    .attr("target", "_blank")
                    .attr("rel", "noopener noreferrer")
                    .text("View on Open Library")
            );

            details.append(cover, information);

            $("#bookDetails").empty().append(details);
        })

        .fail(function () {

            $("#bookDetails").text(
                "Unable to load book details. Please try again."
            );
        });
    }

    // Load the predefined Fantasy collection
    function loadCollection() {

        $("#collectionStatus").text("Loading fantasy books...");

        $.ajax({
            url: API_URL + "/subjects/fantasy.json",
            method: "GET",
            dataType: "json",
            data: {
                limit: 10
            }
        })

        .done(function (data) {

            if (!data.works || data.works.length === 0) {

                $("#collectionStatus").text(
                    "No fantasy books are currently available."
                );

                return;
            }

            const books = data.works.slice(0, 10).map(function (book) {

                return {
                    title: book.title,
                    key: book.key,
                    cover_i: book.cover_id,
                    author_name: book.authors
                        ? book.authors.map(function (author) {
                            return author.name;
                        })
                        : []
                };
            });

            $("#collectionStatus")
                .text("Explore these fantasy books!")
                .addClass("success-message");

            displayBooks(books, "#collectionResults");
        })

        .fail(function () {

            $("#collectionStatus")
                .text("Unable to load the fantasy collection. Please try again.")
                .addClass("error-message");
        });
    }

    // Load the collection when the application opens
    loadCollection();

});
