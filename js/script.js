/**
 * TikTok Rewards - Script Unificado (Quiz + VSL)
 * 
 * Este script gerencia a interatividade da aplicação de pesquisas remuneradas,
 * incluindo navegação entre páginas, sistema de perguntas, animações de saldo,
 * popups de recompensa, efeito de confete e transição para VSL.
 */

// ==================== CONFIGURAÇÃO INICIAL ====================

const COIN_TO_NGN_RATE = 1550; // 1 COIN = ₦1,550

function coinsToNaira(coins) {
    return Math.round(coins * COIN_TO_NGN_RATE);
}

function formatNaira(coins, prefix = '') {
    return `${prefix}₦${coinsToNaira(coins).toLocaleString('en-NG')}`;
}

function updateNairaDisplay(element, coins, prefix = '') {
    if (element) element.textContent = formatNaira(coins, prefix);
}

const surveyData = {
    initialBalance: 17,
    currentBalance: 17,
    currentQuestionIndex: 0,
    isAnswering: false,
    questions: [
        {
            text: "Would you follow this creator?",
            mediaType: "image",
            mediaSrc: "TIK/IMG_7603-Edit-768x1023-1.jpg",
            reward: 25
        },
        {
            text: "Do you like this creator's content style?",
            mediaType: "image",
            mediaSrc: "TIK/PS-X-Pulse-2-scaled.jpg",
            reward: 37
        },
        {
            text: "Would you watch more videos from this creator?",
            mediaType: "image",
            mediaSrc: "TIK/biography-1277-softmadeit-09012024.jpg",
            reward: 33
        },
        {
            text: "Is this creator worth supporting with roses?",
            mediaType: "image",
            mediaSrc: "TIK/biography-1547-celynukam-biography--25072024.jpg",
            reward: 48
        },
        {
            text: "Would you recommend this creator to your friends?",
            mediaType: "image",
            mediaSrc: "TIK/c94b0163628e3853.jpeg",
            reward: 53
        }
    ]
};

// ==================== SELETORES DOM ====================

const quizSection = document.getElementById('quizSection');
const vslSection = document.getElementById('vslSection');

const welcomePage = document.getElementById('welcomePage');
const surveyPage = document.getElementById('surveyPage');
const completionPage = document.getElementById('completionPage');

const balanceElement = document.getElementById('balance');
const balanceIndicator = document.getElementById('balanceIndicator');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const questionReward = document.getElementById('questionReward');
const finalBalance = document.getElementById('finalBalance');

const questionText = document.getElementById('questionText');
const mediaInner = document.getElementById('mediaInner');
const btnNo = document.getElementById('btnNo');
const btnYes = document.getElementById('btnYes');

const rewardPopup = document.getElementById('rewardPopup');
const rewardAmount = document.getElementById('rewardAmount');
const overlay = document.getElementById('overlay');

const startButton = document.getElementById('startButton');
const withdrawButton = document.getElementById('withdrawButton');

const withdrawalFormPage = document.getElementById('withdrawalFormPage');
const withdrawalPage = document.getElementById('withdrawalPage');
const withdrawalForm = document.getElementById('withdrawalForm');
const withdrawalFormBalance = document.getElementById('withdrawalFormBalance');
const withdrawalProgressBar = document.getElementById('withdrawalProgressBar');
const withdrawalProgressText = document.getElementById('withdrawalProgressText');
const withdrawalPending = document.getElementById('withdrawalPending');
const formError = document.getElementById('formError');

const currentYearElement = document.getElementById('currentYear');

let withdrawalData = { name: '', phone: '', bank: '', account: '' };

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    currentYearElement.textContent = new Date().getFullYear();
    startButton.addEventListener('click', startSurvey);
    withdrawButton.addEventListener('click', showWithdrawalForm);
    btnNo.addEventListener('click', () => submitAnswer(false));
    btnYes.addEventListener('click', () => submitAnswer(true));

    withdrawalForm.addEventListener('submit', handleWithdrawalSubmit);

    // Only allow numbers in account fields
    ['wdAccount', 'wdAccountConfirm'].forEach(id => {
        document.getElementById(id).addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '');
        });
    });
});

// ==================== SIMULAÇÃO DE SAQUE ====================

