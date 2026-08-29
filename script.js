// Card and suit data used to build a standard 52-card deck.
const suits=[{symbol:"♠",color:"black"},{symbol:"♥",color:"red"},{symbol:"♦",color:"red"},{symbol:"♣",color:"black"}];
const ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const $=selector=>document.querySelector(selector);
const startScreen=$("#start-screen"),gameScreen=$("#game-screen"),startButton=$("#start-button"),restartButton=$("#restart-button"),resultRestartButton=$("#result-restart-button"),playButton=$("#play-button"),slapButton=$("#slap-button"),playerCount=$("#player-count"),computerCount=$("#computer-count"),playerWonCount=$("#player-won-count"),computerWonCount=$("#computer-won-count"),pileCount=$("#pile-count"),turnLabel=$("#turn-label"),playedCard=$("#played-card"),statusMessage=$("#status-message"),resultPanel=$("#result-panel"),resultTitle=$("#result-title"),resultMessage=$("#result-message");
let playerPile=[],computerPile=[],centerPile=[],playerWonPile=[],computerWonPile=[],currentTurn="player",gameOver=false,waitingForSlap=false,computerTimer=null,turnTimer=null;

function createDeck(){
  const deck=[];
  for(const suit of suits) for(const rank of ranks) deck.push({rank,suit:suit.symbol,color:suit.color});
  return deck;
}

// Fisher-Yates shuffle gives every card a random position.
function shuffle(deck){
  for(let i=deck.length-1;i>0;i--){const randomIndex=Math.floor(Math.random()*(i+1));[deck[i],deck[randomIndex]]=[deck[randomIndex],deck[i]];}
  return deck;
}

function startGame(){
  clearTimeout(computerTimer); clearTimeout(turnTimer);
  const deck=shuffle(createDeck());
  playerPile=deck.slice(0,26); computerPile=deck.slice(26); centerPile=[]; playerWonPile=[]; computerWonPile=[];
  currentTurn="player"; gameOver=false; waitingForSlap=false;
  startScreen.classList.add("hidden"); gameScreen.classList.remove("hidden"); resultPanel.classList.add("hidden");
  resetPlayedCard(); setStatus("Your turn — play your top card."); updateDisplay();
}

function resetPlayedCard(){playedCard.className="card empty-card";playedCard.innerHTML='<span class="empty-copy">No card yet</span>';}
function showCard(card){
  playedCard.className=`card ${card.color==="red"?"red":""}`;
  playedCard.innerHTML=`<span class="corner top">${card.rank}<small>${card.suit}</small></span><span class="center-suit">${card.suit}</span><span class="corner bottom">${card.rank}<small>${card.suit}</small></span>`;
}

// Moves one top card into the center, then handles a Jack or starts the next turn.
function playCard(side){
  if(gameOver||waitingForSlap||side!==currentTurn)return;
  const pile=side==="player"?playerPile:computerPile;
  if(pile.length===0){currentTurn=side==="player"?"computer":"player";beginTurn();return;}
  const card=pile.shift(); centerPile.push(card); showCard(card);
  setStatus(`${side==="player"?"You":"Computer"} played ${card.rank}${card.suit}.`); updateDisplay();
  if(card.rank==="J") openSlapWindow();
  else if(allCardsPlayed()) turnTimer=setTimeout(endGame,700);
  else {
    currentTurn=side==="player"?"computer":"player";
    updateDisplay();
    turnTimer=setTimeout(beginTurn,650);
  }
}

function beginTurn(){
  if(gameOver||waitingForSlap)return;
  if(allCardsPlayed()){endGame();return;}
  // Skip a side whose original 26-card playable pile is empty.
  if(currentTurn==="player"&&playerPile.length===0)currentTurn="computer";
  if(currentTurn==="computer"&&computerPile.length===0)currentTurn="player";
  updateDisplay();
  if(currentTurn==="player")setStatus("Your turn — play your top card.");
  else {setStatus("Computer is playing…");turnTimer=setTimeout(()=>playCard("computer"),700);}
}

function openSlapWindow(){
  waitingForSlap=true; playedCard.classList.add("jack-card"); setStatus("JACK! Slap it before the computer!","alert"); updateDisplay();
  // A varied reaction time makes the computer beatable without being predictable.
  computerTimer=setTimeout(()=>{if(waitingForSlap&&!gameOver)awardPile("computer","The computer slapped the Jack first and won the pile.");},750+Math.random()*700);
}

function handlePlayerSlap(){
  if(gameOver)return;
  const topCard=centerPile[centerPile.length-1];
  if(waitingForSlap&&topCard?.rank==="J"){clearTimeout(computerTimer);awardPile("player","Great slap! You won the center pile.");}
  else applyFalseSlapPenalty();
}

function awardPile(winner,message){
  waitingForSlap=false; clearTimeout(computerTimer); playedCard.classList.remove("jack-card");
  // Captured cards are scored separately and are never playable again.
  const wonCards=[...centerPile];
  if(winner==="player")playerWonPile.push(...wonCards);else computerWonPile.push(...wonCards);
  centerPile=[]; currentTurn=winner; setStatus(message,winner==="player"?"good":"bad"); updateDisplay();
  if(allCardsPlayed()){turnTimer=setTimeout(endGame,900);return;}
  turnTimer=setTimeout(()=>{resetPlayedCard();beginTurn();},1100);
}

function applyFalseSlapPenalty(){
  if(waitingForSlap)return;
  if(playerPile.length>0){
    // A penalty card is forfeited face-down to the center and cannot be played again.
    centerPile.push(playerPile.shift());
    setStatus("Wrong slap! One of your remaining cards was added to the center pile.","bad");
  }
  else setStatus("Wrong slap! You have no card to pay as a penalty.","bad");
  updateDisplay();
  if(allCardsPlayed()&&!waitingForSlap)turnTimer=setTimeout(endGame,700);
}

function allCardsPlayed(){return playerPile.length===0&&computerPile.length===0;}

function endGame(){
  if(gameOver)return;
  gameOver=true;waitingForSlap=false;clearTimeout(computerTimer);clearTimeout(turnTimer);
  const playerScore=playerWonPile.length,computerScore=computerWonPile.length,unclaimed=centerPile.length;
  if(playerScore>computerScore)resultTitle.textContent="You win!";
  else if(computerScore>playerScore)resultTitle.textContent="Computer wins";
  else resultTitle.textContent="It's a tie!";
  resultMessage.textContent=`Final score: You ${playerScore}, Computer ${computerScore}. ${unclaimed} card${unclaimed===1?"":"s"} remained unclaimed.`;
  resultPanel.classList.remove("hidden");updateDisplay();
}

function setStatus(message,type=""){statusMessage.textContent=message;statusMessage.className=`status-message ${type}`.trim();}
function updateDisplay(){
  playerCount.textContent=playerPile.length;computerCount.textContent=computerPile.length;playerWonCount.textContent=playerWonPile.length;computerWonCount.textContent=computerWonPile.length;pileCount.textContent=centerPile.length;
  turnLabel.textContent=gameOver?"Game over":currentTurn==="player"?"Player":"Computer";
  playButton.disabled=gameOver||waitingForSlap||currentTurn!=="player"||playerPile.length===0;
  // This stays enabled during play so early clicks can receive the false-slap penalty.
  slapButton.disabled=gameOver;
}

startButton.addEventListener("click",startGame);restartButton.addEventListener("click",startGame);resultRestartButton.addEventListener("click",startGame);
playButton.addEventListener("click",()=>playCard("player"));slapButton.addEventListener("click",handlePlayerSlap);

