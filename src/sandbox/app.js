function renderBook(bookData) {
  const card = document.createElement("article");
  card.className = "book-card";

  const title = document.createElement("h2");
  title.className = "book-title";
  title.textContent = bookData.title;

  const author = document.createElement("p");
  author.className = "book-author";
  author.textContent = bookData.author;

  card.append(title, author);

  return card;
}

const book = {
  title: "The",
  author: "J. R. R. Tolkien"
};

const bookList = document.querySelector("#book-list");

const renderedBook = renderBook(book);

bookList.append(renderedBook);