function showWithdrawalForm() {
    fadeOut(completionPage, () => {
        updateNairaDisplay(withdrawalFormBalance, surveyData.currentBalance);
        fadeIn(withdrawalFormPage);
    });
}

function handleWithdrawalSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('wdFullName').value.trim();
    const phone = document.getElementById('wdPhone').value.trim();
    const bank = document.getElementById('wdBank').value;
    const account = document.getElementById('wdAccount').value.trim();
    const accountConfirm = document.getElementById('wdAccountConfirm').value.trim();

    // Reset error states
    formError.classList.add('hidden');
    document.getElementById('wdAccount').classList.remove('input-error');
    document.getElementById('wdAccountConfirm').classList.remove('input-error');

    // Validate account match
    if (account !== accountConfirm) {
        formError.textContent = 'Account numbers do not match. Please try again.';
        formError.classList.remove('hidden');
        document.getElementById('wdAccount').classList.add('input-error');
        document.getElementById('wdAccountConfirm').classList.add('input-error');
        return;
    }

    // Validate account length
    if (account.length < 10) {
        formError.textContent = 'Account number must be 10 digits.';
        formError.classList.remove('hidden');
        document.getElementById('wdAccount').classList.add('input-error');
        return;
    }

    withdrawalData = { name, phone, bank, account };
    showWithdrawalProcessing();
}

function showWithdrawalProcessing() {
    const maskedAccount = '******' + withdrawalData.account.slice(-4);
    const firstName = withdrawalData.name.split(' ')[0];
    const coins = surveyData.currentBalance;

    document.getElementById('receiptName').textContent = withdrawalData.name;
    document.getElementById('receiptBank').textContent = withdrawalData.bank;
    document.getElementById('receiptAccount').textContent = maskedAccount;
    document.getElementById('receiptAmount').textContent = formatNaira(coins);
    document.getElementById('payoutCoins').textContent = '0';
    document.getElementById('payoutNaira').textContent = '₦0';

    document.getElementById('payoutFeed').innerHTML =
        '<div class="tiktok-payout-feed-item">Connecting to TikTok Rewards...</div>';

    document.getElementById('wStep1Name').textContent = 'Syncing ' + firstName + "'s TikTok Rewards";
    document.getElementById('wStep2Name').textContent = 'Counting ' + coins + ' coins from quiz activity';
    document.getElementById('wStep3Name').textContent = 'Converting ' + coins + ' coins → ' + formatNaira(coins);
    document.getElementById('wStep4Name').textContent = 'Sending ' + formatNaira(coins) + ' to ' + withdrawalData.bank;

    ['wStep1', 'wStep2', 'wStep3', 'wStep4'].forEach(id => {
        const el = document.getElementById(id);
        el.classList.remove('active', 'completed');
        el.querySelector('.withdrawal-step-status').textContent = 'Waiting...';
    });

    withdrawalPending.classList.add('hidden');
    withdrawalProgressBar.style.width = '0%';
    withdrawalProgressText.textContent = '0%';

    fadeOut(withdrawalFormPage, () => {
        fadeIn(withdrawalPage);
        runWithdrawalSimulation();
    });
}

function addPayoutFeedMessage(text) {
    const feed = document.getElementById('payoutFeed');
    const item = document.createElement('div');
    item.className = 'tiktok-payout-feed-item';
    item.textContent = text;
    feed.insertBefore(item, feed.firstChild);
    while (feed.children.length > 4) {
        feed.removeChild(feed.lastChild);
    }
}

function animatePayoutCounter(targetCoins, duration) {
    const coinsEl = document.getElementById('payoutCoins');
    const nairaEl = document.getElementById('payoutNaira');
    const start = Date.now();

    const tick = setInterval(() => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const currentCoins = Math.round(targetCoins * progress);
        coinsEl.textContent = currentCoins.toLocaleString('en-NG');
        nairaEl.textContent = formatNaira(currentCoins);
        if (progress >= 1) clearInterval(tick);
    }, 40);
}

