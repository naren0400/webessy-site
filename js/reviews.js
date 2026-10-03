/* ==========================================================================
   REVIEWS — the list the Reviews section is built from (js/sections.js).

   Real reviews only: a client's own words, with their name and their
   business. Never write one, and never change their words beyond a typo.
   Nothing shows on the site until it is in this list, so a review sent
   from the form ("New review from the website" in your inbox) goes up
   only once you have read it and copied it in here.

   While the list is empty, the section says "Be the first to write a
   review". With reviews in it, each becomes a glass card, in this order.

   Add each review between the square brackets at the bottom, like this
   (double quotes, so an apostrophe inside is fine; no quote marks around
   the review itself, the page adds them). Put a comma after each }.

     {
       name: "Their name",
       business: "Their business",
       review: "Their words.",
       photo: "images/reviews/their-name.webp",
       photoAlt: "What the photo shows, plainly"
     },

   business, photo and photoAlt can be left out. A photo is square,
   240 x 240 pixels, WebP, in images/reviews/. photoAlt describes it for
   people who can't see it.
   ========================================================================== */
window.WEBESSY_REVIEWS = [
];
