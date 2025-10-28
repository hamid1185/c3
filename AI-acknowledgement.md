# @doba0032

## I acknowledge the use of Claude AI in generating content included in this submission (Anthropic, 2025). The prompts and output from Claude AI are included in the file below.

## Prompt 1:

Functionality requested by the user as an administrator dashboard, where clicking an "Edit" button would turn the text (such as "Conceptual Art.) into an input field to edit and clicking the button again would save the modifications and show a success message. The user was in particular demand of basic human-written JavaScript code, which would resemble beginner-level programming, it would not appear as an AI-generated code.

## AI Output 1:

Line no: 104 - 141

// edit art category function
function editStuff() {
var buttons = document.getElementsByTagName('button');
var i;

    for (i = 0; i < buttons.length; i++) {
        if (buttons[i].innerText == 'Edit') {
            buttons[i].onclick = function() {
                var parentDiv = this.parentElement.parentElement;
                var textArea = parentDiv.firstElementChild;
                var text = textArea.textContent;

                if (this.innerText == 'Edit') {
                    // make input box
                    var inputBox = document.createElement('input');
                    inputBox.value = text;
                    inputBox.style.width = '150px';
                    inputBox.style.height = '25px';
                    inputBox.style.border = '1px solid gray';
                    inputBox.style.padding = '3px';

                    textArea.innerHTML = '';
                    textArea.appendChild(inputBox);

                    this.innerText = 'Save';
                }
                else if (this.innerText == 'Save') {
                    // save the changes
                    var input = textArea.getElementsByTagName('input')[0];
                    var newText = input.value;

                    textArea.innerHTML = newText;
                    this.innerText = 'Edit';

                    alert('successfully edited');
                }
            }
        }
    }

}

// run when page loads
window.onload = function() {
editStuff();
}

## My Interpretation:

I used AI to help create a simple JavaScript function for editing art categories in my admin dashboard. The AI provided basic code that I understood and integrated into my project. The code creates input fields when clicking edit buttons and saves changes with an alert message.

---

## Prompt 2:

can you make my code in stucture format only (HTML code and CSS)

## AI Output 2:

This would include any file structure recommendations, folder organization, or code formatting suggestions I provided to help organize your project files in a structured format

## prompt 3:

Can you make this contact Us page code in structure format and suggest me comments for this code?

## AI output 3:

Contact_Us.html file/ line 1-272

## prompt 4:

This is my code of artist.html can you please make it in corrct structure format, spacing and comments

## AI output 4:

artist.html file / line 1 - 454

## prompt 4:

(provide my code) any thing you need to change in my code please provide me in structure format and provide me some comments

## output 4:

auth.js line 10-95

## prompt 5:

(provide my code) any thing you need to change in my code please provide me in structure format and provide me some comments(my privious code was not working)

## output 5:

admin.js line 1-381

# @wagl0016

## I acknowledge the use of Claude AI in generating content included in this submission (Anthropic, 2025). The prompts and output from Claude AI are included in the file below.

## Prompt 1:

There’s a button with “View More” on the website, and on click it reveals three hidden cards at a time; clicking again reveals the next three.and when everything is shown the button get disabled and the text changed to “All items shown.” As I am a beginner, I want to know how this functionality is possible in JavaScript. Can you help me with simple JavaScript code?

## AI Output 2:

Line no: 1-58

    document.addEventListener('DOMContentLoaded', () => {
    const BTN_SELECTOR = '.ViewMore_Button';
    const GRID_SELECTOR = '.grid';
    const HIDDEN_CARD_SELECTOR = '.Card.hidden';
    const BATCH_SIZE = 3;

    const btn = document.querySelector(BTN_SELECTOR);
    const grid = document.querySelector(GRID_SELECTOR);


    function remainingHiddenCount() {
    return grid.querySelectorAll(HIDDEN_CARD_SELECTOR).length;
    }

    function updateButton() {
        const remaining = remainingHiddenCount();
        if (remaining === 0) {
        btn.textContent = 'All items shown';
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
        btn.style.opacity = '0.6';
        btn.style.cursor = 'default';
        } else {
        btn.textContent = `View More`;
        btn.disabled = false;
        btn.removeAttribute('aria-disabled');
        btn.style.opacity = '';
        btn.style.cursor = '';
        }
    }

    function revealNextBatch() {
        const hiddenCards = Array.from(grid.querySelectorAll(HIDDEN_CARD_SELECTOR));
        const toReveal = hiddenCards.slice(0, BATCH_SIZE);

        if (toReveal.length === 0) {
        updateButton();
        return;
        }

        toReveal.forEach(card => card.classList.remove('hidden'));
        updateButton();
    }


    updateButton();


    btn.addEventListener('click', revealNextBatch);


    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        revealNextBatch();
        }
    });

});

## My Interpretation:

I used AI to help create a simple JavaScript function for view more button to reveal hidden card in my Art collection page.The AI provided basic code that I understood and integrated into my project. I try to changed the function and constant names and little bit of the reveal logic.