function runWithdrawalSimulation() {
    const coins = surveyData.currentBalance;
    const firstName = withdrawalData.name.split(' ')[0];

    const steps = [
        {
            id: 'wStep1',
            duration: 2200,
            statusActive: 'Connecting to TikTok...',
            statusDone: 'TikTok Rewards linked',
            feed: 'TikTok Rewards account verified for ' + firstName,
            onStart: null
        },
        {
            id: 'wStep2',
            duration: 2400,
            statusActive: 'Counting coins...',
            statusDone: coins + ' coins confirmed',
            feed: coins + ' coins collected from creator quiz',
            onStart: () => animatePayoutCounter(coins, 2000)
        },
        {
            id: 'wStep3',
            duration: 2800,
            statusActive: 'Converting to Naira...',
            statusDone: formatNaira(coins) + ' ready',
            feed: 'Exchange rate applied: 1 coin = ₦1,550',
            onStart: null
        },
        {
            id: 'wStep4',
            duration: 2500,
            statusActive: 'Sending to bank...',
            statusDone: 'Payout queued',
            feed: 'Transfer initiated to ' + withdrawalData.bank,
            onStart: null
        }
    ];

    const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;

    function processStep(index) {
        if (index >= steps.length) {
            withdrawalProgressBar.style.width = '100%';
            withdrawalProgressText.textContent = '100%';

            // Show pending message with button
            setTimeout(() => {
                withdrawalPending.classList.remove('hidden');
                addPayoutFeedMessage('Payout on hold — complete verification to unlock');
                document.getElementById('watchVideoBtn').addEventListener('click', showVSL);
            }, 400);
            return;
        }

        const step = steps[index];
        const stepEl = document.getElementById(step.id);
        const statusEl = stepEl.querySelector('.withdrawal-step-status');

        stepEl.classList.add('active');
        statusEl.textContent = step.statusActive;
        if (step.feed) addPayoutFeedMessage(step.feed);
        if (step.onStart) step.onStart();

        const startElapsed = elapsed;
        const stepStart = Date.now();
        const progressInterval = setInterval(() => {
            const stepElapsed = Date.now() - stepStart;
            const currentTotal = startElapsed + Math.min(stepElapsed, step.duration);
            const pct = Math.round((currentTotal / totalDuration) * 100);
            withdrawalProgressBar.style.width = pct + '%';
            withdrawalProgressText.textContent = pct + '%';

            if (stepElapsed >= step.duration) {
                clearInterval(progressInterval);
            }
        }, 50);

        setTimeout(() => {
            elapsed += step.duration;
            stepEl.classList.remove('active');
            stepEl.classList.add('completed');
            statusEl.textContent = step.statusDone;

            processStep(index + 1);
        }, step.duration);
    }

    processStep(0);
}

function showVSL() {
    fadeOut(quizSection, () => {
        fadeIn(vslSection);
        updateBalanceDisplay(surveyData.currentBalance, false);
        loadVSLPlayer();
        loadFakeComments();
    });
}

// ==================== FACEBOOK COMMENTS SIMULATION ====================

const LIKE_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#FE2C55"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

