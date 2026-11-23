
/* =====================================
   OPEN LIBRARY - MILESTONE 4
   jQuery AJAX + Mustache.js
===================================== */

$(document).ready(function () {

    const API_URL = "https://openlibrary.org";
    const RESULTS_PER_PAGE = 10;
    const MAX_RESULTS = 50;
    const FANTASY_SUBJECT = "fantasy";

    // Application state
    let searchResults = [];
    let collectionBooks = [];
    let currentSearchTerm = "";
    let currentPage = 1;
    let totalPages = 1;
    let searchView = "grid";
    let collectionView = "grid";
    let collectionLoaded = false;
    let selectedWorkId = null;

    // Mustache templates
    const bookTemplate = $("#book-template").html();
    const detailsTemplate = $("#details-template").html();


    // =====================================
    // HELPER FUNCTIONS
    // =====================================

    function getWorkId(key) {
        if (!key) return "";

        const match = key.match(/\/works\/(OL\d+W)/);

        if (match) return match[1];

        return key.replace(/^\/works\//, "");
    }


    function getCoverUrl(coverId, size = "M") {
        if (!coverId) {
            return "https://placehold.co/180x260/f8e1e7/536947?text=No+Cover";
        }

        return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
    }


    function formatBook(book) {
        const workId = getWorkId(book.key);

        return {
            workId: workId,
            title: book.title || "Untitled Book",
            author: Array.isArray(book.author_name) && book.author_name.length
                ? book.author_name.join(", ")
                : "Author information unavailable",
            year: book.first_publish_year || "",
            coverUrl: getCoverUrl(book.cover_i)
        };
    }


    function showStatus(selector, message, type = "") {
        $(selector)
            .removeClass("error success")
            .addClass(type)
            .text(message);
    }


    function getCurrentView(section) {
        return section === "search" ? searchView : collectionView;
    }


    // =====================================
    // NAVIGATION BETWEEN SPA SECTIONS
    // =====================================

    function showSection(sectionId) {

        $(".page-section").removeClass("active-section");
        $("#" + sectionId).addClass("active-section");

        $(".nav-button").removeClass("active");
        $(`.nav-button[data-section="${sectionId}"]`).addClass("active");

        if (sectionId === "collection-section" && !collectionLoaded) {
            loadFantasyCollection();
        }
    }


    $(".nav-button").on("click", function () {
        const sectionId = $(this).data("section");
        showSection(sectionId);
    });


    // =====================================
    // SEARCH BOOKS
    // =====================================

    $("#search-form").on("submit", function (event) {

        event.preventDefault();

        const searchTerm = $("#search-input").val().trim();

        if (!searchTerm) {
            showStatus("#search-status", "Please enter a book title, author, or subject.", "error");
            return;
        }

        currentSearchTerm = searchTerm;
        currentPage = 1;
        searchResults = [];

        $("#search-results").empty();
        $("#pagination").addClass("hidden");
        $("#results-count").text("");

        showStatus("#search-status", "Searching for books...");

        searchBooks(searchTerm);
    });


    function searchBooks(searchTerm) {

        $.ajax({
            url: API_URL + "/search.json",
            method: "GET",
            data: {
                q: searchTerm,
                limit: MAX_RESULTS,
                fields: "key,title,author_name,cover_i,first_publish_year"
            },
            dataType: "json",

            success: function (data) {

                searchResults = (data.docs || [])
                    .filter(book => book.key && book.key.includes("/works/"))
                    .slice(0, MAX_RESULTS)
                    .map(formatBook);

                if (searchResults.length === 0) {
                    showStatus("#search-status", "No books found. Try a different search.", "error");
                    $("#search-results").empty();
                    $("#results-count").text("");
                    $("#pagination").addClass("hidden");
                    return;
                }

                totalPages = Math.ceil(searchResults.length / RESULTS_PER_PAGE);

                showStatus(
                    "#search-status",
                    `Found ${searchResults.length} books for "${searchTerm}".`,
                    "success"
                );

                $("#results-count").text(
                    `${searchResults.length} books found`
                );

                renderSearchResults();

            },

            error: function () {
                showStatus(
                    "#search-status",
                    "Something went wrong while searching. Please try again.",
                    "error"
                );

                $("#search-results").empty();
                $("#pagination").addClass("hidden");
            }
        });
    }


    // =====================================
    // RENDER SEARCH RESULTS WITH MUSTACHE
    // =====================================

    function renderSearchResults() {

        const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;

        const pageBooks = searchResults.slice(
            startIndex,
            startIndex + RESULTS_PER_PAGE
        );

        const html = Mustache.render(bookTemplate, {
            books: pageBooks
        });

        $("#search-results")
            .removeClass("grid-view list-view")
            .addClass(searchView + "-view")
            .html(html);

        updatePagination();
    }


    // =====================================
    // PAGINATION
    // =====================================

    function updatePagination() {

        $("#page-indicator").text(
            `Page ${currentPage} of ${totalPages}`
        );

        $("#previous-button").prop(
            "disabled",
            currentPage === 1
        );

        $("#next-button").prop(
            "disabled",
            currentPage === totalPages
        );

        if (totalPages > 1) {
            $("#pagination").removeClass("hidden");
        } else {
            $("#pagination").addClass("hidden");
        }
    }


    $("#previous-button").on("click", function () {

        if (currentPage > 1) {
            currentPage--;
            renderSearchResults();
        }

    });


    $("#next-button").on("click", function () {

        if (currentPage < totalPages) {
            currentPage++;
            renderSearchResults();
        }

    });


    // =====================================
    // GRID AND LIST VIEW SWITCHING
    // =====================================

    $(".view-button").on("click", function () {

        const view = $(this).data("view");
        const target = $(this).data("target");

        $(`.view-button[data-target="${target}"]`)
            .removeClass("active");

        $(this).addClass("active");

        if (target === "search") {

            searchView = view;

            $("#search-results")
                .removeClass("grid-view list-view")
                .addClass(view + "-view");

        } else if (target === "collection") {

            collectionView = view;

            $("#collection-results")
                .removeClass("grid-view list-view")
                .addClass(view + "-view");

        }

    });


    // =====================================
    // LOAD FANTASY COLLECTION
    // =====================================

    function loadFantasyCollection() {

        collectionLoaded = true;

        showStatus(
            "#collection-status",
            "Loading your Fantasy Shelf..."
        );

        $.ajax({
            url: API_URL + "/subjects/" + FANTASY_SUBJECT + ".json",
            method: "GET",
            data: {
                limit: 10
            },
            dataType: "json",

            success: function (data) {

                collectionBooks = (data.works || [])
                    .filter(book => book.key)
                    .slice(0, 10)
                    .map(function (book) {

                        return {
                            key: book.key,
                            title: book.title,
                            author_name: book.authors
                                ? book.authors.map(author => author.name)
                                : [],
                            cover_i: book.cover_id,
                            first_publish_year: book.first_publish_year
                        };

                    })
                    .map(formatBook);

                renderCollection();

                if (collectionBooks.length === 0) {
                    showStatus(
                        "#collection-status",
                        "No books were found in this collection.",
                        "error"
                    );
                } else {
                    showStatus(
                        "#collection-status",
                        "Your Fantasy Shelf is ready!",
                        "success"
                    );
                }

            },

            error: function () {

                collectionLoaded = false;

                showStatus(
                    "#collection-status",
                    "Unable to load the Fantasy Shelf. Please try again.",
                    "error"
                );

            }
        });

    }


    // =====================================
    // RENDER COLLECTION WITH MUSTACHE
    // =====================================

    function renderCollection() {

        const html = Mustache.render(bookTemplate, {
            books: collectionBooks
        });

        $("#collection-results")
            .removeClass("grid-view list-view")
            .addClass(collectionView + "-view")
            .html(html);

        $("#collection-count").text(
            `${collectionBooks.length} books in your collection`
        );

    }


    // =====================================
    // SELECT BOOK AND LOAD DETAILS
    // =====================================

    $(document).on("click", ".details-button", function () {

        const workId = $(this).attr("data-work-id");

        if (workId) {
            loadBookDetails(workId);
        }

    });


    async function loadBookDetails(workId) {

        selectedWorkId = workId;

        showSection("details-section");

        $("#book-details").html(`
            <div class="empty-details">
                <span>📚</span>
                <h3>Loading Book Details...</h3>
                <p>Please wait while we find more information.</p>
            </div>
        `);

        try {

            // Retrieve the selected book's work information
            const work = await $.ajax({
                url: API_URL + "/works/" + encodeURIComponent(workId) + ".json",
                method: "GET",
                dataType: "json"
            });

            // Retrieve author names when available
            let authorNames = [];

            if (Array.isArray(work.authors) && work.authors.length > 0) {

                const authorRequests = work.authors
                    .slice(0, 10)
                    .map(function (author) {

                        const authorKey = author.author?.key;

                        if (!authorKey) {
                            return Promise.resolve(null);
                        }

                        return $.ajax({
                            url: API_URL + authorKey + ".json",
                            method: "GET",
                            dataType: "json"
                        }).catch(function () {
                            return null;
                        });

                    });

                const authorData = await Promise.all(authorRequests);

                authorNames = authorData
                    .filter(author => author && author.name)
                    .map(author => author.name);
            }

            // Format description whether it is text or an object
            let description = work.description || "";

            if (typeof description === "object") {
                description = description.value || "";
            }

            if (typeof description !== "string" || !description.trim()) {
                description = "A description for this book is not currently available.";
            }

            // Retrieve subjects
            const subjects = Array.isArray(work.subjects)
                ? work.subjects.slice(0, 10)
                : [];

            // Retrieve language metadata when available
            const languages = Array.isArray(work.languages)
                ? work.languages
                    .slice(0, 5)
                    .map(language => {
                        const key = language.key || "";
                        return key.split("/").pop();
                    })
                    .filter(Boolean)
                    .join(", ")
                : "";

            // Prepare the book details object
            const details = {

                title: work.title || "Untitled Book",

                workId: workId,

                author: authorNames.length
                    ? authorNames.join(", ")
                    : "Author information unavailable",

                coverUrl: getCoverUrl(
                    work.covers && work.covers.length
                        ? work.covers[0]
                        : null,
                    "L"
                ),

                description: description,

                subjects: subjects,

                firstPublishYear: work.first_publish_date || "",

                publishDate: work.first_publish_date || "",

                languages: languages,

                recordUrl: "https://openlibrary.org/works/" +
                    encodeURIComponent(workId)

            };

            // Do not overwrite a newer selection if the user
            // selected another book while this request was running.
            if (selectedWorkId !== workId) {
                return;
            }

            // Render details using Mustache
            const html = Mustache.render(detailsTemplate, details);

            $("#book-details").html(html);

        } catch (error) {

            if (selectedWorkId !== workId) {
                return;
            }

            $("#book-details").html(`
                <div class="empty-details">
                    <span>📖</span>
                    <h3>Unable to Load Book Details</h3>
                    <p>Please try selecting this book again.</p>
                </div>
            `);

        }

    }


    // =====================================
    // INITIAL APPLICATION STATE
    // =====================================

    showSection("search-section");

    console.log("Open Library Milestone 4 is ready!");

});