## Prompt 2:

There’s was also pagination at last but it was not link to View More on the website, and on click it was changing to next page As I am a beginner, I want to know how this functionality is possible in JavaScript. Can you help me with simple JavaScript code?

## AI Output 2

line: 1-43

        document.addEventListener('DOMContentLoaded', () => {
        const pagination = document.querySelector('.Pagination');
        if (!pagination) return;

        const buttons = Array.from(pagination.querySelectorAll('button'));
        const numBtns = buttons.filter(b => /^\d+$/.test(b.textContent.trim()));
        const prevBtn = buttons.find(b => b.textContent.trim() === '<');
        const nextBtn = buttons.find(b => b.textContent.trim() === '>');

        let currentIndex = numBtns.findIndex(b => b.classList.contains('active'));
        if (currentIndex < 0) currentIndex = 0;

        function markActive(i) {
        if (i < 0 || i >= numBtns.length) return;
        numBtns.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
        b.tabIndex = -1;
        });
        numBtns[i].classList.add('active');
        numBtns[i].setAttribute('aria-current', 'page');
        numBtns[i].tabIndex = 0;
        currentIndex = i;
        }

        function navigateToPageByIndex(i) {
        if (i < 0 || i >= numBtns.length) return;
        const pageNum = parseInt(numBtns[i].textContent.trim(), 10);
        const url = new URL(window.location.href);
        url.searchParams.set('page', pageNum);
        window.location.href = url.toString(); // go to the same path with ?page=<n>
        }

        // number clicks -> go to that page
        numBtns.forEach((b, i) => {
        b.addEventListener('click', () => navigateToPageByIndex(i));
        });

        // arrows -> go to previous/next page indices (if within range)
        prevBtn?.addEventListener('click', () => navigateToPageByIndex(currentIndex - 1));
        nextBtn?.addEventListener('click', () => navigateToPageByIndex(currentIndex + 1));

        // initial active mark (purely visual before navigation)
        markActive(currentIndex);
        });

## My Interpretation:

I used AI to help create a simple JavaScript function for pagination in my Art collection page.The AI provided basic code that I understood and integrated into my project.It give me code so that on click it goes to next page. I try to modified by changing function and constant names.Also removed and added new code to getfeature as per my need.

## prompt 3:

hi, i have code for my home page can you correct its structure without changing my code. just correct format not my code.

## AI output 3:

Home-Page.html / line 1-129

## My Interpretation:

I used AI to just correct the structure and format of code.

## prompt 4:

hi, can you please correct the structure of my php code without changing my code. just correct format not my code.

## AI output 4:

edit_submission.php / line 1-261

## My Interpretation:

I used AI to just correct the structure and format of code.

## prompt 5:

hi, can you please correct the structure of my php code without changing my code. just correct format not my code.

## AI output 5:

artworks_submission.php / line 1-87

## My Interpretation:

I used AI to just correct the structure and format of code.

# @shaf0084

## I acknowledge the use of ChatGPT in generating content included in this submission (Anthropic, 2025). The prompts and output from ChatGPT AI are included in the file below.

## Prompt :

“can you help me add basic JavaScript functionality to my form, including draft saving and validation?”

## AI Output:

The AI generated JavaScript code that saves form data to localStorage as a draft, loads it back when reopening the page, validates the Title field, adds a character counter for the Description, and shows simple status messages.

## My Interpretation:

I used AI to guide me in adding interactivity to my HTML form. The AI provided sample JavaScript which I studied and customized for my project. The code was adapted and integrated into my existing HTML so that I could learn the logic while making it functional.

## Prompt:

“can you make my code in structure format only (HTML code and CSS)”

## AI Output:

The AI gave me a structured version of my HTML and CSS, including proper indentation, semantic HTML5 elements, and consistent formatting for styles. It also suggested where to place files (HTML, CSS, JS) in a project folder to stay organized.

## My Interpretation:

I used AI mainly for formatting support. It helped me structure my code and separate HTML, CSS, and JavaScript files more clearly so it looks professional and readable.

## I acknowledge the use of ChatGPT in generating content included in this submission (Anthropic, 2025). The prompts and output from ChatGPT AI are included in the file below.

## Prompt :

“can you help me to remove errors from my code called config.php and structure and comments?”

## AI Output:

Config.php // 1-97 lines

=======

# @chow0250

##I acknowledge the use of Chatgpt in generating content included in this submission (OpenAI, 2025). The prompts and output from Chatgpt are included in the file below.

I reviewed and modified the outputs before integrating them into my final work.

## Prompt 1 (HTML structure)

My prompt to ChatGPT:

“Can you create a semantic HTML structure for an Art Details page? It should have:
a header with navigation and search
a main section with artwork info on the left and an image on the right
a Similar Collection grid with 3 cards and a View More button
a footer with brand, links, and contact info.
Keep it clean and simple for a beginner, no JavaScript yet.”