const initialComments = [
    { name: 'Chioma Okafor', text: 'I just received my payment today!! Thank you so much, this is real 🙏', time: '2 min ago', likes: 24, img: 'imagens/615476926_2129489404548030_2126219030693978855_n.jpg' },
    { name: 'Emeka Nwosu', text: 'I was skeptical at first but after watching the video I got my money within 24 hours. God is good!', time: '5 min ago', likes: 18, img: 'imagens/51596745_10217669144296586_7676079097461604352_n.jpg' },
    { name: 'Aisha Bello', text: 'My sister told me about this and I didn\'t believe her. Now I\'m telling everyone too 😂💰', time: '8 min ago', likes: 31, img: 'imagens/411501019_3328888610743598_255394871081213996_n.jpg' },
    { name: 'Tunde Adeyemi', text: 'Alert just entered!! 🔔🔔 This is legit, make sure you watch the full video', time: '12 min ago', likes: 42, img: 'imagens/142736346_3760558347355148_77726020631224977_n.jpg' },
    { name: 'Blessing Eze', text: 'I received mine through GTBank. Watch the video carefully they explain everything', time: '15 min ago', likes: 15, img: 'imagens/600982890_122108253849137815_7018535041402184155_n.jpg' },
    { name: 'Oluwaseun Bakare', text: 'Second time doing this survey and second time receiving payment. No scam at all ✅', time: '18 min ago', likes: 27, img: 'imagens/578277050_4316014812052971_516386648091913289_n.jpg' },
    { name: 'Fatima Abdullahi', text: 'My husband didn\'t believe me until he saw the alert on my phone 😂', time: '22 min ago', likes: 36, img: 'imagens/494907600_1047935570533596_5029612415979938840_n.jpg' },
    { name: 'Chinedu Obi', text: 'The video is very important, don\'t skip it if you want to receive your money fast', time: '25 min ago', likes: 19, img: 'imagens/421824917_1097267101421800_8359154587489251973_n.jpg' },
    { name: 'Ngozi Amadi', text: 'Just got credited through my OPay! This is amazing 🎉', time: '30 min ago', likes: 22, img: 'imagens/464791006_8416946245027554_8107442405029223201_n.jpg' },
    { name: 'Ibrahim Musa', text: 'I have shared this to all my WhatsApp groups. Everyone deserves to know about this!', time: '35 min ago', likes: 14, img: 'imagens/633993549_122096280315276322_2877511502228987702_n.jpg' },
    { name: 'Adaeze Nnamdi', text: 'Received through Access Bank. Thank you TikTok 🙌', time: '40 min ago', likes: 33, img: 'imagens/595805277_1544190056906827_3147097758608145524_n.jpg' },
    { name: 'Yusuf Garba', text: 'I was afraid it was 419 but my friend showed me his own alert. Now I don believe am 😅', time: '45 min ago', likes: 28, img: 'imagens/419734167_7456856780992290_1838991367503062927_n.jpg' },
    { name: 'Funke Adeola', text: 'Watched the video and followed the steps. Money came the next day!', time: '50 min ago', likes: 16, img: 'imagens/633144553_122098465575268562_7909383926405108006_n.jpg' },
    { name: 'Obinna Eze', text: 'Zenith Bank credited within hours. Make sure to watch everything', time: '1 hr ago', likes: 20, img: 'imagens/378224010_122096717330047007_8181527711769572442_n.jpg' },
    { name: 'Halima Suleiman', text: 'This is the best thing I found online this year 🥳', time: '1 hr ago', likes: 39, img: 'imagens/136777078_100615718676910_8451200588862452641_n.jpg' },
];

const autoComments = [
    { name: 'Kemi Ogundimu', text: 'Just watched the video now and followed the steps. Waiting for my alert 🤞', img: 'imagens/275239213_2510801525718851_5388535387086701560_n.jpg' },
    { name: 'Uche Okwu', text: 'Can confirm this is real! My Kuda account just got credited 💚', img: 'imagens/506884327_10222915475674346_2978716664044278701_n.jpg' },
    { name: 'Amina Yakubu', text: 'Who else is watching this video right now? 😂 Let\'s go!!', img: 'imagens/177855252_10222750968336285_942216712075499517_n.jpg' },
    { name: 'Damilola Osei', text: 'My third time doing this. Always pays! 🔥', img: 'imagens/651202041_2187323512007533_1314825255999908564_n.jpg' },
    { name: 'Ifeanyi Chukwuma', text: 'UBA alert just dropped! God bless TikTok 🙏🙏', img: 'imagens/649370546_26170631835923816_5927138448362823552_n.jpg' },
    { name: 'Zainab Mohammed', text: 'I told my colleagues at work and they all registered too 😄', img: 'imagens/615476926_2129489404548030_2126219030693978855_n.jpg' },
    { name: 'Segun Afolabi', text: 'Moniepoint credited me in less than 2 hours after watching the video!', img: 'imagens/578277050_4316014812052971_516386648091913289_n.jpg' },
    { name: 'Grace Onyeka', text: 'This is wonderful!! Sharing with my church group right now 🙌', img: 'imagens/464791006_8416946245027554_8107442405029223201_n.jpg' },
    { name: 'Musa Adamu', text: 'PalmPay alert just came in. No stories, this one is genuine ✅', img: 'imagens/421824917_1097267101421800_8359154587489251973_n.jpg' },
    { name: 'Temitope Balogun', text: 'I was doubting o, but see money for my account now 😂💰', img: 'imagens/411501019_3328888610743598_255394871081213996_n.jpg' },
];

let fbCommentCount = 0;
let autoCommentIndex = 0;
let autoCommentInterval = null;

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('');
}

