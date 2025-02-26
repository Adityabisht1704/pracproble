document.addEventListener("DOMContentLoaded", function () {
    // Selecting DOM elements
    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const loginError = document.getElementById("login-error");
    const loginSection = document.getElementById("login-section");
    const quizSection = document.getElementById("quiz-section");
    const roundTitle = document.getElementById("round-title");
    const questionContainer = document.getElementById("question-container");
    const nextBtn = document.getElementById("next-btn");
    const timerDisplay = document.getElementById("time");
    const resultSection = document.getElementById("result-section");
    const scoreDisplay = document.getElementById("score-display");
    const admissionDisplay = document.getElementById("admission-display");

    let quizData = null;
    let currentRoundIndex = 0;
    let currentQuestionIndex = 0;
    let score = 0;
    let totalMarks = 0;
    let timer;
    let timeLeft = 0;
    let currentRoundMarks = 0;
    let currentRoundTotalQuestions = 0;

    // Email validation regex (supports vit.edu & vitstudent.ac.in domains)
    const vitEmailRegex = /^[a-zA-Z0-9._%+-]+@(vit\.[a-zA-Z]+|vitstudent\.ac\.in)$/;

    // Validate login email
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (!vitEmailRegex.test(email)) {
            loginError.textContent = "Please enter a valid VIT email address.";
            return;
        }

        // Hide login section and show quiz
        loginError.textContent = "";
        loginSection.style.display = "none";
        quizSection.style.display = "block";

        // Load quiz data
        loadQuizData();
    });

    // Load quiz data from XML file
    function loadQuizData() {
        fetch("bisht.xml")
            .then((response) => response.text())
            .then((data) => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data, "application/xml");
                quizData = xmlDoc.getElementsByTagName("round");

                // Calculate total marks from all rounds
                for (let i = 0; i < quizData.length; i++) {
                    totalMarks += parseInt(quizData[i].getAttribute("marks"));
                }

                // Start first round
                startRound();
            })
            .catch((error) => {
                console.error("Error loading quiz data:", error);
            });
    }

    // Start the current round
    function startRound() {
        if (currentRoundIndex >= quizData.length) {
            endQuiz();
            return;
        }

        const round = quizData[currentRoundIndex];
        roundTitle.textContent = round.getAttribute("title");

        // Get time (in minutes) and convert to seconds
        timeLeft = parseInt(round.getAttribute("time")) * 60;
        currentRoundMarks = parseInt(round.getAttribute("marks"));
        currentRoundTotalQuestions = round.getElementsByTagName("question").length;
        currentQuestionIndex = 0;

        startTimer();
        showQuestion();
    }

    // Start the timer for the round
    function startTimer() {
        clearInterval(timer);
        updateTimerDisplay();

        timer = setInterval(function () {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timer);
                nextRound();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
    }

    // Display the current question and its options
    function showQuestion() {
        const round = quizData[currentRoundIndex];
        const questions = round.getElementsByTagName("question");

        if (currentQuestionIndex >= questions.length) {
            nextRound();
            return;
        }

        const question = questions[currentQuestionIndex];
        const questionText = question.getElementsByTagName("text")[0].textContent;
        const options = question.getElementsByTagName("option");

        // Clear previous question
        questionContainer.innerHTML = "";

        // Create question element
        const qDiv = document.createElement("div");
        qDiv.className = "question";
        const qText = document.createElement("p");
        qText.textContent = questionText;
        qDiv.appendChild(qText);

        // Add options
        for (let i = 0; i < options.length; i++) {
            const label = document.createElement("label");
            label.className = "option";
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "option";
            radio.value = options[i].textContent.trim().charAt(0); // Extracts first letter (A/B/C/D)
            label.appendChild(radio);
            label.appendChild(document.createTextNode(" " + options[i].textContent));
            qDiv.appendChild(label);
        }

        questionContainer.appendChild(qDiv);
    }

    // Handle "Next" button click
    nextBtn.addEventListener("click", function () {
        const selectedOption = document.querySelector('input[name="option"]:checked');

        if (!selectedOption) {
            alert("Please select an option.");
            return;
        }

        const userAnswer = selectedOption.value;
        const round = quizData[currentRoundIndex];
        const questions = round.getElementsByTagName("question");
        const question = questions[currentQuestionIndex];
        const correctAnswer = question.getElementsByTagName("answer")[0].textContent.trim();

        // Compute marks for this question
        const markPerQuestion = currentRoundMarks / currentRoundTotalQuestions;
        if (userAnswer === correctAnswer) {
            score += markPerQuestion;
        }

        // Move to the next question
        currentQuestionIndex++;
        showQuestion();
    });

    // Proceed to the next round or finish the quiz
    function nextRound() {
        clearInterval(timer);
        currentRoundIndex++;

        if (currentRoundIndex < quizData.length) {
            startRound();
        } else {
            endQuiz();
        }
    }

    // End quiz, compute normalized score, and display admission result
    function endQuiz() {
        quizSection.style.display = "none";
        resultSection.style.display = "block";

        // Normalize score to a 10-point scale
        let normalizedScore = (score / totalMarks) * 10;
        normalizedScore = normalizedScore.toFixed(2);

        // Display score
        scoreDisplay.textContent = `Your Score: ${normalizedScore} out of 10`;

        // Determine admission status
        let admissionCampus = "";
        if (normalizedScore > 9.5) {
            admissionCampus = "Vellore Campus";
        } else if (normalizedScore > 7.5) {
            admissionCampus = "Chennai Campus";
        } else if (normalizedScore > 6.5) {
            admissionCampus = "Amravati Campus";
        } else {
            admissionCampus = "Not admitted";
        }

        admissionDisplay.textContent = `Admission Status: ${admissionCampus}`;
    }
});