## AI Output 1 (Code)

<header>
  <div class="topbar">
    <div class="logo">LOGO</div>
    <nav>
      <a href="#">Home</a>
      <a href="#">Art</a>
      <a href="#">About</a>
    </nav>
    <div class="search">
      <input type="text" placeholder="Search" />
      <button>Search</button>
    </div>
  </div>
</header>

<main class="container">
  <section class="art-details">
    <div class="info">
      <h1>Sample Artwork</h1>
      <p><b>Type:</b> Painting</p>
      <p><b>Artist Name:</b> Example Artist</p>
    </div>
    <div class="art-image">
      <img src="placeholder.jpg" alt="Art" />
    </div>
  </section>

  <h2 class="section-title">Similar Collection</h2>
  <section class="similar">
    <div class="collection">
      <div class="card">
        <div class="thumb">Art</div>
        <div class="meta-line long"></div>
        <div class="meta-line short"></div>
      </div>
      <div class="card">
        <div class="thumb">Art</div>
        <div class="meta-line long"></div>
        <div class="meta-line short"></div>
      </div>
      <div class="card">
        <div class="thumb">Art</div>
        <div class="meta-line long"></div>
        <div class="meta-line short"></div>
      </div>
    </div>
    <div class="view-more-wrap">
      <button class="view-more">View More ▾</button>
    </div>
  </section>
</main>

<footer id="footer">
  <div class="footer-container">
    <div class="brand">
      <h2>Art Website</h2>
      <p>Email: <a href="mailto:art@example.com">art@example.com</a></p>
    </div>
    <div class="links">
      <h3>Quick Links</h3>
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </div>
    <div class="footer-content">
      <h3>Contact Us</h3>
      <p>Phone: +61 000 000 000</p>
    </div>
  </div>
</footer>

My Final Version (Changes I Made)

Changed the artwork title/content to: “Bush Yam – My Country” by Janet Golder Kngwarreye.
Expanded details with Description and Condition Note fields.
Updated image reference to Jap-024384-Janet.jpg.
Footer: updated brand to “Indigenous Art Atlas”, added proper email and real social media icons.
Navigation: added “Usage Guidelines”, “Sign/Signup”.
Kept the “Similar Collection” cards but ensured styling matches our theme.

## Prompt 2 (CSS styling)

My prompt to ChatGPT:

“Can you give me simple CSS for this Art Details page?
Black text, white background.
Header/nav aligned with spacing.
Two-column layout for art details (info + image).
Cards in a 3-column grid with hover lift.
Responsive footer with 3 columns stacking on small screens.
Keep it beginner-friendly, no frameworks.”

AI Output 2 (Code)

        body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: black;
        background: white;
        }

        header {
        background: #ffffff;
        border-bottom: 1px solid #e7e7e7;
        }

        .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        }

        nav a {
        color: black;
        text-decoration: none;
        margin-left: 18px;
        font-weight: 600;
        }

        .art-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 28px;
        margin-top: 20px;
        }

        .art-image {
        border: 1px solid #ddd;
        border-radius: 10px;
        background: #f1f1f1;
        min-height: 300px;
        }

        .collection {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        }

        .card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 12px;
        padding: 14px;
        transition: transform 0.2s ease;
        }

        .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }

        .footer-container {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 40px;
        padding: 40px;
        background: black;
        color: white;
        }

        @media (max-width: 768px) {
        .footer-container {
            grid-template-columns: 1fr;
            text-align: center;
        }
        }

My Final Version (Changes I Made)

Increased .info h1 size to 32px and adjusted margins for balance.
Adjusted .art-details grid ratio to 1.05fr 1fr (info slightly wider).
Added .search styles (rounded input + button).
Added .view-more button style (black background, white text).
Extended footer styles with .Social-Media, .list, .bottom-bar.
Added hover states with softer grey backgrounds for links.
Kept media query for responsiveness but tweaked padding and text-align.

Reference
OpenAI. (2025). ChatGPT (September 2025 version) [Large language model]. https://chat.openai.com/chat

## prompt 3:

Code i provided. Provide me the code in structure format and make some comments improve the code

## AI output 3:

auth.php / line 1-202

## prompt 4:

Code i provided. Provide me the code in structure format and make some comments to improve the code and provide me any other changes needed?

## AI output 4:

profile.php / line 1-73

# shao0093

## I acknowledge the use of Chatgpt in generating content included in this submission (OpenAI, 2025). The prompts and output from Chatgpt are included in the file below.

I reviewed and modified the outputs before integrating them into my final work.

# prompt 1

Can you make my code into structure format only

# Output 1

Home-Page.html

Line 195- 238

# prompt 2

provide code to chatgpt and tell me what is error and then make it in structure format

# output 2

artist.php / line 9 - 108

# prompt 3

(added code my old map.js) ask chatGPT what i need to update for this files 

# output 3

map.js
Line - 1 - 37