function createCommentElement(comment, isNew) {
    const el = document.createElement('div');
    el.className = 'fb-comment' + (isNew ? ' fb-comment-new' : '');

    const likesCount = comment.likes || 0;
    const avatarContent = comment.img
        ? `<img src="${comment.img}" alt="${comment.name}">`
        : getInitials(comment.name);
    const avatarStyle = comment.img ? '' : 'style="background:#9CA3AF"';

    el.innerHTML = `
        <div class="fb-comment-avatar" ${avatarStyle}>${avatarContent}</div>
        <div class="fb-comment-body">
            <div class="fb-comment-bubble">
                <div class="fb-comment-name">${comment.name}</div>
                <div class="fb-comment-text">${comment.text}</div>
            </div>
            <div class="fb-comment-actions">
                <span class="fb-comment-action fb-action-like" data-liked="false" data-likes="${likesCount}">Like</span>
                <span class="fb-comment-action fb-action-reply">Reply</span>
                <span class="fb-comment-time">${comment.time || 'Just now'}</span>
                <span class="fb-comment-likes">${likesCount > 0 ? LIKE_SVG + ' ' + likesCount : ''}</span>
            </div>
            <div class="fb-comment-replies"></div>
        </div>
    `;

    // Like toggle
    const likeBtn = el.querySelector('.fb-action-like');
    const likesSpan = el.querySelector('.fb-comment-likes');
    likeBtn.addEventListener('click', function () {
        const isLiked = this.getAttribute('data-liked') === 'true';
        let count = parseInt(this.getAttribute('data-likes'));
        if (isLiked) {
            count--;
            this.setAttribute('data-liked', 'false');
            this.classList.remove('liked');
        } else {
            count++;
            this.setAttribute('data-liked', 'true');
            this.classList.add('liked');
        }
        this.setAttribute('data-likes', count);
        likesSpan.innerHTML = count > 0 ? LIKE_SVG + ' ' + count : '';
    });

    // Reply toggle
    const replyBtn = el.querySelector('.fb-action-reply');
    const repliesContainer = el.querySelector('.fb-comment-replies');
    replyBtn.addEventListener('click', function () {
        if (repliesContainer.querySelector('.fb-reply-input-area')) return;
        const replyArea = document.createElement('div');
        replyArea.className = 'fb-reply-input-area';
        replyArea.innerHTML = `
            <input type="text" class="fb-reply-input" placeholder="Write a reply...">
            <button class="fb-reply-send" type="button">Send</button>
        `;
        repliesContainer.appendChild(replyArea);
        const input = replyArea.querySelector('.fb-reply-input');
        input.focus();

        function submitReply() {
            const text = input.value.trim();
            if (!text) return;
            replyArea.remove();
            const replyEl = document.createElement('div');
            replyEl.className = 'fb-comment fb-comment-new';
            replyEl.innerHTML = `
                <div class="fb-comment-avatar" style="background:#9CA3AF">You</div>
                <div class="fb-comment-body">
                    <div class="fb-comment-bubble">
                        <div class="fb-comment-name">You</div>
                        <div class="fb-comment-text">${text}</div>
                    </div>
                    <div class="fb-comment-actions">
                        <span class="fb-comment-action">Like</span>
                        <span class="fb-comment-time">Just now</span>
                    </div>
                </div>
            `;
            repliesContainer.appendChild(replyEl);
        }

        replyArea.querySelector('.fb-reply-send').addEventListener('click', submitReply);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') submitReply();
        });
    });

    return el;
}

function updateCommentCounter() {
    document.getElementById('fbCommentsCount').textContent = fbCommentCount + ' comments';
}

function addAutoComment() {
    if (autoCommentIndex >= autoComments.length) autoCommentIndex = 0;
    const comment = autoComments[autoCommentIndex];
    autoCommentIndex++;

    const list = document.getElementById('fbCommentsList');
    const el = createCommentElement({ ...comment, time: 'Just now', likes: Math.floor(Math.random() * 5) }, true);
    list.insertBefore(el, list.firstChild);
    fbCommentCount++;
    updateCommentCounter();

    list.scrollTop = 0;
}

function loadFakeComments() {
    const list = document.getElementById('fbCommentsList');
    list.innerHTML = '';
    fbCommentCount = 0;

    initialComments.forEach((comment, index) => {
        setTimeout(() => {
            const el = createCommentElement(comment, false);
            list.appendChild(el);
            fbCommentCount++;
            updateCommentCounter();
        }, index * 800);
    });

    // User comment input
    const input = document.getElementById('fbCommentInput');
    const sendBtn = document.getElementById('fbCommentSend');

    function postUserComment() {
        const text = input.value.trim();
        if (!text) return;
        const el = createCommentElement({ name: 'You', text: text, time: 'Just now', likes: 0, color: '#9CA3AF' }, true);
        list.insertBefore(el, list.firstChild);
        fbCommentCount++;
        updateCommentCounter();
        input.value = '';
        list.scrollTop = 0;
    }

    sendBtn.addEventListener('click', postUserComment);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') postUserComment();
    });

    // Auto-comment every 2 minutes
    if (autoCommentInterval) clearInterval(autoCommentInterval);
    autoCommentInterval = setInterval(addAutoComment, 120000);
}

function initializeData() {
    surveyData.currentBalance = surveyData.initialBalance;
    updateBalanceDisplay(surveyData.currentBalance, false);
    updateNairaDisplay(document.getElementById('welcomeBalance'), surveyData.initialBalance);
}

// ==================== NAVEGAÇÃO ENTRE PÁGINAS ====================

function startSurvey() {
    surveyData.currentQuestionIndex = 0;
    fadeOut(welcomePage, () => {
        fadeIn(surveyPage);
        showCurrentQuestion();
    });
}

function showCompletionPage() {
    fadeOut(surveyPage, () => {
        updateNairaDisplay(finalBalance, surveyData.currentBalance);
        fadeIn(completionPage);
    });
}

/**
 * Carrega o player VSL apenas quando necessário
 */
function loadVSLPlayer() {
    if (window.vslPlayerLoaded) {
        console.log('Player VSL já foi carregado anteriormente');
        return;
    }
    const playerContainer = document.getElementById('vslPlayerContainer');
    if (!playerContainer) {
        console.error('Container do player não encontrado!');
        return;
    }
    playerContainer.innerHTML = '';

    playerContainer.innerHTML = '<vturb-smartplayer id="vid-6a78d56f874f2ac809b32400" style="display: block; margin: 0 auto; width: 100%; max-width: 400px;"><div class="vturb-player-placeholder" style="position: relative; width: 100%; padding: 133.33333333333331% 0 0; z-index: 0; background-color: black;"></div></vturb-smartplayer>';

    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = 'https://scripts.converteai.net/95f04be9-a8f6-431d-a9d6-b4e3e7e6b260/players/6a78d56f874f2ac809b32400/v4/player.js';
    s.async = true;

    s.onload = function () {
        window.vslPlayerLoaded = true;
        console.log('Script do player VSL carregado com sucesso');
    };

    s.onerror = function () {
        console.error('Erro ao carregar o script do player VSL');
    };

    document.head.appendChild(s);
}

const allPages = [
    document.getElementById('welcomePage'),
    document.getElementById('surveyPage'),
    document.getElementById('completionPage'),
    document.getElementById('withdrawalFormPage'),
    document.getElementById('withdrawalPage')
];

function hideAllPages() {
    allPages.forEach(page => {
        if (page) page.classList.add('hidden');
    });
}

function fadeOut(element, callback) {
    element.classList.add('hidden');
    if (callback) callback();
}

function fadeIn(element) {
    hideAllPages();
    element.classList.remove('hidden');
    element.classList.add('fade-in');
    setTimeout(() => {
        element.classList.remove('fade-in');
    }, 500);
}

// ==================== SISTEMA DE PERGUNTAS ====================

function stopCurrentMedia() {
    const video = mediaInner.querySelector('video');
    if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
    }
}

function renderMedia(question) {
    mediaInner.innerHTML = '';

    if (question.mediaType === 'video') {
        const video = document.createElement('video');
        video.src = question.mediaSrc;
        video.poster = question.mediaPoster || '';
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        mediaInner.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = question.mediaSrc;
        img.alt = 'Creator content';
        img.loading = 'eager';
        mediaInner.appendChild(img);
    }
}

function setSurveyControlsEnabled(enabled) {
    btnNo.disabled = !enabled;
    btnYes.disabled = !enabled;
}

function showCurrentQuestion() {
    surveyData.isAnswering = false;
    const currentQuestion = surveyData.questions[surveyData.currentQuestionIndex];

    questionText.textContent = currentQuestion.text;
    updateNairaDisplay(questionReward, currentQuestion.reward);

    const progress = ((surveyData.currentQuestionIndex + 1) / surveyData.questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `Question ${surveyData.currentQuestionIndex + 1} of ${surveyData.questions.length}`;

    stopCurrentMedia();
    renderMedia(currentQuestion);
    setSurveyControlsEnabled(true);
}

function submitAnswer(isYes) {
    if (surveyData.isAnswering) return;
    surveyData.isAnswering = true;
    setSurveyControlsEnabled(false);

    const currentQuestion = surveyData.questions[surveyData.currentQuestionIndex];
    const reward = currentQuestion.reward;

    addToBalance(reward);
    showRewardPopup(reward);

    setTimeout(() => {
        hideRewardPopup();
        stopCurrentMedia();
        surveyData.currentQuestionIndex++;

        if (surveyData.currentQuestionIndex < surveyData.questions.length) {
            showCurrentQuestion();
        } else {
            showCompletionPage();
        }
    }, 2000);
}

// ==================== GERENCIAMENTO DE SALDO ====================

function addToBalance(amount) {
    const previousBalance = surveyData.currentBalance;
    surveyData.currentBalance += amount;
    updateBalanceDisplay(surveyData.currentBalance, true, previousBalance);
}

function updateBalanceDisplay(newCoinAmount, animate = false, previousCoinAmount = null) {
    if (animate && previousCoinAmount !== null) {
        const startNaira = coinsToNaira(previousCoinAmount);
        const endNaira = coinsToNaira(newCoinAmount);
        const duration = 1000;
        const frameRate = 30;
        const steps = Math.max(1, Math.ceil(duration / (1000 / frameRate)));
        const increment = (endNaira - startNaira) / steps;

        let currentNaira = startNaira;
        let step = 0;
        const counter = setInterval(() => {
            step++;
            currentNaira += increment;
            if (step >= steps) {
                clearInterval(counter);
                currentNaira = endNaira;
            }
            balanceElement.textContent = `₦${Math.round(currentNaira).toLocaleString('en-NG')}`;
        }, 1000 / frameRate);

        balanceIndicator.classList.add('active');
        setTimeout(() => {
            balanceIndicator.classList.remove('active');
        }, 2000);
    } else {
        updateNairaDisplay(balanceElement, newCoinAmount);
    }
}

// ==================== POPUP DE RECOMPENSA ====================

function showRewardPopup(amount) {
    updateNairaDisplay(rewardAmount, amount, '+');
    overlay.classList.add('active');
    rewardPopup.classList.add('active');
    createConfetti();
    playCashRegisterSound();
}

function hideRewardPopup() {
    overlay.classList.remove('active');
    rewardPopup.classList.remove('active');
}

// ==================== SOM DE CAIXA REGISTRADORA ====================

const cashRegisterSound = new Audio('assets/modestas123123-cash-register-kaching-sound-effect-125042.mp3');

function playCashRegisterSound() {
    try {
        cashRegisterSound.currentTime = 0;
        cashRegisterSound.play();
    } catch (e) {
        // Silently fail if audio not supported
    }
}

// ==================== EFEITO DE CONFETE ====================

function createConfetti() {
    const confettiContainer = document.getElementById('confettiCanvas');
    confettiContainer.innerHTML = '';

    const colors = ['#FE2C55', '#FF4D70', '#25F4EE', '#5FF7F2', '#000000'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = `${Math.random() * 4 + 2}px`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = `-10px`;
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.opacity = Math.random() + 0.5;
        confetti.style.borderRadius = '2px';

        confettiContainer.appendChild(confetti);

        const duration = Math.random() * 2000 + 1000;
        const delay = Math.random() * 500;

        confetti.animate([
            { transform: `translate(0, 0) rotate(${Math.random() * 360}deg)`, opacity: 1 },
            { transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 200 + 200}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: duration,
            delay: delay,
            fill: 'forwards',
            easing: 'cubic-bezier(0.21, 0.98, 0.6, 0.99)'
        });
    }
}
